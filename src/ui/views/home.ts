import { el } from '../../lib/dom';
import type { Song } from '../../music/types';
import { MODES, type Mode } from '../../quiz/modes';
import { loadStats } from '../../quiz/stats';
import type { AppActions, View } from '../types';

type GlyphBar = readonly [color: string, height: number];

/** Tiny bar pictures for each game: tall = strum, short = pick, dark = a chord change. */
const MODE_GLYPHS: Readonly<Record<Mode, readonly GlyphBar[]>> = {
  technique: [
    ['var(--strum)', 26],
    ['var(--strum)', 26],
    ['var(--pick)', 10],
    ['var(--pick)', 18],
    ['var(--pick)', 14],
  ],
  changes: [
    ['var(--strum)', 14],
    ['var(--strum)', 14],
    ['var(--ink)', 28],
    ['var(--pick)', 14],
    ['var(--pick)', 14],
  ],
  mixed: [
    ['var(--strum)', 22],
    ['var(--ink)', 12],
    ['var(--pick)', 22],
    ['var(--ink)', 12],
    ['var(--strum)', 22],
  ],
};

const STRING_THICKNESS = [1, 1.3, 1.7, 2.2, 2.8, 3.4];

export function homeView(app: AppActions, songs: readonly Song[]): View {
  const stats = loadStats();

  const modeCard = (mode: Mode): HTMLElement => {
    const best = stats.best[mode];
    return el(
      'button',
      { type: 'button', class: 'mode-card', onClick: () => app.startRound(mode) },
      el(
        'span',
        { class: 'mode-glyph', 'aria-hidden': 'true' },
        MODE_GLYPHS[mode].map(([color, height]) => el('i', { style: `--c:${color};height:${height}px` })),
      ),
      el('h3', {}, MODES[mode].title),
      el('p', {}, MODES[mode].blurb),
      el(
        'span',
        { class: 'mode-foot' },
        el('span', { class: 'chip' }, `${MODES[mode].length} questions`),
        best ? el('span', { class: 'chip good' }, `Best ${best.score}/${best.total}`) : null,
      ),
    );
  };

  const songRow = (song: Song): HTMLElement =>
    el(
      'button',
      { type: 'button', class: 'song-row', onClick: () => app.study(song) },
      el('span', {}, el('strong', {}, song.title), el('small', {}, `${song.artist} · ${song.year}`)),
      el('span', { class: 'era' }, song.era),
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
        'Is it ',
        el('span', { class: 'w-strum' }, 'strummed'),
        ' or ',
        el('span', { class: 'w-pick' }, 'picked'),
        '? When did the chord change?',
      ),
      el(
        'p',
        {},
        'Short listening games for new guitar players. Hear a fragment, make your guess, then open the interactive tab to see and hear exactly what was played.',
      ),
      el(
        'div',
        { class: 'strings', 'aria-hidden': 'true' },
        STRING_THICKNESS.map(h => el('span', { style: `--h:${h}px` })),
      ),
    ),
    el(
      'section',
      { class: 'stack', 'aria-labelledby': 'modes-h' },
      el(
        'div',
        { class: 'section-head' },
        el('h2', { id: 'modes-h' }, 'Pick a game'),
        el('span', { class: 'eyebrow' }, 'Headphones help'),
      ),
      el('div', { class: 'modes' }, (Object.keys(MODES) as Mode[]).map(modeCard)),
    ),
    el(
      'section',
      { class: 'stack', 'aria-labelledby': 'shelf-h' },
      el(
        'div',
        { class: 'section-head' },
        el('h2', { id: 'shelf-h' }, 'Study a song'),
        el('span', { class: 'eyebrow' }, `${songs.length} songs`),
      ),
      el('p', { class: 'hint' }, 'No quiz, just the interactive tab and the chord changes, at your own speed.'),
      el('div', { class: 'shelf' }, songs.map(songRow)),
    ),
    el(
      'p',
      { class: 'footnote' },
      'Every guitar sound is made live in your browser by a synthesised guitar, so there is nothing to install or pay for. The songs use simplified chord progressions and patterns in the style of the originals. Where a recording of the song is available, a "Real song" slider lets you hear it under the app guitar.',
    ),
  );

  return { node };
}
