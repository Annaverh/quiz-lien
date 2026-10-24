import { hashString, mulberry32 } from '../lib/random';
import { chordFor, type ChordName } from './chords';
import { TUNING } from './constants';
import { patternFor } from './patterns';
import type { Chord, NoteEvent, Song, StepToken, StringIndex, Style } from './types';
import { soundingStrings, voiceStep } from './voicing';

/** A note rings at most this long before it fades by itself. */
export const MAX_RING_SECONDS = 3;
/** A strum landing this close after a chord change belongs to the new chord. */
const CHANGE_MARGIN_SECONDS = 0.02;
/** Time it takes the fretting hand to lift off a string at a chord change. */
const LIFT_SECONDS = 0.015;
const HUMANIZE_SECONDS = 0.008;

export interface Segment {
  chord: ChordName;
  /** First beat of the chord. */
  start: number;
  length: number;
}

export interface Step {
  index: number;
  beat: number;
  chord: ChordName;
  token: StepToken;
  time: number;
}

export interface Click {
  time: number;
  accent: boolean;
}

export interface ArrangeOptions {
  style?: Style;
  /** Fraction of song speed. */
  tempo?: number;
  /** Tempo of the record at full speed; defaults to the arrangement's own. */
  bpm?: number;
  /** Length of the fragment in beats. */
  beats?: number;
  /** Clicks before the fragment starts. */
  countIn?: number;
  /** A bell on every chord change. */
  chime?: boolean;
  /** Pitch offset in cents, to match a recording that isn't tuned to A = 440 Hz. */
  cents?: number;
}

export interface Arrangement {
  song: Song;
  style: Style;
  tempo: number;
  beats: number;
  beatDur: number;
  stepDur: number;
  stepsPerBeat: number;
  /** Count-in length in seconds; the fragment's first beat starts here. */
  leadIn: number;
  totalSteps: number;
  duration: number;
  steps: Step[];
  notes: NoteEvent[];
  segments: Segment[];
  /** Beats where a new chord starts (never beat 0). */
  changes: number[];
  clicks: Click[];
  chimes: { time: number }[];
}

/** Consecutive identical chords merge, so a held chord never counts as a "change". */
export function chordSegments(song: Song, beats = song.totalBeats): Segment[] {
  const segments: Segment[] = [];
  let start = 0;
  for (const [chord, length] of song.progression) {
    if (start >= beats) break;
    const clipped = Math.min(length, beats - start);
    const last = segments.at(-1);
    if (last?.chord === chord) last.length += clipped;
    else segments.push({ chord, start, length: clipped });
    start += length;
  }
  return segments;
}

export const changeBeats = (segments: readonly Segment[]): number[] => segments.slice(1).map(s => s.start);

/** Everything needed to play and display a fragment. Times are seconds from the start of playback. */
export function arrange(song: Song, options: ArrangeOptions = {}): Arrangement {
  const {
    style = song.technique,
    tempo = 1,
    bpm = song.bpm,
    beats = song.totalBeats,
    countIn = 0,
    chime = false,
    cents = 0,
  } = options;
  const pattern = patternFor(song, style);
  const beatDur = 60 / (bpm * tempo);
  const stepDur = beatDur / song.stepsPerBeat;
  const totalSteps = beats * song.stepsPerBeat;
  const leadIn = countIn * beatDur;
  const segments = chordSegments(song, beats);
  const random = mulberry32(hashString(`${song.id}:${style}`));

  const steps: Step[] = [];
  const notes: NoteEvent[] = [];
  let segmentIndex = 0;
  for (let i = 0; i < totalSteps; i++) {
    const beat = Math.floor(i / song.stepsPerBeat);
    while (segmentIndex < segments.length - 1 && beat >= (segments[segmentIndex + 1]?.start ?? Infinity)) {
      segmentIndex++;
    }
    const chordName = (segments[segmentIndex] as Segment).chord;
    const chord = chordFor(chordName);
    const token = pattern[i % pattern.length] as StepToken;
    const time = leadIn + i * stepDur;
    steps.push({ index: i, beat, chord: chordName, token, time });

    const humanize = (random() - 0.5) * HUMANIZE_SECONDS;
    for (const voice of voiceStep(chord, token, style, i % song.stepsPerBeat === 0)) {
      notes.push(noteFor(song, chord, voice.string, Math.max(0, time + voice.offset + humanize), voice.velocity));
    }
  }

  dampNotes(
    notes,
    segments.slice(1).map(s => ({ time: leadIn + s.start * beatDur, chord: chordFor(s.chord) })),
  );

  const changes = changeBeats(segments);
  return {
    song,
    style,
    tempo,
    beats,
    beatDur,
    stepDur,
    stepsPerBeat: song.stepsPerBeat,
    leadIn,
    totalSteps,
    duration: leadIn + totalSteps * stepDur,
    steps,
    notes: detune(notes, cents),
    segments,
    changes,
    clicks: Array.from({ length: countIn }, (_, k) => ({ time: k * beatDur, accent: k === 0 })),
    chimes: chime ? changes.map(beat => ({ time: leadIn + beat * beatDur })) : [],
  };
}

function noteFor(
  song: Song,
  chord: Chord,
  string: StringIndex,
  time: number,
  velocity: number,
  ring = MAX_RING_SECONDS,
) {
  const fret = chord.frets[string];
  return { time, end: time + ring, string, fret, midi: TUNING[string] + song.capo + fret, velocity };
}

/** A string stops ringing when it is played again, or when the fretting hand moves for a new chord. */
export function dampNotes(notes: NoteEvent[], changes: readonly { time: number; chord: Chord }[]): void {
  notes.sort((a, b) => a.time - b.time);
  const lastOnString = new Map<StringIndex, NoteEvent>();
  for (const note of notes) {
    const previous = lastOnString.get(note.string);
    if (previous) previous.end = Math.min(previous.end, note.time);
    lastOnString.set(note.string, note);
  }
  for (const note of notes) {
    for (const change of changes) {
      if (change.time <= note.time + CHANGE_MARGIN_SECONDS) continue;
      if (change.time >= note.end) break;
      if (change.chord.frets[note.string] !== note.fret) {
        note.end = change.time + LIFT_SECONDS;
        break;
      }
    }
  }
}

/** Shifts notes by `cents` (100 cents = one semitone); MIDI numbers may then be fractional. */
export const detune = (notes: NoteEvent[], cents: number): NoteEvent[] =>
  cents ? notes.map(note => ({ ...note, midi: note.midi + cents / 100 })) : notes;

const SNIPPET_RING_SECONDS = 2.4;
const ROLL_SPACING_SECONDS = 0.17;

/** One step on its own, for clicking a column of the tab. */
export function snippetForStep(song: Song, chordName: ChordName, token: StepToken, style: Style): NoteEvent[] {
  const chord = chordFor(chordName);
  return voiceStep(chord, token, style, true).map(v =>
    noteFor(song, chord, v.string, v.offset, v.velocity, SNIPPET_RING_SECONDS),
  );
}

/** A whole chord, the way the song plays it: one strum, or a slow roll up the strings. */
export function snippetForChord(song: Song, chordName: ChordName): NoteEvent[] {
  if (song.technique === 'strum') return snippetForStep(song, chordName, 'D', 'strum');
  const chord = chordFor(chordName);
  return soundingStrings(chord).map((string, k) =>
    noteFor(song, chord, string, k * ROLL_SPACING_SECONDS, k === 0 ? 0.95 : 0.75, SNIPPET_RING_SECONDS),
  );
}
