import { el } from '../lib/dom';
import type { Round } from '../quiz/round';

function progress(round: Round): HTMLElement {
  return el(
    'div',
    { class: 'progress', 'aria-label': `Vraag ${round.index + 1} van ${round.questions.length}` },
    round.questions.map((_, i) => {
      const answer = round.answerAt(i);
      const state = answer ? (answer.correct ? 'is-right' : 'is-wrong') : i === round.index ? 'is-current' : '';
      return el('i', { class: state });
    }),
  );
}

/** During a round: progress, score, streak and Stop. Empty (and hidden) otherwise. */
export function renderTopbar(host: HTMLElement, round: Round | null, onHome: () => void): void {
  if (!round || round.isFinished) {
    host.replaceChildren();
    return;
  }
  const right = el(
    'div',
    { class: 'topbar-right' },
    progress(round),
    el('span', { class: 'chip' }, `${round.score} goed`),
    round.streak >= 2 ? el('span', { class: 'chip good' }, `${round.streak} op rij`) : null,
    el('button', { type: 'button', class: 'btn quiet small', onClick: onHome }, 'Stoppen'),
  );
  host.replaceChildren(right);
}
