import { el } from '../../lib/dom';
import { changeBeats, chordSegments, type Arrangement } from '../../music/arrangement';
import type { Song } from '../../music/types';
import type { Round } from '../../quiz/round';
import { foundCount, scoreChanges, type ChangeResult } from '../../quiz/scoring';
import { arrangeForPlayback } from '../../tracks/timing';
import { changeLegend, createBeatGrid } from '../components/beatGrid';
import { createChangeExplorer } from '../components/changeExplorer';
import { bindSpaceTap, pulse } from '../components/keyboard';
import { createPlayButton } from '../components/playButton';
import { songMeta } from '../components/songMeta';
import { createTrackMixer } from '../components/trackMixer';
import type { AppActions, View } from '../types';
import { nextButton, questionKicker, resultBanner, type BannerTone } from './question';

/** Typical delay between hearing a change and tapping; subtracted before snapping a tap to a beat. */
const REACTION_SECONDS = 0.12;

function feedback(result: ChangeResult, total: number): { tone: BannerTone; headline: string; tips: string } {
  const tips: string[] = [];
  if (result.near.length) {
    tips.push(
      `${result.near.length === 1 ? 'Eén markering zat' : `${result.near.length} markeringen zaten`} een tel naast de wissel. Dat telt mee, maar probeer precies op het nieuwe akkoord te tikken.`,
    );
  }
  if (result.missed.length)
    tips.push(
      'Bij de wissels die je miste: luister naar de laagste noot. Verspringt die, dan is het akkoord gewisseld.',
    );
  if (result.extra.length) {
    tips.push(
      'Sommige markeringen stonden waar het akkoord hetzelfde bleef. Een nieuwe slag of noot is pas een wissel als het akkoord zelf anders klinkt.',
    );
  }
  if (!tips.length) tips.push('Goed gehoord!');

  if (!result.correct)
    return { tone: 'bad', headline: `Je vond ${foundCount(result)} van de ${total} wissels.`, tips: tips.join(' ') };
  return result.near.length
    ? { tone: 'near', headline: `Je vond alle ${total} wissels!`, tips: tips.join(' ') }
    : { tone: 'good', headline: `Precies raak: alle ${total} wissels!`, tips: tips.join(' ') };
}

