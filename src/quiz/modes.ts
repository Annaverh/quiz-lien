export type Mode = 'technique' | 'changes' | 'mixed';
export type QuestionKind = 'technique' | 'changes';

export interface ModeInfo {
  title: string;
  blurb: string;
  length: number;
}

export const MODES: Readonly<Record<Mode, ModeInfo>> = {
  technique: {
    title: 'Strum or pick?',
    blurb: 'Hear a short fragment and decide how the guitar is played.',
    length: 6,
  },
  changes: {
    title: 'Spot the change',
    blurb: 'Tap along and mark the beats where a new chord starts.',
    length: 5,
  },
  mixed: {
    title: 'Mixed set',
    blurb: 'Both kinds of question, taking turns.',
    length: 6,
  },
};

/** Beats played for a strum-or-pick question: long enough to hear the pattern, short enough to replay. */
export const TECHNIQUE_FRAGMENT_BEATS = 8;
