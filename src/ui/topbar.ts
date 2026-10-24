import { el } from '../lib/dom';
import type { Round } from '../quiz/round';

const APP_NAME = 'Quiz Lien';

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

/** Brand on the left; during a round, progress, score, streak and Stop on the right. */
export function renderTopbar(host: HTMLElement, round: Round | null, onHome: () => void): void {
  const brand = el(
    'button',
    { type: 'button', class: 'brand', onClick: onHome, 'aria-label': `${APP_NAME}: naar het begin` },
    APP_NAME,
  );
  const right = el('div', { class: 'topbar-right' });
  if (round && !round.isFinished) {
    right.append(progress(round), el('span', { class: 'chip' }, `${round.score} goed`));
    if (round.streak >= 2) right.append(el('span', { class: 'chip good' }, `${round.streak} op rij`));
    right.append(el('button', { type: 'button', class: 'btn quiet small', onClick: onHome }, 'Stoppen'));
  }
  host.replaceChildren(brand, right);
}
