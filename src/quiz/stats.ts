import { storage } from '../lib/storage';
import type { Mode } from './modes';
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

export function loadStats(): Stats {
  const stats = storage.read<Partial<Stats> | null>(STATS_KEY, null);
  return stats && typeof stats === 'object'
    ? { best: stats.best ?? {}, rounds: stats.rounds ?? 0 }
    : { best: {}, rounds: 0 };
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
