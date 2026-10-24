export interface TrackEntry {
  /** Path of the recording, relative to the page (files live in public/audio/). */
  file: string;
  /** Second in the file where the fragment's first chord lands; 0 if the clip starts there. */
  start?: number;
  /** The record's tempo, when it differs from the arrangement's. */
  bpm?: number;
  /** How far the record is tuned from A = 440 Hz, in cents; the app guitar follows it. */
  cents?: number;
}

/**
 * Recordings of the real songs, keyed by song id. Each clip starts about 5 s before the
 * fragment; `start`, `bpm` and `cents` were measured from the recording itself. To redo one,
 * use "Origineel gelijkzetten" on the song's Study page and paste the copied line here.
 * See public/audio/README.md.
 */
export const TRACKS: Readonly<Record<string, TrackEntry>> = {
  wonderwall: { file: 'audio/wonderwall.mp3', start: 5.0, bpm: 87.11, cents: 5 },
  'good-riddance': { file: 'audio/good-riddance.mp3', start: 1.62, bpm: 96.19, cents: 9 },
  knockin: { file: 'audio/knockin.mp3', start: 5.0, bpm: 69.87, cents: 3 },
  'rising-sun': { file: 'audio/rising-sun.mp3', start: 5.0, bpm: 81.84, cents: 28 },
  'dust-wind': { file: 'audio/dust-wind.mp3', start: 2.21, bpm: 93.39 },
  riptide: { file: 'audio/riptide.mp3', start: 5.0, bpm: 101.16, cents: -31 },
  perfect: { file: 'audio/perfect.mp3', start: 3.86, bpm: 63.41, cents: 2 },
  'let-her-go': { file: 'audio/let-her-go.mp3', start: 5.0, bpm: 75.0, cents: 18 },
  horse: { file: 'audio/horse.mp3', start: 5.0, bpm: 119.55, cents: -17 },
  'wish-you-were-here': { file: 'audio/wish-you-were-here.mp3', start: 5.0, bpm: 60.84, cents: 12 },
  landslide: { file: 'audio/landslide.mp3', start: 5.0, bpm: 74.71, cents: 3 },
  hallelujah: { file: 'audio/hallelujah.mp3', start: 5.0, bpm: 53.75, cents: 1 },
  'im-yours': { file: 'audio/im-yours.mp3', start: 5.0, bpm: 75.24, cents: -4 },
  delilah: { file: 'audio/delilah.mp3', start: 5.0, bpm: 104.12, cents: 5 },
  'fast-car': { file: 'audio/fast-car.mp3', start: 5.0, bpm: 100.21, cents: 7 },
};
