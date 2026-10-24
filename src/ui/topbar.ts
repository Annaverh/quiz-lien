import { el, svgEl } from '../lib/dom';
import type { Round } from '../quiz/round';

const BRAND_STRINGS = [8, 12.5, 17, 21.5, 26];

function brandMark(): SVGSVGElement {
  return svgEl(
    'svg',
    { class: 'brand-mark', viewBox: '0 0 34 34', 'aria-hidden': 'true' },
    svgEl('rect', { x: 1, y: 1, width: 32, height: 32, rx: 9, fill: 'var(--ink)' }),
    BRAND_STRINGS.map((y, i) =>
      svgEl('line', {
        x1: 7,
        x2: 27,
        y1: y,
        y2: y,
        stroke: i % 2 ? 'var(--pick)' : 'var(--strum)',
        'stroke-width': 1.2 + (BRAND_STRINGS.length - 1 - i) * 0.25,
      }),
    ),
  );
}

function progress(round: Round): HTMLElement {
  return el(
    'div',
    { class: 'progress', 'aria-label': `Question ${round.index + 1} of ${round.questions.length}` },
    round.questions.map((_, i) => {
      const answer = round.answerAt(i);
      const state = answer ? (answer.correct ? 'is-right' : 'is-wrong') : i === round.index ? 'is-current' : '';
      return el('i', { class: state });
    }),
  );
}

/** Brand on the left; during a round, progress, score, streak and Quit on the right. */
export function renderTopbar(host: HTMLElement, round: Round | null, onHome: () => void): void {
  const brand = el(
    'button',
    { type: 'button', class: 'brand', onClick: onHome, 'aria-label': 'Strum, Pick & Change: home' },
    brandMark(),
    el('span', { class: 'brand-name' }, 'Strum, Pick & Change'),
  );
  const right = el('div', { class: 'topbar-right' });
  if (round && !round.isFinished) {
    right.append(progress(round), el('span', { class: 'chip' }, `Score ${round.score}`));
    if (round.streak >= 2) right.append(el('span', { class: 'chip good' }, `${round.streak} in a row`));
    right.append(el('button', { type: 'button', class: 'btn quiet small', onClick: onHome }, 'Quit'));
  }
  host.replaceChildren(brand, right);
}
