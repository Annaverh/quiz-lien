import { describe, expect, it } from 'vitest';
import { SONGS, toSong } from './songs';
import { REST } from './types';
import { findLibraryProblems } from './validate';

describe('song library', () => {
  it('has no data problems', () => {
    expect(findLibraryProblems(SONGS)).toEqual([]);
  });

  it('has both techniques represented, enough for a balanced round', () => {
    expect(SONGS.filter(s => s.technique === 'strum').length).toBeGreaterThanOrEqual(3);
    expect(SONGS.filter(s => s.technique === 'pick').length).toBeGreaterThanOrEqual(3);
  });

  it('reports a pick target on a muted string', () => {
    const broken = toSong({
      ...(SONGS.find(s => s.id === 'good-riddance') ?? SONGS[0]!),
      id: 'broken',
      // String 0 is muted in C.
      pattern: [0, 3, 4, 3, 'A', 3, 4, 3],
      progression: [
        ['C', 4],
        ['G', 4],
      ],
    });
    expect(findLibraryProblems([broken])).toContainEqual(expect.stringContaining('muted string in C'));
  });

  it('reports a string picked twice in a row', () => {
    const broken = toSong({
      ...(SONGS.find(s => s.id === 'good-riddance') ?? SONGS[0]!),
      id: 'repeat',
      // In D the alternate bass is the G string, which the step after it plays again.
      pattern: ['B', 3, 4, 3, 'A', 3, 4, 5],
      progression: [
        ['D', 4],
        ['G', 4],
      ],
    });
    expect(findLibraryProblems([broken])).toContainEqual(expect.stringContaining('both play string 3 in D'));
  });

  it('reports a picked chord change that does not start on the bass', () => {
    const broken = toSong({
      ...(SONGS.find(s => s.id === 'good-riddance') ?? SONGS[0]!),
      id: 'offbass',
      pattern: ['B', 3, 4, 3, 'A', 4, 5, 4],
      progression: [
        ['G', 2],
        ['C', 2],
      ],
    });
    expect(findLibraryProblems([broken])).toContainEqual(expect.stringContaining('C on beat 2 does not start'));
  });

  it('reports a pattern of the wrong length and a half-filled bar', () => {
    const broken = toSong({
      ...SONGS.find(s => s.id === 'knockin')!,
      id: 'short',
      pattern: ['D', REST, 'D'],
      progression: [
        ['G', 4],
        ['C', 2],
      ],
    });
    const problems = findLibraryProblems([broken]);
    expect(problems).toContainEqual(expect.stringContaining('strum pattern must have 8 steps'));
    expect(problems).toContainEqual(expect.stringContaining('does not fill whole bars'));
  });
});
