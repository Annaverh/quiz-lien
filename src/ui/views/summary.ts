import { el } from '../../lib/dom';
import { changeBeats, chordSegments } from '../../music/arrangement';
import { STYLE_PARTICIPLE } from '../../music/constants';
import { MODES } from '../../quiz/modes';
import type { Question } from '../../quiz/questions';
import type { Answer, Round } from '../../quiz/round';
import { foundCount } from '../../quiz/scoring';
import type { AppActions, View } from '../types';

function verdict(ratio: number): string {
  if (ratio === 1) return 'Foutloos!';
  if (ratio >= 0.67) return 'Je oren worden scherper.';
  if (ratio >= 0.34) return 'Goed geoefend. Elke ronde gaat het makkelijker.';
  return 'Iedereen begint hier. Oefen een paar nummers en probeer het opnieuw.';
}

function describe(question: Question, answer: Answer | undefined): string {
  if (question.kind === 'technique') {
    return `Slaan of tokkelen: het was ${STYLE_PARTICIPLE[question.song.technique]}`;
  }
  const total = changeBeats(chordSegments(question.song)).length;
  const found = answer?.detail.kind === 'changes' ? foundCount(answer.detail.result) : 0;
  return `Akkoordwissels: ${found} van de ${total} gevonden`;
}

export function summaryView(app: AppActions, round: Round, isBest: boolean): View {
  const total = round.questions.length;

  const node = el(
    'section',
    { class: 'card', 'aria-labelledby': 'sum-h' },
    el('span', { class: 'eyebrow' }, `${MODES[round.mode].title} · klaar`),
    el(
      'div',
      { class: 'score-big', 'aria-label': `${round.score} van ${total}` },
      String(round.score),
      el('small', {}, ` / ${total}`),
    ),
    el('h2', { id: 'sum-h', class: 'q-title' }, verdict(round.score / total)),
    isBest ? el('span', { class: 'chip good self-start' }, 'Nieuw persoonlijk record') : null,
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
            { class: correct ? 'mark right' : 'mark wrong', 'aria-label': correct ? 'Goed' : 'Fout' },
            correct ? '✓' : '×',
          ),
          el(
            'span',
            { class: 'what' },
            el('strong', {}, question.song.title),
            el('small', {}, describe(question, answer)),
          ),
          el('button', { type: 'button', class: 'btn small', onClick: () => app.study(question.song) }, 'Oefenen'),
        );
      }),
    ),
    el(
      'div',
      { class: 'action-row' },
      el('button', { type: 'button', class: 'btn', onClick: () => app.goHome() }, 'Naar het begin'),
      el('span', { class: 'spacer' }),
      el('button', { type: 'button', class: 'btn primary', onClick: () => app.startRound(round.mode) }, 'Nog een keer'),
    ),
  );

  return { node };
}
