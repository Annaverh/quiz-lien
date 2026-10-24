export interface ChangeResult {
  /** Changes marked on the right beat. */
  exact: number[];
  /** Changes marked one beat early or late. */
  near: { change: number; mark: number }[];
  missed: number[];
  /** Marks where the chord didn't change. */
  extra: number[];
  correct: boolean;
}

/**
 * Matches marked beats to real chord changes, one mark per change. An exact beat is a hit;
 * one beat off still counts for a beginner, but is reported as "near".
 */
export function scoreChanges(changes: readonly number[], marks: Iterable<number>): ChangeResult {
  const remaining = new Set(marks);
  const exact: number[] = [];
  const near: ChangeResult['near'] = [];
  const missed: number[] = [];
  const unmatched: number[] = [];

  for (const change of changes) {
    if (remaining.delete(change)) exact.push(change);
    else unmatched.push(change);
  }
  for (const change of unmatched) {
    const mark = [change - 1, change + 1].find(beat => remaining.has(beat));
    if (mark === undefined) {
      missed.push(change);
    } else {
      near.push({ change, mark });
      remaining.delete(mark);
    }
  }
  const extra = [...remaining].sort((a, b) => a - b);
  return { exact, near, missed, extra, correct: missed.length === 0 && extra.length === 0 };
}

export const foundCount = (result: ChangeResult): number => result.exact.length + result.near.length;
