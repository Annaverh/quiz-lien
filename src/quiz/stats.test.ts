import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadStats } from './stats';

const withStored = (value: string): void => {
  vi.stubGlobal('localStorage', { getItem: () => value, setItem: () => undefined, removeItem: () => undefined });
};

describe('loadStats', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads valid stats', () => {
    withStored('{"best":{"technique":{"score":4,"total":6}},"rounds":3}');
    expect(loadStats()).toEqual({ best: { technique: { score: 4, total: 6 } }, rounds: 3 });
  });

  it('drops malformed entries instead of trusting them', () => {
    withStored('{"best":{"technique":{"score":"4","total":6},"changes":{"score":2,"total":0},"bogus":{}},"rounds":-1}');
    expect(loadStats()).toEqual({ best: {}, rounds: 0 });
  });

  it('falls back when the stored value is not an object', () => {
    withStored('[1,2]');
    expect(loadStats()).toEqual({ best: {}, rounds: 0 });
  });
});
