import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../lib/random';
import { SONGS } from '../music/songs';
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
  it('falls back to the arrangement when there is no recording or override', () => {
    const song = SONGS[0]!;
    expect(songTiming(song)).toEqual({ start: 0, bpm: song.bpm, isCustom: false });
  });
});
