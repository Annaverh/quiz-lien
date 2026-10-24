import { describe, expect, it } from 'vitest';
import { countLabel, formatStrumPattern, parseStrumPattern } from './patterns';
import { SONGS, toSong } from './songs';
import { REST } from './types';

describe('parseStrumPattern', () => {
  it('reads big and small strums and rests, ignoring spaces and bar lines', () => {
    expect(parseStrumPattern('Dn du | Uu')).toEqual(['D', REST, 'd', 'u', 'U', 'u']);
  });

  it('rejects unknown letters with a helpful message', () => {
    expect(() => parseStrumPattern('DxU')).toThrow('Unknown strum letter "x"');
  });

  it('round-trips through formatStrumPattern', () => {
    expect(formatStrumPattern(parseStrumPattern('Dn Du nu Du'), 2)).toBe('Dn Du nu Du');
  });
});

describe('countLabel', () => {
  const base = SONGS.find(s => s.stepsPerBeat === 2)!;

  it('counts eighths, sixteenths and 6/8', () => {
    expect([0, 1, 2, 3].map(i => countLabel(base, i))).toEqual(['1', '&', '2', '&']);
    const sixteenths = toSong({ ...base, stepsPerBeat: 4, pattern: 'Dnnn Dnun nnun Dnun' });
    expect([0, 1, 2, 3, 4].map(i => countLabel(sixteenths, i))).toEqual(['1', 'e', '&', 'a', '2']);
    const sixEight = SONGS.find(s => s.stepsPerBeat === 3)!;
    expect([0, 5].map(i => countLabel(sixEight, i))).toEqual(['1', '6']);
  });
});
