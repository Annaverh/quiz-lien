import { el } from '../../lib/dom';
import { MODES, type QuestionKind } from '../../quiz/modes';
import type { Round } from '../../quiz/round';
import type { AppActions } from '../types';

/** "Question 2 of 6 · Strum or pick?" plus the spoiler note. */
export const questionKicker = (round: Round, kind: QuestionKind): HTMLElement =>
  el(
    'div',
    { class: 'q-kicker' },
    el('span', { class: 'eyebrow' }, `Question ${round.index + 1} of ${round.questions.length} · ${MODES[kind].title}`),
    el('span', { class: 'chip' }, 'Song revealed after you answer'),
  );

export const nextButton = (app: AppActions, round: Round): HTMLElement =>
  el(
    'button',
    { type: 'button', class: 'btn primary', onClick: () => app.nextQuestion() },
    round.isLast ? 'See my score' : 'Next question',
  );

export type BannerTone = 'good' | 'near' | 'bad';

export const resultBanner = (tone: BannerTone, correct: boolean, headline: string, body: string): HTMLElement =>
  el(
    'div',
    { class: `banner ${tone}`, role: 'status' },
    el('span', { class: 'badge', 'aria-hidden': 'true' }, correct ? '✓' : '×'),
    el('div', {}, el('h3', {}, headline), el('p', {}, body)),
  );
