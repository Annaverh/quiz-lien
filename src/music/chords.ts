import { MUTED as X } from './constants';
import type { Chord } from './types';

/** Open-position chord shapes, frets listed from the thickest string. */
export const CHORDS = {
  G: { frets: [3, 2, 0, 0, 3, 3], bass: 0, alt: 2 },
  C: { frets: [X, 3, 2, 0, 1, 0], bass: 1, alt: 2 },
  D: { frets: [X, X, 0, 2, 3, 2], bass: 2, alt: 3 },
  Am: { frets: [X, 0, 2, 2, 1, 0], bass: 1, alt: 2 },
  Am7: { frets: [X, 0, 2, 0, 1, 0], bass: 1, alt: 2 },
  Em: { frets: [0, 2, 2, 0, 0, 0], bass: 0, alt: 2 },
  Em7: { frets: [0, 2, 2, 0, 3, 3], bass: 0, alt: 2 },
  E: { frets: [0, 2, 2, 1, 0, 0], bass: 0, alt: 2 },
  F: { frets: [1, 3, 3, 2, 1, 1], bass: 0, alt: 2 },
  Dsus4: { frets: [X, X, 0, 2, 3, 3], bass: 2, alt: 3 },
  A7sus4: { frets: [X, 0, 2, 0, 3, 3], bass: 1, alt: 2 },
  Cmaj7: { frets: [X, 3, 2, 0, 0, 0], bass: 1, alt: 2 },
  Cadd9: { frets: [X, 3, 2, 0, 3, 0], bass: 1, alt: 2 },
  'D6/9': { frets: [2, 0, 0, 2, 0, 0], bass: 0, alt: 2 },
  'D/F#': { frets: [2, X, 0, 2, 3, 2], bass: 0, alt: 2 },
  'G/B': { frets: [X, 2, 0, 0, 0, 3], bass: 1, alt: 2 },
  'F#m': { frets: [2, 4, 4, 2, 2, 2], bass: 0, alt: 2 },
} as const satisfies Record<string, Chord>;

export type ChordName = keyof typeof CHORDS;

export const chordFor = (name: ChordName): Chord => CHORDS[name];
