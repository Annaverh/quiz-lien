import './migrateStorage';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/home.css';
import './styles/quiz.css';
import './styles/tab.css';
import './styles/beat-grid.css';
import './styles/tracks.css';

import { el } from './lib/dom';
import { SONGS } from './music/songs';
import { assertValidLibrary } from './music/validate';
import { App } from './ui/app';

function requireElement(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id} in index.html`);
  return node;
}

const main = requireElement('main');

try {
  assertValidLibrary(SONGS);
  new App({ topbar: requireElement('topbar'), main, songs: SONGS }).goHome();
} catch (error) {
  console.error(error);
  main.replaceChildren(
    el(
      'div',
      { class: 'error-box', role: 'alert' },
      el('h2', {}, 'Er ging iets mis bij het laden.'),
      el('p', {}, 'Herlaad de pagina om het opnieuw te proberen.'),
    ),
  );
}
