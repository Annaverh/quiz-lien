import { el, nextId } from '../../lib/dom';
import { snippetForStep, type Step } from '../../music/arrangement';
import { chordFor } from '../../music/chords';
import { otherStyle, STRING_NAMES, STYLE_LABEL, STYLE_PARTICIPLE, TAB_STRING_ORDER } from '../../music/constants';
import { countLabel } from '../../music/patterns';
import { REST, type Song, type StepToken, type Style } from '../../music/types';
import { isBigStrum, pickTargets, resolvePickString, strumDirection, voiceStep } from '../../music/voicing';
import { arrangeForPlayback, tuneToRecord } from '../../tracks/timing';
import type { View } from '../types';
import { createPlayButton, playSnippet } from './playButton';
import { controlGroup, segmented, TEMPO_OPTIONS, type TempoValue } from './segmented';
import { createTrackMixer } from './trackMixer';

const ARROWS = { down: '↓', up: '↑' } as const;
const STRUM_NAMES = { down: 'neerslag', up: 'opslag' } as const;

const LEGEND: Readonly<Record<Style, string>> = {
  strum:
    'Een grote pijl is een volle slag over (bijna) alle snaren, een kleine pijl een lichte slag over alleen de dunne snaren. ↓ is een neerslag, ↑ een opslag. Bij een puntje beweegt je hand mee maar mist hij de snaren. Klik op een kolom om hem te horen.',
  pick: 'Elke lijn is een snaar, de dunste bovenaan. Het getal zegt welke fret je indrukt (0 = losse snaar); een gekleurd getal tokkel je op die tel. Er klinken maar één of twee snaren tegelijk. Klik op een kolom om hem te horen.',
};

