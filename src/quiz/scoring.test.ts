import { describe, expect, it } from 'vitest';
import { foundCount, scoreChanges } from './scoring';

describe('scoreChanges', () => {
  it('is correct when every change is marked exactly', () => {
    const result = scoreChanges([4, 8, 12], [4, 8, 12]);
    expect(result).toMatchObject({ exact: [4, 8, 12], near: [], missed: [], extra: [], correct: true });
  });

  it('accepts a mark one beat off as near', () => {
    const result = scoreChanges([4, 8], [5, 8]);
    expect(result.near).toEqual([{ change: 4, mark: 5 }]);
    expect(result.correct).toBe(true);
    expect(foundCount(result)).toBe(2);
  });

  it('reports missed changes and extra marks', () => {
    const result = scoreChanges([4, 8, 12], [4, 10]);
    expect(result.missed).toEqual([8, 12]);
    expect(result.extra).toEqual([10]);
    expect(result.correct).toBe(false);
  });

  it('uses each mark for one change only', () => {
    // Changes two beats apart: the mark on 3 may only count once.
    const result = scoreChanges([2, 4], [3]);
    expect(result.near).toHaveLength(1);
    expect(result.missed).toHaveLength(1);
  });

  it('prefers exact matches before near ones', () => {
    // 5 is exact for the change at 5, so it can't be spent as "near" for 4.
    const result = scoreChanges([4, 5], [5]);
    expect(result.exact).toEqual([5]);
    expect(result.missed).toEqual([4]);
  });
});
