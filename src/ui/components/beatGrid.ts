import { el } from '../../lib/dom';
import type { Segment } from '../../music/arrangement';
import type { Song } from '../../music/types';
import type { ChangeResult } from '../../quiz/scoring';

export interface BeatGrid {
  node: HTMLElement;
  setMarks(marks: ReadonlySet<number>): void;
  flash(beat: number): void;
  setNow(beat: number): void;
  showChords(segments: readonly Segment[]): void;
  showResult(result: ChangeResult): void;
  lock(): void;
}

/** One box per beat, grouped in bars. Interactive when `onToggle` is given (beat 0 never is). */
export function createBeatGrid(song: Song, { onToggle }: { onToggle?: (beat: number) => void } = {}): BeatGrid {
  const cells: HTMLElement[] = [];
  const bars: HTMLElement[] = [];
  const barCount = song.totalBeats / song.beatsPerBar;

  for (let bar = 0; bar < barCount; bar++) {
    const barCells: HTMLElement[] = [];
    for (let k = 0; k < song.beatsPerBar; k++) {
      const beat = bar * song.beatsPerBar + k;
      const isStart = beat === 0;
      const label = `Maat ${bar + 1}, tel ${k + 1}`;
      const content = [
        el('span', { class: 'tag' }),
        el('span', { class: 'num' }, String(k + 1)),
        el('span', { class: 'mark' }),
      ];
      const className = isStart ? 'beat is-start' : 'beat';
      const cell =
        onToggle && !isStart
          ? el(
              'button',
              {
                type: 'button',
                class: className,
                'aria-pressed': 'false',
                'aria-label': label,
                onClick: () => onToggle(beat),
              },
              content,
            )
          : el(
              'div',
              {
                class: className,
                role: 'img',
                'aria-label': isStart ? `${label}: hier begint het eerste akkoord` : label,
              },
              content,
            );
      cells.push(cell);
      barCells.push(cell);
    }
    bars.push(el('div', { class: 'bar', style: `--bpb:${song.beatsPerBar}` }, barCells));
  }

  const node = el('div', { class: 'beat-grid' }, bars);
  let nowBeat = -1;
  const cell = (beat: number): HTMLElement | undefined => cells[beat];

  return {
    node,
    setMarks(marks) {
      cells.forEach((c, beat) => {
        const marked = marks.has(beat);
        c.classList.toggle('is-marked', marked);
        if (c instanceof HTMLButtonElement) c.setAttribute('aria-pressed', String(marked));
      });
    },
    flash(beat) {
      const target = cell(beat);
      if (!target) return;
      target.classList.remove('is-flash');
      void target.offsetWidth; // restart the CSS animation
      target.classList.add('is-flash');
    },
    setNow(beat) {
      if (beat === nowBeat) return;
      cell(nowBeat)?.classList.remove('is-now');
      nowBeat = beat;
      cell(nowBeat)?.classList.add('is-now');
    },
    showChords(segments) {
      segments.forEach((segment, i) => {
        for (let beat = segment.start; beat < segment.start + segment.length; beat++) {
          const target = cell(beat);
          target?.classList.add(i % 2 === 0 ? 'seg-a' : 'seg-b');
          target?.classList.remove('is-start');
        }
        const first = cell(segment.start);
        const tag = first?.querySelector('.tag');
        if (tag) tag.textContent = segment.chord;
        if (i > 0) first?.classList.add('is-change');
      });
    },
    showResult(result) {
      for (const beat of result.exact) cell(beat)?.classList.add('res-hit', 'is-marked');
      for (const { mark } of result.near) cell(mark)?.classList.add('res-near', 'is-marked');
      for (const beat of result.extra) cell(beat)?.classList.add('res-extra', 'is-marked');
      for (const beat of result.missed) cell(beat)?.classList.add('res-miss');
    },
    lock() {
      for (const c of cells) if (c instanceof HTMLButtonElement) c.disabled = true;
    },
  };
}

export function changeLegend(): HTMLElement {
  const item = (color: string, text: string, dashed = false): HTMLElement =>
    el('span', {}, el('i', { style: dashed ? `border:2px dashed ${color}` : `background:${color}` }), text);
  return el(
    'div',
    { class: 'legend' },
    item('var(--good)', 'Precies op de wissel'),
    item('var(--near)', 'Eén tel ernaast (telt mee)'),
    item('var(--bad)', 'Gemiste wissel', true),
    item('var(--bad)', 'Daar was geen wissel'),
  );
}
