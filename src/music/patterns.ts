import { REST, type Song, type StepToken, type StepsPerBeat, type StrumToken, type Style } from './types';

const STRUM_LETTERS: Readonly<Record<string, StrumToken>> = { D: 'D', d: 'd', U: 'U', u: 'u', n: REST };

/** Reads a strum pattern written as text, e.g. 'Dn Du nu Du'. Spaces and bar lines are ignored. */
export function parseStrumPattern(text: string): StrumToken[] {
  return [...text.replace(/[\s|]/g, '')].map(letter => {
    const token = STRUM_LETTERS[letter];
    if (!token) throw new Error(`Unknown strum letter "${letter}" in "${text}" (use D, d, U, u or n)`);
    return token;
  });
}

/** Writes a strum pattern back as text, one group per beat. */
export const formatStrumPattern = (tokens: readonly StepToken[], stepsPerBeat: number): string =>
  tokens
    .map((token, i) => (token === REST ? 'n' : String(token)) + ((i + 1) % stepsPerBeat === 0 ? ' ' : ''))
    .join('')
    .trim();

/**
 * Generic patterns, used to hear a song played the other way for comparison. The picked
 * 4/4 pattern restarts on the root halfway, so chords that last two beats start on their bass.
 */
const FALLBACK_PATTERNS: Readonly<Record<Style, Readonly<Record<StepsPerBeat, readonly StepToken[]>>>> = {
  strum: {
    2: parseStrumPattern('Dn Du nu Du'),
    3: parseStrumPattern('Dnd udu'),
    4: parseStrumPattern('Dnnn Dnun nnun Dnun'),
  },
  pick: {
    2: ['B', 3, 4, 5, 'B', 4, 3, 4],
    3: ['B', 3, 4, 5, 4, 3],
    4: ['B', 3, 4, 5, 'B', 4, 3, 4, 'B', 3, 4, 5, 'B', 4, 3, 4],
  },
};

export const patternFor = (song: Song, style: Style): readonly StepToken[] =>
  style === song.technique ? song.pattern : (song.otherPattern ?? FALLBACK_PATTERNS[style][song.stepsPerBeat]);

const SIXTEENTHS = ['', 'e', '&', 'a'];

/** Count shown under each step: "1 & 2 &" in eighths, "1 e & a" in sixteenths, "1 2 3 4 5 6" in 6/8. */
export const countLabel = (song: Song, positionInBar: number): string => {
  if (song.stepsPerBeat === 3) return String(positionInBar + 1);
  const sub = positionInBar % song.stepsPerBeat;
  const beat = String(Math.floor(positionInBar / song.stepsPerBeat) + 1);
  if (sub === 0) return beat;
  return song.stepsPerBeat === 4 ? (SIXTEENTHS[sub] ?? '') : '&';
};
