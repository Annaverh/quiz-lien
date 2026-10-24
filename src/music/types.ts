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

/**
 * Strum tokens: D big down-strum (all strings), d small down-strum (thin strings, softer),
 * U big up-strum, u small up-strum (only the thinnest strings), or a rest where the hand
 * keeps moving without hitting the strings.
 */
export type StrumToken = 'D' | 'd' | 'U' | 'u' | Rest;
/** A string counted up from the chord's bass string: '+1' is the next thinner string. */
export type AboveBass = '+1' | '+2' | '+3' | '+4';
/** Pick targets: the chord's bass string, its alternate bass string, a string above the bass, or a string index. */
export type PickString = 'B' | 'A' | AboveBass | StringIndex;
/** A single string, several plucked together (a pinch), or a rest. */
export type PickToken = PickString | readonly PickString[] | Rest;
export type StepToken = StrumToken | PickToken;

/** Steps per beat: eighth notes in 4/4 (2), sixteenth notes in 4/4 (4), or eighths in 6/8 felt as two beats per bar (3). */
export type StepsPerBeat = 2 | 3 | 4;
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
  /**
   * One bar of the song's own pattern; it repeats through the fragment. Strumming is written
   * as text, one letter per step: D/d big/small down, U/u big/small up, n nothing. Spaces are
   * ignored, so 'Dn Du nu Du' reads as four beats. Picking is a list of pick tokens.
   */
  readonly pattern: string | readonly StepToken[];
  /** Pattern for when the song is played the other way (picked instead of strummed, or back); defaults to a generic one. */
  readonly otherPattern?: string | readonly StepToken[];
  readonly progression: readonly (readonly [ChordName, number])[];
  /** How hard the chord changes are to hear, 1 (clear) to 3 (subtle). */
  readonly changeLevel: 1 | 2 | 3;
  readonly listenFor: string;
}

export interface Song extends Omit<SongDefinition, 'pattern' | 'otherPattern'> {
  readonly pattern: readonly StepToken[];
  readonly otherPattern?: readonly StepToken[];
  readonly capo: number;
  readonly totalBeats: number;
}

export interface NoteEvent {
  /** Seconds from the start of playback. */
  time: number;
  end: number;
  string: StringIndex;
  fret: number;
  /** Pitch as a MIDI note number; fractional when tuned to a recording. */
  midi: number;
  velocity: number;
}
