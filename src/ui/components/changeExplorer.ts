import { el, nextId } from '../../lib/dom';
import { chordSegments, snippetForChord } from '../../music/arrangement';
import type { ChordName } from '../../music/chords';
import type { Song } from '../../music/types';
import { arrangeForPlayback } from '../../tracks/timing';
import type { View } from '../types';
import type { BeatGrid } from './beatGrid';
import { chordDiagram } from './chordDiagram';
import { createPlayButton, playSnippet } from './playButton';
import { controlGroup, segmented, TEMPO_OPTIONS, type TempoValue } from './segmented';
import { createTrackMixer } from './trackMixer';

/** Listening tools for the chord changes. Drives a grid that already shows the chords. */
export function createChangeExplorer(song: Song, grid: BeatGrid, { showMixer = true } = {}): View {
  let tempo: TempoValue = '1';
  let chime = true;
  const segments = chordSegments(song);
  const chips = new Map<ChordName, HTMLElement>();
  const mixer = createTrackMixer(song, { visible: showMixer });

  const player = createPlayButton({
    label: 'Play with change bells',
    getPlayable: () => ({
      ...arrangeForPlayback(song, { tempo: Number(tempo), chime }),
      track: mixer.trackFor(Number(tempo)),
    }),
    onStep: info => {
      const beat = info ? info.beat : -1;
      grid.setNow(beat);
      const current = beat >= 0 ? segments.findLast(s => s.start <= beat) : undefined;
      for (const [name, chip] of chips) chip.classList.toggle('is-now', current?.chord === name);
    },
  });

  const distinct = [...new Set(segments.map(s => s.chord))];
  const chordShelf = el(
    'div',
    { class: 'chord-shelf' },
    distinct.map(name => {
      const chip = el(
        'button',
        {
          type: 'button',
          class: 'chord-chip',
          'aria-label': `Hear ${name}`,
          onClick: () => playSnippet(snippetForChord(song, name)),
        },
        chordDiagram(name),
        el('strong', {}, name),
        el('small', {}, 'Tap to hear'),
      );
      chips.set(name, chip);
      return chip;
    }),
  );

  const chimeId = nextId('chime');
  const node = el(
    'div',
    { class: 'learn-body' },
    el('p', {}, song.listenFor),
    el(
      'div',
      { class: 'controls' },
      player.node,
      el(
        'label',
        { class: 'check', for: chimeId },
        el('input', {
          type: 'checkbox',
          id: chimeId,
          checked: true,
          onChange: (event: Event) => {
            chime = (event.target as HTMLInputElement).checked;
          },
        }),
        'Ring a bell on each change',
      ),
      controlGroup(
        'Speed',
        segmented(TEMPO_OPTIONS, tempo, value => {
          tempo = value;
          mixer.setTempo(Number(value));
        }),
      ),
    ),
    mixer.node,
    el(
      'p',
      { class: 'hint' },
      'Hear each chord on its own. Notice how the lowest note is different for each one: that is the easiest thing to listen for.',
    ),
    chordShelf,
  );

  return {
    node,
    destroy() {
      player.stop();
      mixer.destroy();
    },
  };
}
