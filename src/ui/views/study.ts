import { el } from '../../lib/dom';
import { icon } from '../../lib/icons';
import { chordSegments } from '../../music/arrangement';
import { STYLE_LABEL } from '../../music/constants';
import type { Song } from '../../music/types';
import { createBeatGrid } from '../components/beatGrid';
import { createChangeExplorer } from '../components/changeExplorer';
import { createPatternExplorer } from '../components/patternExplorer';
import { songMeta } from '../components/songMeta';
import { createSyncPanel } from '../components/syncPanel';
import type { AppActions, View } from '../types';

/** A song without the quiz: its pattern, its chord changes and the recording tools. */
export function studyView(app: AppActions, song: Song): View {
  const pattern = createPatternExplorer(song);
  const grid = createBeatGrid(song);
  grid.showChords(chordSegments(song));
  const changes = createChangeExplorer(song, grid);
  const sync = createSyncPanel(song);

  const node = el(
    'div',
    { class: 'stack-md' },
    el(
      'div',
      {},
      el(
        'button',
        { type: 'button', class: 'btn quiet small', onClick: () => app.goHome() },
        icon('back'),
        'All songs',
      ),
    ),
    el(
      'section',
      { class: 'card', 'aria-labelledby': 'study-h' },
      el(
        'div',
        { class: 'q-kicker' },
        el('span', { class: 'eyebrow' }, `Study · ${song.era}`),
        el(
          'span',
          { class: 'action-row' },
          song.capo ? el('span', { class: 'chip' }, `Capo ${song.capo}`) : null,
          el('span', { class: `chip ${song.technique}` }, STYLE_LABEL[song.technique]),
        ),
      ),
      songMeta(song, 'h2', 'study-h'),
      el('h3', { class: 'eyebrow' }, 'How it is played'),
      pattern.node,
    ),
    el(
      'section',
      { class: 'card', 'aria-labelledby': 'study-changes-h' },
      el('h3', { class: 'q-title', id: 'study-changes-h' }, 'The chord changes'),
      grid.node,
      changes.node,
    ),
    sync.node,
  );

  return {
    node,
    destroy() {
      pattern.destroy?.();
      changes.destroy?.();
      sync.destroy?.();
    },
  };
}
