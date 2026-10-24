import { MUTED, STRING_INDICES } from './constants';
import {
  REST,
  type Chord,
  type PickString,
  type PickToken,
  type StepToken,
  type StringIndex,
  type Style,
} from './types';

export interface Voice {
  string: StringIndex;
  /** Delay after the step, in seconds: spreads a strum into a sweep. */
  offset: number;
  velocity: number;
}

const DOWN_STRUM_SPACING = 0.011;
const UP_STRUM_SPACING = 0.009;
const PINCH_SPACING = 0.004;

/** How many strings each strum brushes (counted from the thinnest), and how hard. */
const STRUMS = {
  D: { direction: 'down', strings: 6, velocity: 0.95 },
  d: { direction: 'down', strings: 4, velocity: 0.6 },
  U: { direction: 'up', strings: 5, velocity: 0.75 },
  u: { direction: 'up', strings: 3, velocity: 0.5 },
} as const;
type Strum = keyof typeof STRUMS;
const isStrum = (token: StepToken): token is Strum => typeof token === 'string' && token in STRUMS;

export const soundingStrings = (chord: Chord): StringIndex[] => STRING_INDICES.filter(s => chord.frets[s] !== MUTED);

export function resolvePickString(chord: Chord, target: PickString): StringIndex {
  if (target === 'B') return chord.bass;
  if (target === 'A') return chord.alt;
  return target;
}

export const isPinch = (token: StepToken): token is readonly PickString[] => typeof token === 'object';
export const isStrumToken = (token: StepToken): boolean => isStrum(token) || token === REST;
export const strumDirection = (token: StepToken): 'down' | 'up' | null =>
  isStrum(token) ? STRUMS[token].direction : null;
/** Big strums (D, U) are drawn larger in the tab than small ones (d, u). */
export const isBigStrum = (token: StepToken): boolean => token === 'D' || token === 'U';

/** The strings of `chord` sounded by one pattern step. */
export function voiceStep(chord: Chord, token: StepToken, style: Style, onBeat: boolean): Voice[] {
  if (token === REST) return [];
  if (style === 'strum') {
    if (!isStrum(token)) return [];
    const { direction, strings: count, velocity } = STRUMS[token];
    const strings = soundingStrings(chord).slice(-count);
    // A big down-strum on the beat is the accent of the bar.
    const accent = token === 'D' && !onBeat ? 0.85 : 1;
    if (direction === 'down') {
      return strings.map((string, k) => ({
        string,
        offset: k * DOWN_STRUM_SPACING,
        velocity: velocity * accent * (1 - k * 0.025),
      }));
    }
    // Up-strums go from the thinnest string towards the thicker ones.
    return strings.reverse().map((string, k) => ({ string, offset: k * UP_STRUM_SPACING, velocity }));
  }
  if (isStrum(token)) return [];
  return pickVoices(chord, token);
}

function pickVoices(chord: Chord, token: Exclude<PickToken, typeof REST>): Voice[] {
  const targets = isPinch(token) ? token : [token];
  return targets
    .map(target => ({ string: resolvePickString(chord, target), isBass: target === 'B' || target === 'A' }))
    .filter(({ string }) => chord.frets[string] !== MUTED)
    .map(({ string, isBass }, k) => ({ string, offset: k * PINCH_SPACING, velocity: isBass ? 0.95 : 0.72 }));
}

/** Every pick target named by a token, for validation and display. */
export const pickTargets = (token: StepToken): PickString[] => {
  if (isPinch(token)) return [...token];
  return isStrumToken(token) ? [] : [token as PickString];
};
