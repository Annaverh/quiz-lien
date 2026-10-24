import type { StringIndex, Style } from './types';

/** Standard tuning as MIDI note numbers, thickest (low E) to thinnest (high e). */
export const TUNING = [40, 45, 50, 55, 59, 64] as const;
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'] as const;
export const STRING_INDICES: readonly StringIndex[] = [0, 1, 2, 3, 4, 5];
/** Tab is written with the thinnest string on top. */
export const TAB_STRING_ORDER: readonly StringIndex[] = [5, 4, 3, 2, 1, 0];
export const MUTED = -1;

export const STYLE_LABEL: Readonly<Record<Style, string>> = { strum: 'Strumming', pick: 'Picking' };
export const otherStyle = (style: Style): Style => (style === 'strum' ? 'pick' : 'strum');
