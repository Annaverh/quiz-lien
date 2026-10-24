import { shuffle, type Random } from '../lib/random';
import type { Song } from '../music/types';
import { MODES, type Mode, type QuestionKind } from './modes';

export interface Question {
  kind: QuestionKind;
  song: Song;
}

/** Easier songs first, so a beginner warms up before the subtle ones. */
const byChangeLevel = (a: Song, b: Song): number => a.changeLevel - b.changeLevel;

/**
 * Builds a round. Strum-or-pick rounds are balanced between the two techniques;
 * a mixed round alternates kinds and never repeats a song.
 */
export function buildQuestions(mode: Mode, songs: readonly Song[], random: Random = Math.random): Question[] {
  const half = Math.floor(MODES.technique.length / 2);
  const strummed = shuffle(
    songs.filter(s => s.technique === 'strum'),
    random,
  );
  const picked = shuffle(
    songs.filter(s => s.technique === 'pick'),
    random,
  );
  const techniqueSongs = shuffle([...strummed.slice(0, half), ...picked.slice(0, half)], random);

  switch (mode) {
    case 'technique':
      return techniqueSongs.map(song => ({ kind: 'technique', song }));
    case 'changes':
      return shuffle(songs, random)
        .slice(0, MODES.changes.length)
        .sort(byChangeLevel)
        .map(song => ({ kind: 'changes', song }));
    case 'mixed': {
      const pairs = MODES.mixed.length / 2;
      const technique = techniqueSongs.slice(0, pairs);
      const used = new Set(technique.map(s => s.id));
      const changes = shuffle(
        songs.filter(s => !used.has(s.id)),
        random,
      )
        .slice(0, pairs)
        .sort(byChangeLevel);
      return technique.flatMap((song, i) => {
        const changeSong = changes[i];
        const pair: Question[] = [{ kind: 'technique', song }];
        if (changeSong) pair.push({ kind: 'changes', song: changeSong });
        return pair;
      });
    }
  }
}
