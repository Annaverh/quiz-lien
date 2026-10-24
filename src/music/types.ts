import type { ChordName } from './chords';

export type Style = 'strum' | 'pick';
export type StringIndex = 0 | 1 | 2 | 3 | 4 | 5;
/** Fret per string, thickest (low E) first; MUTED for a string that isn't played. */
export type Frets = readonly [number, number, number, number, number, number];

export interface Chord {
  readonly frets: Frets;
  /** String holding the root note. */
  readonly bass: StringIndex;
  /** String a picking thumb alternates to. */
  readonly alt: StringIndex;
}

export const REST = '-';
export type Rest = typeof REST;

/** Strum tokens: down, up, or a rest where the hand keeps moving without hitting the strings. */
export type StrumToken = 'D' | 'U' | Rest;
/** Pick targets: the chord's bass string, its alternate bass string, or a string index. */
export type PickString = 'B' | 'A' | StringIndex;
/** A single string, several plucked together (a pinch), or a rest. */
export type PickToken = PickString | readonly PickString[] | Rest;
export type StepToken = StrumToken | PickToken;

/** Steps per beat: eighth notes in 4/4 (2) or in 6/8 felt as two beats per bar (3). */
export type StepsPerBeat = 2 | 3;
export type Era = 'Classic' | '90s' | 'Modern';

export interface SongDefinition {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly year: number;
  readonly era: Era;
  readonly technique: Style;
  readonly bpm: number;
  /** Capo fret, so the app plays in the record's key. */
  readonly capo?: number;
  readonly beatsPerBar: number;
  readonly stepsPerBeat: StepsPerBeat;
  /** One bar of the song's own pattern; it repeats through the fragment. */
  readonly pattern: readonly StepToken[];
  readonly progression: readonly (readonly [ChordName, number])[];
  /** How hard the chord changes are to hear, 1 (clear) to 3 (subtle). */
  readonly changeLevel: 1 | 2 | 3;
  readonly howItsPlayed: string;
  readonly listenFor: string;
}

export interface Song extends SongDefinition {
  readonly capo: number;
  readonly totalBeats: number;
}

export interface NoteEvent {
  /** Seconds from the start of playback. */
  time: number;
  end: number;
  string: StringIndex;
  fret: number;
  midi: number;
  velocity: number;
}
