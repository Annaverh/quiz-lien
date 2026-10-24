import { el } from '../../lib/dom';
import { ERA_LABEL } from '../../music/constants';
import type { Song } from '../../music/types';
import { MODES, type Mode } from '../../quiz/modes';
import { loadStats } from '../../quiz/stats';
import type { AppActions, View } from '../types';

export function homeView(app: AppActions, songs: readonly Song[]): View {
  const stats = loadStats();

  const modeCard = (mode: Mode): HTMLElement => {
    const { title, blurb, length } = MODES[mode];
    const best = stats.best[mode];
    return el(
      'button',
      { type: 'button', class: 'mode-card', onClick: () => app.startRound(mode) },
      el('h3', {}, title),
      el('p', {}, blurb),
      el(
        'span',
        { class: 'mode-foot' },
        el('span', {}, `${length} vragen`),
        best ? el('span', { class: 'best' }, `Beste: ${best.score}/${best.total}`) : null,
        el('span', { class: 'go', 'aria-hidden': 'true' }, '→'),
      ),
    );
  };

  const songRow = (song: Song): HTMLElement =>
    el(
      'li',
      {},
      el(
        'button',
        { type: 'button', class: 'song-row', onClick: () => app.study(song) },
        el('strong', {}, song.title),
        el('span', { class: 'artist' }, `${song.artist} · ${song.year}`),
        el('span', { class: 'era' }, ERA_LABEL[song.era]),
      ),
    );

  const node = el(
    'div',
    { class: 'stack-lg' },
    el(
      'section',
      { class: 'hero' },
      el(
        'h1',
        {},
        el('span', { class: 'w-strum' }, 'Slagje'),
        ' of ',
        el('span', { class: 'w-pick' }, 'tokkel'),
        '? En wanneer wisselt het akkoord?',
      ),
      el(
        'p',
        {},
        'Hoi Lien, bij deze de korte luisterquiz! De slagjes en tokkels zijn vereenvoudigde versies, als je ze liever complexer (of in meerdere niveaus) hebt laat je het maar weten.',
      ),
    ),
    el(
      'section',
      { class: 'stack', 'aria-labelledby': 'modes-h' },
      el('h2', { id: 'modes-h', class: 'section-title' }, 'Kies een quiz'),
      el('div', { class: 'modes' }, (Object.keys(MODES) as Mode[]).map(modeCard)),
    ),
    el(
      'section',
      { class: 'stack', 'aria-labelledby': 'shelf-h' },
      el(
        'h2',
        { id: 'shelf-h', class: 'section-title' },
        'Oefen een nummer ',
        el('span', { class: 'count' }, `(${songs.length})`),
      ),
      el('ul', { class: 'shelf' }, songs.map(songRow)),
    ),
  );

  return { node };
}
