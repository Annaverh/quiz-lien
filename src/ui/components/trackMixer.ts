import { engine } from '../../audio/engine';
import type { TrackCue } from '../../audio/types';
import { el, nextId } from '../../lib/dom';
import type { Song } from '../../music/types';
import { mix } from '../../tracks/mix';
import { songTiming, trackSrc } from '../../tracks/timing';

export interface TrackMixer {
  node: HTMLElement;
  setTempo(tempo: number): void;
  setVisible(visible: boolean): void;
  /** The recording to play under a fragment at `tempo`, or null when it can't join in. */
  trackFor(tempo: number): TrackCue | null;
  destroy(): void;
}

/**
 * Volume slider for the real recording under the app guitar. It appears once the song's
 * recording has loaded, and only at song speed: a slowed-down guitar would drift off the record.
 */
export function createTrackMixer(song: Song, { visible = true } = {}): TrackMixer {
  let buffer: AudioBuffer | null = null;
  let tempo = 1;
  let shown = visible;
  let alive = true;

  const id = nextId('mix');
  const output = el('output', { for: id });
  const slider = el('input', {
    type: 'range',
    id,
    min: 0,
    max: 100,
    step: 1,
    onInput: (event: Event) => mix.set(Number((event.target as HTMLInputElement).value) / 100),
  });
  const sliderRow = el(
    'div',
    { class: 'mixer' },
    el('label', { for: id }, 'Real song'),
    slider,
    output,
    el('span', { class: 'hint' }, 'The recording plays under the app guitar. Slide to the left to hear only the app.'),
  );
  const slowNote = el('p', { class: 'hint' }, 'The real song plays along at song speed only.');
  const node = el('div', { class: 'mixer-wrap' }, sliderRow, slowNote);

  const render = (level: number): void => {
    slider.value = String(Math.round(level * 100));
    output.textContent = level === 0 ? 'Off' : `${Math.round(level * 100)}%`;
  };
  const unsubscribe = mix.subscribe(render);
  render(mix.level);

  function update(): void {
    node.hidden = !buffer || !shown;
    sliderRow.hidden = tempo !== 1;
    slowNote.hidden = tempo === 1;
  }
  update();

  void engine.loadTrack(trackSrc(song)).then(loaded => {
    if (!alive) return;
    buffer = loaded;
    update();
  });

  return {
    node,
    setTempo(next) {
      tempo = next;
      update();
    },
    setVisible(next) {
      shown = next;
      update();
    },
    trackFor(atTempo) {
      return buffer && atTempo === 1 ? { buffer, start: songTiming(song).start } : null;
    },
    destroy() {
      alive = false;
      unsubscribe();
    },
  };
}
