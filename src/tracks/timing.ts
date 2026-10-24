import { storage } from '../lib/storage';
import { arrange, detune, type Arrangement, type ArrangeOptions } from '../music/arrangement';
import type { NoteEvent, Song } from '../music/types';
import { TRACKS, type TrackEntry } from './manifest';

const TIMING_KEY = 'quiz-lien/timing/v3';

export interface SongTiming {
  /** Second in the recording where the fragment starts. */
  start: number;
  bpm: number;
  /** True when this browser overrides the published timing. */
  isCustom: boolean;
}

type TimingOverrides = Record<string, Partial<Pick<TrackEntry, 'start' | 'bpm'>>>;

export const trackSrc = (song: Song): string | null => TRACKS[song.id]?.file ?? null;

function overrides(): TimingOverrides {
  const value = storage.read<unknown>(TIMING_KEY, {});
  return value && typeof value === 'object' ? (value as TimingOverrides) : {};
}

const finite = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/** Timing for a song: this browser's override, then the manifest, then the arrangement's defaults. */
export function songTiming(song: Song): SongTiming {
  const published = TRACKS[song.id];
  const local = overrides()[song.id] ?? {};
  const localStart = finite(local.start);
  const localBpm = finite(local.bpm);
  return {
    start: localStart ?? finite(published?.start) ?? 0,
    bpm: localBpm ?? finite(published?.bpm) ?? song.bpm,
    isCustom: localStart !== null || localBpm !== null,
  };
}

export function saveTiming(song: Song, { start, bpm }: { start: number; bpm: number }): void {
  const all = overrides();
  all[song.id] = { start: Math.round(Math.max(0, start) * 1000) / 1000, bpm: Math.round(bpm * 100) / 100 };
  storage.write(TIMING_KEY, all);
}

export function resetTiming(song: Song): void {
  const remaining = Object.fromEntries(Object.entries(overrides()).filter(([id]) => id !== song.id));
  storage.write(TIMING_KEY, remaining);
}

/** The record's tuning offset in cents (0 without a recording). */
export const recordCents = (song: Song): number => finite(TRACKS[song.id]?.cents) ?? 0;

/** Arranges at the record's tempo and tuning, so the app guitar can play along with the recording. */
export const arrangeForPlayback = (song: Song, options: Omit<ArrangeOptions, 'bpm' | 'cents'> = {}): Arrangement =>
  arrange(song, { ...options, bpm: songTiming(song).bpm, cents: recordCents(song) });

/** Tunes a one-off snippet (one strum, one chord) to the record. */
export const tuneToRecord = (song: Song, notes: NoteEvent[]): NoteEvent[] => detune(notes, recordCents(song));

export interface BeatFit {
  /** Time of the first tap's beat. */
  start: number;
  bpm: number;
  /** Largest distance of any tap from the fitted beat, in seconds. */
  spread: number;
}

/** Least-squares line through tap times, one tap per beat: gives the first beat and the tempo. */
export function fitBeats(times: readonly number[]): BeatFit {
  const n = times.length;
  if (n < 2) throw new RangeError('fitBeats needs at least two taps');
  const meanX = (n - 1) / 2;
  const meanY = times.reduce((sum, t) => sum + t, 0) / n;
  let sxy = 0;
  let sxx = 0;
  times.forEach((t, i) => {
    sxy += (i - meanX) * (t - meanY);
    sxx += (i - meanX) ** 2;
  });
  const beatDur = sxy / sxx;
  const start = meanY - beatDur * meanX;
  const spread = Math.max(...times.map((t, i) => Math.abs(t - (start + beatDur * i))));
  return { start, bpm: 60 / beatDur, spread };
}
