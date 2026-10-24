import { el } from '../../lib/dom';
import type { Song } from '../../music/types';

export const songMeta = (song: Song, heading: 'h2' | 'h3' = 'h3', id?: string): HTMLElement =>
  el(
    'div',
    { class: 'song-meta' },
    el(heading, { class: heading === 'h2' ? 'q-title' : null, id }, song.title),
    el('span', {}, `${song.artist} · ${song.year}`),
  );
