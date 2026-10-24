import { describe, expect, it } from 'vitest';
import { chordFor } from './chords';
import { REST } from './types';
import { soundingStrings, voiceStep } from './voicing';

describe('voiceStep', () => {
  const c = chordFor('C'); // x32010

  it('down-strums every sounding string, thick to thin', () => {
    const voices = voiceStep(c, 'D', 'strum', true);
    expect(voices.map(v => v.string)).toEqual([1, 2, 3, 4, 5]);
    expect(voices.map(v => v.offset)).toEqual([...voices.map(v => v.offset)].sort((a, b) => a - b));
  });

  it('small up-strums brush the three thinnest strings, thin to thick, softly', () => {
    const voices = voiceStep(c, 'u', 'strum', false);
    expect(voices.map(v => v.string)).toEqual([5, 4, 3]);
    expect(Math.max(...voices.map(v => v.velocity))).toBeLessThan(voiceStep(c, 'D', 'strum', true)[0]!.velocity);
  });

  it('big strums cover more strings than small ones', () => {
    expect(voiceStep(c, 'U', 'strum', false).map(v => v.string)).toEqual([5, 4, 3, 2, 1]);
    expect(voiceStep(c, 'd', 'strum', false).map(v => v.string)).toEqual([2, 3, 4, 5]);
    expect(voiceStep(chordFor('G'), 'D', 'strum', true)).toHaveLength(6);
  });

  it('plays nothing on a rest', () => {
    expect(voiceStep(c, REST, 'strum', true)).toEqual([]);
    expect(voiceStep(c, REST, 'pick', true)).toEqual([]);
  });

  it('resolves bass and alternate-bass picks to the chord strings', () => {
    expect(voiceStep(c, 'B', 'pick', true).map(v => v.string)).toEqual([1]);
    expect(voiceStep(chordFor('D'), 'A', 'pick', true).map(v => v.string)).toEqual([3]);
  });

  it('plucks a pinch together and skips muted strings', () => {
    expect(voiceStep(c, ['B', 5], 'pick', true).map(v => v.string)).toEqual([1, 5]);
    expect(voiceStep(c, 0, 'pick', true)).toEqual([]);
  });

  it('lists sounding strings', () => {
    expect(soundingStrings(chordFor('D'))).toEqual([2, 3, 4, 5]);
  });
});
