import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../lib/random';
import { SONGS } from '../music/songs';
import { MODES } from './modes';
import { buildQuestions } from './questions';
import { Round } from './round';

const seeds = [1, 2, 3, 42, 1234];

describe('buildQuestions', () => {
  it.each(seeds)('balances a strum-or-pick round (seed %i)', seed => {
    const questions = buildQuestions('technique', SONGS, mulberry32(seed));
    expect(questions).toHaveLength(MODES.technique.length);
    expect(questions.every(q => q.kind === 'technique')).toBe(true);
    expect(questions.filter(q => q.song.technique === 'strum')).toHaveLength(MODES.technique.length / 2);
  });

  it.each(seeds)('orders a chord-change round from easy to hard (seed %i)', seed => {
    const levels = buildQuestions('changes', SONGS, mulberry32(seed)).map(q => q.song.changeLevel);
    expect(levels).toHaveLength(MODES.changes.length);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  it.each(seeds)('alternates kinds in a mixed round without repeating songs (seed %i)', seed => {
    const questions = buildQuestions('mixed', SONGS, mulberry32(seed));
    expect(questions.map(q => q.kind)).toEqual([
      'technique',
      'changes',
      'technique',
      'changes',
      'technique',
      'changes',
    ]);
    expect(new Set(questions.map(q => q.song.id)).size).toBe(questions.length);
  });
});

describe('Round', () => {
  const round = (): Round => new Round('technique', buildQuestions('technique', SONGS, mulberry32(7)));

  it('tracks score and streak', () => {
    const r = round();
    r.record({ correct: true, detail: { kind: 'technique', choice: 'strum' } });
    r.advance();
    r.record({ correct: true, detail: { kind: 'technique', choice: 'pick' } });
    expect(r.score).toBe(2);
    expect(r.streak).toBe(2);
    r.advance();
    r.record({ correct: false, detail: { kind: 'technique', choice: 'pick' } });
    expect(r.streak).toBe(0);
  });

  it('keeps the first answer to a question', () => {
    const r = round();
    r.record({ correct: false, detail: { kind: 'technique', choice: 'strum' } });
    r.record({ correct: true, detail: { kind: 'technique', choice: 'pick' } });
    expect(r.score).toBe(0);
  });

  it('finishes after the last question', () => {
    const r = round();
    for (let i = 0; i < r.questions.length; i++) r.advance();
    expect(r.isFinished).toBe(true);
    expect(() => r.record({ correct: true, detail: { kind: 'technique', choice: 'pick' } })).toThrow();
  });
});
