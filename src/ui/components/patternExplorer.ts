import { el, nextId } from '../../lib/dom';
import { snippetForStep, type Step } from '../../music/arrangement';
import { chordFor } from '../../music/chords';
import { otherStyle, STRING_NAMES, STYLE_LABEL, TAB_STRING_ORDER } from '../../music/constants';
import { countLabel } from '../../music/patterns';
import { REST, type Song, type StepToken, type Style } from '../../music/types';
import { pickTargets, resolvePickString, voiceStep } from '../../music/voicing';
import { arrangeForPlayback } from '../../tracks/timing';
import type { View } from '../types';
import { createPlayButton, playSnippet } from './playButton';
import { controlGroup, segmented, TEMPO_OPTIONS, type TempoValue } from './segmented';
import { createTrackMixer } from './trackMixer';

const ARROWS = { down: '↓', up: '↑', rest: '·' } as const;

const LEGEND: Readonly<Record<Style, string>> = {
  strum:
    'Big ↓ is a down-strum across all the strings. Small ↑ is a lighter up-strum that only brushes the thin strings. A dot means your hand keeps moving but misses the strings. Click any column to hear it.',
  pick: 'Each line is a string, thinnest on top. A number tells you which fret to hold (0 = open string); a coloured number is plucked on that count. Only one or two strings sound at a time. Click any column to hear it.',
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
    label: 'Play the pattern',
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
    if (step.token === REST) return 'no strum, hand keeps moving';
    if (style === 'strum') return `${step.token === 'D' ? 'down' : 'up'}-strum on ${step.chord}`;
    const chord = chordFor(step.chord);
    const strings = pickTargets(step.token).map(target => STRING_NAMES[resolvePickString(chord, target)]);
    return `pluck the ${strings.join(' and ')} string${strings.length > 1 ? 's' : ''} of ${step.chord}`;
  }

  function stepBody(step: Step, onBeat: boolean): Node | Node[] {
    if (style === 'strum') {
      const kind = step.token === 'D' ? 'down' : step.token === 'U' ? 'up' : 'rest';
      return el('span', { class: `cell arrow ${kind}`, 'aria-hidden': 'true' }, ARROWS[kind]);
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
        'aria-label': `Count ${count}: ${describe(step)}`,
        onClick: () => playSnippet(snippetForStep(song, step.chord, step.token as StepToken, style)),
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
        ? `This is how the song is played. Switch to ${STYLE_LABEL[otherStyle(style)].toLowerCase()} to hear the same chords played the other way.`
        : `For comparison only: the song itself uses ${STYLE_LABEL[song.technique].toLowerCase()}. Hear how different the same chords sound.`;
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
    label: STYLE_LABEL[value] + (value === song.technique ? ' (song)' : ''),
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
        'Hear it',
        segmented(styleOptions, style, value => {
          style = value;
          restartIfPlaying();
        }),
      ),
      controlGroup(
        'Speed',
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
        'Loop',
      ),
    ),
    mixer.node,
    song.capo
      ? el(
          'p',
          { class: 'hint' },
          `Capo on fret ${song.capo}. Fret numbers count up from the capo, as if it were the end of the neck.`,
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
