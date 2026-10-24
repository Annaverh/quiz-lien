import { REST, type Song, type StepToken, type StepsPerBeat, type Style } from './types';

/** Generic patterns, used to hear a song played the other way for comparison. */
const FALLBACK_PATTERNS: Readonly<Record<Style, Readonly<Record<StepsPerBeat, readonly StepToken[]>>>> = {
  strum: {
    2: ['D', REST, 'D', 'U', REST, 'U', 'D', 'U'],
    3: ['D', REST, 'D', 'U', 'D', 'U'],
  },
  pick: {
    2: ['B', 3, 4, 3, 'A', 3, 4, 3],
    3: ['B', 3, 4, 5, 4, 3],
  },
};

export const patternFor = (song: Song, style: Style): readonly StepToken[] =>
  style === song.technique ? song.pattern : FALLBACK_PATTERNS[style][song.stepsPerBeat];

/** Count shown under each step: "1 & 2 &" in 4/4, "1 2 3 4 5 6" in 6/8. */
export const countLabel = (song: Song, positionInBar: number): string => {
  if (song.stepsPerBeat === 3) return String(positionInBar + 1);
  return positionInBar % 2 === 0 ? String(positionInBar / 2 + 1) : '&';
};