/** Interactive tab of the song's pattern: play, loop, slow down, compare styles, click a step to hear it. */
export function createPatternExplorer(song: Song, { showMixer = true } = {}): View {
  let style: Style = song.technique;
  let tempo: TempoValue = '1';
  let loop = false;
  let stepNodes: HTMLElement[] = [];
  let nowNode: HTMLElement | null = null;

  const board = el('div', { class: 'tab-board' });
  const legend = el('p', { class: 'hint' });
  const compareNote = el('p', { class: 'hint' });
  const mixer = createTrackMixer(song, { visible: showMixer });

  const player = createPlayButton({
    label: 'Speel het patroon',
    getPlayable: () => ({
      ...arrangeForPlayback(song, { style, tempo: Number(tempo) }),
      track: mixer.trackFor(Number(tempo)),
    }),
    onStep: info => highlight(info ? info.step : -1),
    loop: () => loop,
  });

  function highlight(step: number): void {
    nowNode?.classList.remove('is-now');
    nowNode = stepNodes[step] ?? null;
    nowNode?.classList.add('is-now');
  }

  function describe(step: Step): string {
    if (step.token === REST) return 'geen slag, hand beweegt mee';
    const direction = strumDirection(step.token);
    if (direction) return `${isBigStrum(step.token) ? 'grote' : 'kleine'} ${STRUM_NAMES[direction]} op ${step.chord}`;
    const chord = chordFor(step.chord);
    const strings = pickTargets(step.token).map(target => STRING_NAMES[resolvePickString(chord, target)]);
    return `tokkel de ${strings.join('- en ')}-${strings.length > 1 ? 'snaren' : 'snaar'} van ${step.chord}`;
  }

  function stepBody(step: Step, onBeat: boolean): Node | Node[] {
    if (style === 'strum') {
      const direction = strumDirection(step.token);
      if (!direction) return el('span', { class: 'cell arrow rest', 'aria-hidden': 'true' }, '·');
      const size = isBigStrum(step.token) ? 'big' : 'small';
      return el('span', { class: `cell arrow ${direction} ${size}`, 'aria-hidden': 'true' }, ARROWS[direction]);
    }
    const chord = chordFor(step.chord);
    const voices = voiceStep(chord, step.token, 'pick', onBeat);
    return TAB_STRING_ORDER.map(string => {
      const hit = voices.some(v => v.string === string);
      return el(
        'span',
        { class: hit ? 'cell str has-note' : 'cell str', 'aria-hidden': 'true' },
        el('span', { class: 'fret' }, hit ? String(chord.frets[string]) : ''),
      );
    });
  }

  function stepColumn(step: Step, positionInBar: number, showChord: boolean): HTMLElement {
    const onBeat = positionInBar % song.stepsPerBeat === 0;
    const count = countLabel(song, positionInBar);
    return el(
      'button',
      {
        type: 'button',
        class: 'tab-step',
        'aria-label': `Tel ${count}: ${describe(step)}`,
        onClick: () =>
          playSnippet(tuneToRecord(song, snippetForStep(song, step.chord, step.token as StepToken, style))),
      },
      el('span', { class: 'cell chord' }, showChord ? step.chord : ''),
      stepBody(step, onBeat),
      el('span', { class: onBeat ? 'cell count on-beat' : 'cell count' }, count),
    );
  }

  const labelColumn = (): HTMLElement =>
    el(
      'div',
      { class: 'tab-labels', 'aria-hidden': 'true' },
      el('span', { class: 'cell chord' }),
      style === 'pick'
        ? TAB_STRING_ORDER.map(s => el('span', { class: 'cell str-label' }, STRING_NAMES[s]))
        : el('span', { class: 'cell arrow' }),
      el('span', { class: 'cell count' }),
    );

  function render(): void {
    const { steps } = arrangeForPlayback(song, { style });
    const barSize = song.beatsPerBar * song.stepsPerBeat;
    stepNodes = [];
    nowNode = null;

    const bars: HTMLElement[] = [];
    for (let start = 0; start < steps.length; start += barSize) {
      const columns = steps.slice(start, start + barSize).map((step, k) => {
        const showChord = k === 0 || steps[start + k - 1]?.chord !== step.chord;
        const column = stepColumn(step, k, showChord);
        stepNodes.push(column);
        return column;
      });
      bars.push(el('div', { class: 'tab-bar' }, labelColumn(), columns));
    }
    board.dataset.style = style;
    board.replaceChildren(...bars);

    legend.textContent = LEGEND[style];
    compareNote.textContent =
      style === song.technique
        ? `Zo wordt het nummer gespeeld. Kies ${STYLE_LABEL[otherStyle(style)].toLowerCase()} om dezelfde akkoorden op de andere manier te horen.`
        : `Alleen ter vergelijking: in het nummer zelf wordt ${STYLE_PARTICIPLE[song.technique]}. Hoor hoe anders dezelfde akkoorden klinken.`;
  }

  function restartIfPlaying(): void {
    const wasPlaying = player.playback !== null;
    player.stop();
    render();
    if (wasPlaying) void player.start();
  }

  render();

  const loopId = nextId('loop');
  const styleOptions = (['strum', 'pick'] as const).map(value => ({
    value,
    label: STYLE_LABEL[value] + (value === song.technique ? ' (nummer)' : ''),
  }));

  const node = el(
    'div',
    { class: 'learn-body' },
    el('p', {}, song.howItsPlayed),
    el(
      'div',
      { class: 'controls' },
      player.node,
      controlGroup(
        'Speelwijze',
        segmented(styleOptions, style, value => {
          style = value;
          restartIfPlaying();
        }),
      ),
      controlGroup(
        'Tempo',
        segmented(TEMPO_OPTIONS, tempo, value => {
          tempo = value;
          mixer.setTempo(Number(value));
          restartIfPlaying();
        }),
      ),
      el(
        'label',
        { class: 'check', for: loopId },
        el('input', {
          type: 'checkbox',
          id: loopId,
          onChange: (event: Event) => {
            loop = (event.target as HTMLInputElement).checked;
          },
        }),
        'Herhalen',
      ),
    ),
    mixer.node,
    song.capo
      ? el(
          'p',
          { class: 'hint' },
          `Capo op fret ${song.capo}. De fretnummers tellen vanaf de capo, alsof daar de hals begint.`,
        )
      : null,
    el('div', { class: 'tab-scroll' }, board),
    legend,
    compareNote,
  );

  return {
    node,
    destroy() {
      player.stop();
      mixer.destroy();
    },
  };
}
