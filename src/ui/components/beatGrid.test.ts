// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { chordSegments } from '../../music/arrangement';
import { SONGS } from '../../music/songs';
import { scoreChanges } from '../../quiz/scoring';
import { createBeatGrid } from './beatGrid';

const wonderwall = SONGS.find(s => s.id === 'wonderwall')!;

describe('createBeatGrid', () => {
  it('renders one cell per beat, and beat 1 is never clickable', () => {
    const onToggle = vi.fn();
    const grid = createBeatGrid(wonderwall, { onToggle });
    const cells = grid.node.querySelectorAll('.beat');
    expect(cells).toHaveLength(16);
    expect(cells[0]!.tagName).toBe('DIV');
    (cells[5] as HTMLButtonElement).click();
    expect(onToggle).toHaveBeenCalledWith(5);
  });

  it('shows marks, chords and results', () => {
    const grid = createBeatGrid(wonderwall, { onToggle: () => undefined });
    grid.setMarks(new Set([4, 9]));
    expect(grid.node.querySelectorAll('.is-marked')).toHaveLength(2);

    grid.showChords(chordSegments(wonderwall));
    expect([...grid.node.querySelectorAll('.tag')].map(t => t.textContent).filter(Boolean)).toEqual([
      'Em7',
      'G',
      'Dsus4',
      'A7sus4',
      'Em7',
      'G',
      'Dsus4',
      'A7sus4',
    ]);

    grid.showResult(scoreChanges([4, 8, 12], [4, 9]));
    expect(grid.node.querySelectorAll('.res-hit')).toHaveLength(1);
    expect(grid.node.querySelectorAll('.res-near')).toHaveLength(1);
    expect(grid.node.querySelectorAll('.res-miss')).toHaveLength(1);

    grid.lock();
    expect([...grid.node.querySelectorAll('button')].every(b => b.disabled)).toBe(true);
  });
});
