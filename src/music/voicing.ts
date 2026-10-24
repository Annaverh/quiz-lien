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
const UP_STRUM_STRINGS = 3;
const PINCH_SPACING = 0.004;

export const soundingStrings = (chord: Chord): StringIndex[] => STRING_INDICES.filter(s => chord.frets[s] !== MUTED);

export function resolvePickString(chord: Chord, target: PickString): StringIndex {
  if (target === 'B') return chord.bass;
  if (target === 'A') return chord.alt;
  return target;
}

export const isPinch = (token: StepToken): token is readonly PickString[] => typeof token === 'object';
export const isStrumToken = (token: StepToken): boolean => token === 'D' || token === 'U' || token === REST;

/** The strings of `chord` sounded by one pattern step. */
export function voiceStep(chord: Chord, token: StepToken, style: Style, onBeat: boolean): Voice[] {
  if (token === REST) return [];
  if (style === 'strum') {
    const strings = soundingStrings(chord);
    if (token === 'D') {
      return strings.map((string, k) => ({
        string,
        offset: k * DOWN_STRUM_SPACING,
        velocity: (onBeat ? 0.95 : 0.78) * (1 - k * 0.025),
      }));
    }
    // An up-strum only brushes the thinner strings, from high to low.
    if (token === 'U') {
      return strings
        .slice(-UP_STRUM_STRINGS)
        .reverse()
        .map((string, k) => ({ string, offset: k * UP_STRUM_SPACING, velocity: 0.55 }));
    }
    return [];
  }
  if (token === 'D' || token === 'U') return [];
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
