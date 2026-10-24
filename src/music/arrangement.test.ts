import { describe, expect, it } from 'vitest';
import { arrange, chordSegments, dampNotes } from './arrangement';
import { chordFor } from './chords';
import { TUNING } from './constants';
import { SONGS, toSong } from './songs';
import type { NoteEvent, Song } from './types';

const song = (id: string): Song => {
  const found = SONGS.find(s => s.id === id);
  if (!found) throw new Error(`no song ${id}`);
  return found;
};

describe('chordSegments', () => {
  it('merges a chord that is repeated across bars', () => {
    const segments = chordSegments(song('rising-sun'));
    expect(segments.at(-1)).toEqual({ chord: 'E', start: 12, length: 4 });
  });

  it('clips to a shorter fragment', () => {
    expect(chordSegments(song('knockin'), 6)).toEqual([
      { chord: 'G', start: 0, length: 2 },
      { chord: 'D', start: 2, length: 2 },
      { chord: 'Am7', start: 4, length: 2 },
    ]);
  });
});

describe('arrange', () => {
  it('lays out one step per eighth note and finds the chord changes', () => {
    const result = arrange(song('wonderwall'));
    expect(result.totalSteps).toBe(32);
    expect(result.steps).toHaveLength(32);
    expect(result.changes).toEqual([4, 8, 12]);
    expect(result.duration).toBeCloseTo((16 * 60) / 87);
  });

  it('starts the fragment after the count-in and clicks once per beat', () => {
    const result = arrange(song('wonderwall'), { countIn: 4 });
    expect(result.leadIn).toBeCloseTo(result.beatDur * 4);
    expect(result.clicks.map(c => c.accent)).toEqual([true, false, false, false]);
    expect(Math.min(...result.notes.map(n => n.time))).toBeGreaterThanOrEqual(result.leadIn - 0.01);
  });

  it('uses the record tempo and slows down with the tempo factor', () => {
    const base = arrange(song('wonderwall'));
    expect(arrange(song('wonderwall'), { bpm: 174 }).beatDur).toBeCloseTo(base.beatDur / 2);
    expect(arrange(song('wonderwall'), { tempo: 0.5 }).beatDur).toBeCloseTo(base.beatDur * 2);
  });

  it('transposes by the capo', () => {
    const capoed = song('wonderwall');
    const open = toSong({ ...capoed, capo: 0 });
    const first = (s: Song): NoteEvent => arrange(s).notes[0]!;
    expect(first(capoed).midi - first(open).midi).toBe(2);
    expect(first(open).midi).toBe(TUNING[first(open).string] + first(open).fret);
  });

  it('adds a bell on every change only when asked', () => {
    expect(arrange(song('perfect')).chimes).toEqual([]);
    const withBells = arrange(song('perfect'), { chime: true });
    expect(withBells.chimes).toHaveLength(withBells.changes.length);
    expect(withBells.changes).toEqual([4, 8, 12]);
  });

  it('plays the same notes every time', () => {
    expect(arrange(song('delilah')).notes).toEqual(arrange(song('delilah')).notes);
  });
});

describe('dampNotes', () => {
  const note = (string: NoteEvent['string'], fret: number, time: number): NoteEvent => ({
    time,
    end: time + 3,
    string,
    fret,
    midi: TUNING[string] + fret,
    velocity: 1,
  });

  it('stops a string when it is played again', () => {
    const notes = [note(3, 0, 0), note(3, 0, 1)];
    dampNotes(notes, []);
    expect(notes[0]!.end).toBe(1);
  });

  it('lifts a string at a chord change only when its fret changes', () => {
    // C → Am: the B string (4) stays on fret 1; the A string (1) moves from fret 3 to open.
    const keeps = note(4, 1, 0);
    const moves = note(1, 3, 0);
    dampNotes([keeps, moves], [{ time: 2, chord: chordFor('Am') }]);
    expect(keeps.end).toBe(3);
    expect(moves.end).toBeCloseTo(2.015);
  });
});

describe('detune', () => {
  it('shifts every note by the given cents and leaves the original untouched', () => {
    const notes = arrange(song('rising-sun')).notes;
    const tuned = arrange(song('rising-sun'), { cents: 28 }).notes;
    expect(tuned.map(n => n.midi - 0.28)).toEqual(notes.map(n => expect.closeTo(n.midi, 9)));
    expect(arrange(song('rising-sun')).notes).toEqual(notes);
  });
});
