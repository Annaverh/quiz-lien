import { el } from '../../lib/dom';
import { MODES, type QuestionKind } from '../../quiz/modes';
import type { Round } from '../../quiz/round';
import type { AppActions } from '../types';

/** "Vraag 2 van 6 · Slaan of tokkelen?" plus the spoiler note. */
export const questionKicker = (round: Round, kind: QuestionKind): HTMLElement =>
  el(
    'div',
    { class: 'q-kicker' },
    el('span', { class: 'eyebrow' }, `Vraag ${round.index + 1} van ${round.questions.length} · ${MODES[kind].title}`),
    el('span', { class: 'hint' }, 'Welk nummer het is, zie je na je antwoord'),
  );

export const nextButton = (app: AppActions, round: Round): HTMLElement =>
  el(
    'button',
    { type: 'button', class: 'btn primary', onClick: () => app.nextQuestion() },
    round.isLast ? 'Bekijk mijn score' : 'Volgende vraag',
  );

export type BannerTone = 'good' | 'near' | 'bad';

export const resultBanner = (tone: BannerTone, correct: boolean, headline: string, body: string): HTMLElement =>
  el(
    'div',
    { class: `banner ${tone}`, role: 'status' },
    el('span', { class: 'badge', 'aria-hidden': 'true' }, correct ? '✓' : '×'),
    el('div', {}, el('h3', {}, headline), el('p', {}, body)),
  );
