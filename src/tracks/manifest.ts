export interface TrackEntry {
  /** Path of the recording, relative to the page (files live in public/audio/). */
  file: string;
  /** Second in the file where the fragment's first chord lands; 0 if the clip starts there. */
  start?: number;
  /** The record's tempo, when it differs from the arrangement's. */
  bpm?: number;
}

/**
 * Recordings of the real songs, keyed by song id. Find `start` and `bpm` with
 * "Origineel gelijkzetten" on a song's Study page, then paste the copied line here.
 * See public/audio/README.md.
 */
export const TRACKS: Readonly<Record<string, TrackEntry>> = {
  // 'wonderwall': { file: 'audio/wonderwall.mp3', start: 12.34, bpm: 87.0 },
  delilah: { file: 'audio/delilah.mp3', start: 0 },
  hallelujah: { file: 'audio/hallelujah.mp3', start: 0 },
  'wish-you-were-here': { file: 'audio/wish-you-were-here.mp3', start: 0 },
};
