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
      `${result.near.length === 1 ? 'One mark was' : `${result.near.length} marks were`} one beat off. That still counts; try to land right on the new chord.`,
    );
  }
  if (result.missed.length)
    tips.push('For the ones you missed, listen for the lowest note: when it jumps, the chord has changed.');
  if (result.extra.length) {
    tips.push(
      'Some marks landed where the chord stayed the same. A new strum or note is not a change unless the chord itself sounds different.',
    );
  }
  if (!tips.length) tips.push('Great ears. Try a harder song next.');

  if (!result.correct)
    return { tone: 'bad', headline: `You found ${foundCount(result)} of ${total} changes.`, tips: tips.join(' ') };
  return result.near.length
    ? { tone: 'near', headline: `You found all ${total} changes!`, tips: tips.join(' ') }
    : { tone: 'good', headline: `Spot on: all ${total} changes!`, tips: tips.join(' ') };
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
    'You can also click a beat in the grid to add or remove a mark.',
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
    'Change!',
    el('small', {}, 'Tap here, or press the space bar'),
  );
  const checkButton = el(
    'button',
    { type: 'button', class: 'btn primary', disabled: true, onClick: check },
    'Check my answer',
  );
  const clearButton = el(
    'button',
    {
      type: 'button',
      class: 'btn small',
      onClick: () => {
        marks.clear();
        grid.setMarks(marks);
        status.textContent = 'Marks cleared.';
      },
    },
    'Clear marks',
  );

  const listen = createPlayButton({
    label: 'Listen',
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
      el('span', { class: 'label' }, 'Count-in'),
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
      status.textContent = 'Press Listen first, then tap along while it plays.';
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
    status.textContent = `Marked bar ${bar}, beat ${(beat % song.beatsPerBar) + 1}.`;
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
    listen.setLabel('Listen again');
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
        el('summary', {}, 'Explore the chord changes'),
        explorer.node,
      ),
      el('div', { class: 'action-row' }, el('span', { class: 'spacer' }), nextButton(app, round)),
    );
    reveal.hidden = false;
  }

  const help =
    song.beatsPerBar === 2
      ? 'This one swings in a count of six, felt as two big beats per bar. After the count-in, tap Change! every time a new chord starts.'
      : 'Each box is one beat; four beats make a bar. After the count-in, tap Change! every time a new chord starts.';

  const node = el(
    'section',
    { class: 'card', 'aria-labelledby': 'q-title' },
    questionKicker(round, 'changes'),
    el('h2', { class: 'q-title', id: 'q-title' }, 'When does the chord change?'),
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
