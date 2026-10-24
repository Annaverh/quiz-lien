import { describe, expect, it } from 'vitest';
import { midiToFrequency, renderPluck } from './synthesis';

const SAMPLE_RATE = 44100;

/** Strongest repeat period near the expected pitch, by autocorrelation. */
function detectFrequency(samples: Float32Array, expected: number): number {
  const window = samples.subarray(4410, 4410 + 8192);
  let bestLag = 0;
  let best = -Infinity;
  for (let lag = Math.floor(SAMPLE_RATE / (expected * 1.3)); lag < SAMPLE_RATE / (expected * 0.77); lag++) {
    let sum = 0;
    for (let i = 0; i < window.length - lag; i++) sum += window[i]! * window[i + lag]!;
    if (sum > best) {
      best = sum;
      bestLag = lag;
    }
  }
  return SAMPLE_RATE / bestLag;
}

describe('renderPluck', () => {
  it.each([40, 45, 50, 55, 59, 64])('is in tune for MIDI note %i', midi => {
    const expected = midiToFrequency(midi);
    // Autocorrelation works in whole samples, so allow ~1%.
    expect(detectFrequency(renderPluck(SAMPLE_RATE, midi, 0.5), expected) / expected).toBeCloseTo(1, 1);
  });

  it('decays and never clips', () => {
    const samples = renderPluck(SAMPLE_RATE, 52, 2);
    const peak = (from: number, to: number): number => Math.max(...samples.subarray(from, to).map(Math.abs));
    expect(peak(0, samples.length)).toBeLessThanOrEqual(0.8 + 1e-6);
    expect(peak(SAMPLE_RATE * 1.5, SAMPLE_RATE * 2)).toBeLessThan(peak(0, SAMPLE_RATE * 0.1) / 4);
  });

  it('is deterministic', () => {
    expect(renderPluck(SAMPLE_RATE, 60, 0.1)).toEqual(renderPluck(SAMPLE_RATE, 60, 0.1));
  });
});