export function changesQuestionView(app: AppActions, round: Round, song: Song): View {
  const marks = new Set<number>();
  const countInBeats = song.beatsPerBar === 2 ? 4 : song.beatsPerBar;
  let checked = false;
  let current: Arrangement | null = null;
  let explorer: View | null = null;
  const mixer = createTrackMixer(song, { visible: false });

  const grid = createBeatGrid(song, { onToggle: toggleMark });
  const countIn = el('div', { class: 'countin' });
  const status = el(
    'p',
    { class: 'hint', 'aria-live': 'polite' },
    'Je kunt ook op een tel klikken om een markering te zetten of weg te halen.',
  );
  const tapButton = el(
    'button',
    {
      type: 'button',
      class: 'tap-btn',
      disabled: true,
      onPointerdown: (event: Event) => {
        event.preventDefault();
        tap();
      },
      // Keyboard users press Enter here; the space bar is handled for the whole page.
      onKeydown: (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          tap();
        }
      },
    },
    'Wissel!',
    el('small', {}, 'Tik hier of druk op de spatiebalk'),
  );
  const checkButton = el(
    'button',
    { type: 'button', class: 'btn primary', disabled: true, onClick: check },
    'Controleer',
  );
  const clearButton = el(
    'button',
    {
      type: 'button',
      class: 'btn small',
      onClick: () => {
        marks.clear();
        grid.setMarks(marks);
        status.textContent = 'Markeringen gewist.';
      },
    },
    'Wis markeringen',
  );

  const listen = createPlayButton({
    label: 'Luister',
    variant: 'big',
    getPlayable: () => ({
      ...arrangeForPlayback(song, { countIn: checked ? 0 : countInBeats }),
      track: checked ? mixer.trackFor(1) : null,
    }),
    onStart: arrangement => {
      current = arrangement;
      if (!checked) {
        tapButton.disabled = false;
        checkButton.disabled = false;
      }
    },
    onStep: info => {
      renderCountIn(info?.countIn ?? -1);
      grid.setNow(info?.beat ?? -1);
    },
    onEnd: () => {
      current = null;
    },
  });

  function renderCountIn(active: number): void {
    countIn.replaceChildren(
      el('span', { class: 'label' }, 'Aftellen'),
      ...Array.from({ length: countInBeats }, (_, k) =>
        el('span', { class: k === active ? 'dot is-on' : 'dot' }, String(k + 1)),
      ),
    );
  }
  renderCountIn(-1);

  function toggleMark(beat: number): void {
    if (checked) return;
    if (!marks.delete(beat)) marks.add(beat);
    grid.setMarks(marks);
  }

  function tap(): void {
    if (checked) return;
    const playback = listen.playback;
    if (!playback || !current) {
      status.textContent = 'Druk eerst op Luister en tik mee terwijl het speelt.';
      return;
    }
    const { leadIn, beatDur, beats } = current;
    const beat = Math.round((playback.position - leadIn - REACTION_SECONDS) / beatDur);
    if (beat < 1 || beat >= beats) return;
    marks.add(beat);
    grid.setMarks(marks);
    grid.flash(beat);
    pulse(tapButton);
    const bar = Math.floor(beat / song.beatsPerBar) + 1;
    status.textContent = `Gemarkeerd: maat ${bar}, tel ${(beat % song.beatsPerBar) + 1}.`;
  }

  const unbindSpace = bindSpaceTap(() => !checked, tap);

  const tapArea = el('div', { class: 'stack-sm' }, tapButton, status);
  const actionRow = el('div', { class: 'action-row' }, clearButton, el('span', { class: 'spacer' }), checkButton);
  const reveal = el('div', { class: 'reveal', hidden: true });

  function check(): void {
    if (checked) return;
    checked = true;
    listen.stop();
    const segments = chordSegments(song);
    const changes = changeBeats(segments);
    const result = scoreChanges(changes, marks);
    round.record({ correct: result.correct, detail: { kind: 'changes', marks: [...marks], result } });
    app.refreshTopbar();

    grid.lock();
    grid.showChords(segments);
    grid.showResult(result);
    tapArea.hidden = true;
    actionRow.hidden = true;
    countIn.hidden = true;
    listen.setLabel('Luister opnieuw');
    mixer.setVisible(true);

    const { tone, headline, tips } = feedback(result, changes.length);
    explorer = createChangeExplorer(song, grid, { showMixer: false });
    reveal.replaceChildren(
      resultBanner(tone, result.correct, headline, tips),
      changeLegend(),
      songMeta(song),
      mixer.node,
      el(
        'details',
        { class: 'learn', open: !result.correct },
        el('summary', {}, 'Bekijk de akkoordwissels'),
        explorer.node,
      ),
      el('div', { class: 'action-row' }, el('span', { class: 'spacer' }), nextButton(app, round)),
    );
    reveal.hidden = false;
  }

  const help =
    song.beatsPerBar === 2
      ? 'Dit nummer wiegt in een telling van zes, gevoeld als twee grote tellen per maat. Tik na het aftellen op Wissel! zodra er een nieuw akkoord begint.'
      : 'Elk vakje is één tel en vier tellen vormen een maat. Tik na het aftellen op Wissel! zodra er een nieuw akkoord begint.';

  const node = el(
    'section',
    { class: 'card', 'aria-labelledby': 'q-title' },
    questionKicker(round, 'changes'),
    el('h2', { class: 'q-title', id: 'q-title' }, 'Wanneer wisselt het akkoord?'),
    el('p', { class: 'q-help' }, help),
    el('div', { class: 'listen-row' }, listen.node, countIn),
    grid.node,
    tapArea,
    actionRow,
    reveal,
  );

  return {
    node,
    destroy() {
      unbindSpace();
      listen.stop();
      mixer.destroy();
      explorer?.destroy?.();
    },
  };
}
