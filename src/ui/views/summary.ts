import { el } from '../../lib/dom';
import { changeBeats, chordSegments } from '../../music/arrangement';
import { STYLE_LABEL } from '../../music/constants';
import { MODES } from '../../quiz/modes';
import type { Question } from '../../quiz/questions';
import type { Answer, Round } from '../../quiz/round';
import { foundCount } from '../../quiz/scoring';
import type { AppActions, View } from '../types';

function verdict(ratio: number): string {
  if (ratio === 1) return 'Perfect round!';
  if (ratio >= 0.67) return 'Your ears are getting sharp.';
  if (ratio >= 0.34) return 'Good practice. It gets easier every round.';
  return 'Everyone starts here. Study a song or two and try again.';
}

function describe(question: Question, answer: Answer | undefined): string {
  if (question.kind === 'technique') {
    return `Strum or pick: it was ${STYLE_LABEL[question.song.technique].toLowerCase()}`;
  }
  const total = changeBeats(chordSegments(question.song)).length;
  const found = answer?.detail.kind === 'changes' ? foundCount(answer.detail.result) : 0;
  return `Chord changes: ${found} of ${total} found`;
}

export function summaryView(app: AppActions, round: Round, isBest: boolean): View {
  const total = round.questions.length;

  const node = el(
    'section',
    { class: 'card', 'aria-labelledby': 'sum-h' },
    el('span', { class: 'eyebrow' }, `${MODES[round.mode].title} · finished`),
    el(
      'div',
      { class: 'score-big', 'aria-label': `${round.score} out of ${total}` },
      String(round.score),
      el('small', {}, ` / ${total}`),
    ),
    el('h2', { id: 'sum-h', class: 'q-title' }, verdict(round.score / total)),
    isBest ? el('span', { class: 'chip good self-start' }, 'New personal best') : null,
    el(
      'ul',
      { class: 'review' },
      round.questions.map((question, i) => {
        const answer = round.answerAt(i);
        const correct = answer?.correct ?? false;
        return el(
          'li',
          {},
          el(
            'span',
            { class: correct ? 'mark right' : 'mark wrong', 'aria-label': correct ? 'Correct' : 'Incorrect' },
            correct ? '✓' : '×',
          ),
          el(
            'span',
            { class: 'what' },
            el('strong', {}, question.song.title),
            el('small', {}, describe(question, answer)),
          ),
          el('button', { type: 'button', class: 'btn small', onClick: () => app.study(question.song) }, 'Study'),
        );
      }),
    ),
    el(
      'div',
      { class: 'action-row' },
      el('button', { type: 'button', class: 'btn', onClick: () => app.goHome() }, 'Home'),
      el('span', { class: 'spacer' }),
      el('button', { type: 'button', class: 'btn primary', onClick: () => app.startRound(round.mode) }, 'Play again'),
    ),
  );

  return { node };
}
