import { storage } from '../lib/storage';
import { MODES, type Mode } from './modes';
import type { Round } from './round';

const STATS_KEY = 'quiz-lien/v1';

export interface BestScore {
  score: number;
  total: number;
}

export interface Stats {
  best: Partial<Record<Mode, BestScore>>;
  rounds: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBestScore = (value: unknown): value is BestScore =>
  isRecord(value) &&
  Number.isInteger(value.score) &&
  Number.isInteger(value.total) &&
  (value.total as number) > 0 &&
  (value.score as number) >= 0;

/** Reads saved stats, dropping anything malformed (old versions, hand edits) instead of trusting it. */
export function loadStats(): Stats {
  const stored = storage.read<unknown>(STATS_KEY, null);
  if (!isRecord(stored)) return { best: {}, rounds: 0 };
  const best: Stats['best'] = {};
  if (isRecord(stored.best)) {
    for (const mode of Object.keys(MODES) as Mode[]) {
      const score = stored.best[mode];
      if (isBestScore(score)) best[mode] = { score: score.score, total: score.total };
    }
  }
  const rounds = Number.isInteger(stored.rounds) && (stored.rounds as number) >= 0 ? (stored.rounds as number) : 0;
  return { best, rounds };
}

/** Saves a finished round and returns whether it is a new personal best. */
export function saveRound(round: Round): boolean {
  const stats = loadStats();
  const total = round.questions.length;
  const previous = stats.best[round.mode];
  const isBest = !previous || round.score / total > previous.score / previous.total;
  if (isBest) stats.best[round.mode] = { score: round.score, total };
  stats.rounds += 1;
  storage.write(STATS_KEY, stats);
  return isBest;
}
