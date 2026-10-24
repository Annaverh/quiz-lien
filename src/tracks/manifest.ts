export interface TrackEntry {
  /** File name of the recording in src/assets/audio/. */
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
 * See src/assets/audio/README.md.
 */
export const TRACKS: Readonly<Record<string, TrackEntry>> = {
  wonderwall: { file: 'wonderwall.mp3', start: 5.0, bpm: 87.11, cents: 5 },
  'good-riddance': { file: 'good-riddance.mp3', start: 1.62, bpm: 96.19, cents: 9 },
  knockin: { file: 'knockin.mp3', start: 5.0, bpm: 69.87, cents: 3 },
  'rising-sun': { file: 'rising-sun.mp3', start: 5.0, bpm: 81.84, cents: 28 },
  'dust-wind': { file: 'dust-wind.mp3', start: 5.0, bpm: 93.87 },
  riptide: { file: 'riptide.mp3', start: 5.0, bpm: 101.16, cents: -31 },
  perfect: { file: 'perfect.mp3', start: 5.0, bpm: 63.37, cents: 2 },
  'let-her-go': { file: 'let-her-go.mp3', start: 5.0, bpm: 75.0, cents: 18 },
  horse: { file: 'horse.mp3', start: 5.0, bpm: 119.55, cents: -17 },
  'wish-you-were-here': { file: 'wish-you-were-here.mp3', start: 5.0, bpm: 60.84, cents: 12 },
  landslide: { file: 'landslide.mp3', start: 5.0, bpm: 74.71, cents: 3 },
  hallelujah: { file: 'hallelujah.mp3', start: 5.0, bpm: 53.75, cents: 1 },
  'im-yours': { file: 'im-yours.mp3', start: 5.0, bpm: 75.24, cents: -4 },
  delilah: { file: 'delilah.mp3', start: 5.0, bpm: 104.12, cents: 5 },
  'fast-car': { file: 'fast-car.mp3', start: 5.0, bpm: 100.21, cents: 7 },
};
