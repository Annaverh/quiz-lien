import { chordFor } from './chords';
import { MUTED } from './constants';
import { patternFor } from './patterns';
import type { Song, Style } from './types';
import { isStrumToken, pickTargets, resolvePickString } from './voicing';

const STYLES: readonly Style[] = ['strum', 'pick'];

/**
 * Checks song data that the type system can't: bar lengths, pattern lengths and
 * pick targets that would land on a muted string. Returns a list of problems.
 */
export function findLibraryProblems(songs: readonly Song[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const song of songs) {
    if (ids.has(song.id)) problems.push(`${song.id}: duplicate song id`);
    ids.add(song.id);

    const barSteps = song.beatsPerBar * song.stepsPerBeat;
    if (song.totalBeats % song.beatsPerBar !== 0) problems.push(`${song.id}: progression does not fill whole bars`);
    if (song.progression.length < 2) problems.push(`${song.id}: needs at least two chords`);

    for (const style of STYLES) {
      const pattern = patternFor(song, style);
      if (pattern.length !== barSteps) problems.push(`${song.id}: ${style} pattern must have ${barSteps} steps`);
      const wrongKind = pattern.filter(token => isStrumToken(token) !== (style === 'strum') && token !== '-');
      if (wrongKind.length) problems.push(`${song.id}: ${style} pattern contains ${wrongKind.join(', ')}`);
    }

    for (const [name] of song.progression) {
      const chord = chordFor(name);
      for (const target of patternFor(song, 'pick').flatMap(pickTargets)) {
        if (chord.frets[resolvePickString(chord, target)] === MUTED) {
          problems.push(`${song.id}: pick target ${target} lands on a muted string in ${name}`);
        }
      }
    }
  }
  return problems;
}

export function assertValidLibrary(songs: readonly Song[]): void {
  const problems = findLibraryProblems(songs);
  if (problems.length) throw new Error(`Song data is inconsistent:\n${problems.join('\n')}`);
}
