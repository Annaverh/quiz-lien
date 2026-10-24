import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../lib/random';
import { SONGS, toSong } from '../music/songs';
import { TRACKS } from './manifest';
import { fitBeats, songTiming } from './timing';

describe('fitBeats', () => {
  it('recovers start and tempo from steady taps', () => {
    const taps = Array.from({ length: 8 }, (_, i) => 12.5 + (i * 60) / 87);
    const fit = fitBeats(taps);
    expect(fit.start).toBeCloseTo(12.5, 6);
    expect(fit.bpm).toBeCloseTo(87, 6);
    expect(fit.spread).toBeCloseTo(0, 6);
  });

  it('averages out human timing errors', () => {
    const random = mulberry32(9);
    const taps = Array.from({ length: 16 }, (_, i) => 3 + (i * 60) / 100 + (random() - 0.5) * 0.06);
    const fit = fitBeats(taps);
    expect(Math.abs(fit.start - 3)).toBeLessThan(0.03);
    expect(Math.abs(fit.bpm - 100)).toBeLessThan(1);
  });

  it('needs at least two taps', () => {
    expect(() => fitBeats([1])).toThrow(RangeError);
  });
});

describe('songTiming', () => {
  it('uses the measured timing of a song with a recording', () => {
    const song = SONGS.find(s => s.id === 'wonderwall')!;
    expect(songTiming(song)).toEqual({ start: TRACKS.wonderwall!.start, bpm: TRACKS.wonderwall!.bpm, isCustom: false });
  });

  it('falls back to the arrangement when there is no recording or override', () => {
    const song = toSong({ ...SONGS[0]!, id: 'not-recorded' });
    expect(songTiming(song)).toEqual({ start: 0, bpm: song.bpm, isCustom: false });
  });
});

describe('track manifest', () => {
  const ids = new Set(SONGS.map(s => s.id));
  const recordings = new Set(
    Object.keys(import.meta.glob('../../public/audio/*.mp3')).map(path => path.split('/public/')[1]),
  );

  it.each(Object.entries(TRACKS))('%s points at an existing recording of a known song', (id, track) => {
    expect(ids.has(id)).toBe(true);
    expect(recordings.has(track.file)).toBe(true);
    expect(track.start).toBeGreaterThanOrEqual(0);
  });

  it('keeps tempos close to the arrangements', () => {
    for (const [id, track] of Object.entries(TRACKS)) {
      const song = SONGS.find(s => s.id === id)!;
      expect(Math.abs((track.bpm ?? song.bpm) / song.bpm - 1)).toBeLessThan(0.05);
    }
  });
});
