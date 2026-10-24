import { chordSegments } from './arrangement';
import { chordFor } from './chords';
import { MUTED } from './constants';
import { patternFor } from './patterns';
import type { Chord, Song, StepToken, Style } from './types';
import { isStrumToken, pickTargets, resolvePickString, stringsAboveBass } from './voicing';

const STYLES: readonly Style[] = ['strum', 'pick'];

const pickedStrings = (chord: Chord, token: StepToken): number[] =>
  pickTargets(token).map(target => resolvePickString(chord, target));

/**
 * Checks song data that the type system can't: bar lengths, pattern lengths, pick targets
 * that would land on a muted string or past the thinnest one, a string picked twice in a row (usually an alternate
 * bass that resolves onto the next note) and chord changes that don't start on the bass.
 * Returns a list of problems.
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

    const pick = patternFor(song, 'pick');
    for (const segment of chordSegments(song)) {
      const chord = chordFor(segment.chord);
      const first = segment.start * song.stepsPerBeat;
      const steps = Array.from(
        { length: segment.length * song.stepsPerBeat },
        (_, k) => pick[(first + k) % pick.length],
      );
      for (const target of new Set(steps.flatMap(token => pickTargets(token as StepToken)))) {
        if (chord.bass + stringsAboveBass(target) > 5) {
          problems.push(`${song.id}: pick target ${target} is past the thinnest string in ${segment.chord}`);
        } else if (chord.frets[resolvePickString(chord, target)] === MUTED) {
          problems.push(`${song.id}: pick target ${target} lands on a muted string in ${segment.chord}`);
        }
      }
    }
    for (const name of new Set(song.progression.map(([chord]) => chord))) {
      const chord = chordFor(name);
      pick.forEach((token, i) => {
        const next = (i + 1) % pick.length;
        const shared = pickedStrings(chord, token).filter(s =>
          pickedStrings(chord, pick[next] as StepToken).includes(s),
        );
        if (shared.length) {
          problems.push(`${song.id}: pick steps ${i + 1} and ${next + 1} both play string ${shared[0]} in ${name}`);
        }
      });
    }

    for (const segment of chordSegments(song)) {
      const token = pick[(segment.start * song.stepsPerBeat) % pick.length] as StepToken;
      if (!pickTargets(token).includes('B')) {
        problems.push(`${song.id}: picked ${segment.chord} on beat ${segment.start} does not start on its bass note`);
      }
    }
  }
  return problems;
}

export function assertValidLibrary(songs: readonly Song[]): void {
  const problems = findLibraryProblems(songs);
  if (problems.length) throw new Error(`Song data is inconsistent:\n${problems.join('\n')}`);
}
