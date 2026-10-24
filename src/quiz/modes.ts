export type Mode = 'technique' | 'changes' | 'mixed';
export type QuestionKind = 'technique' | 'changes';

export interface ModeInfo {
  title: string;
  blurb: string;
  length: number;
}

export const MODES: Readonly<Record<Mode, ModeInfo>> = {
  technique: {
    title: 'Slaan of tokkelen?',
    blurb: 'Luister naar een kort fragment en raad hoe de gitaar bespeeld wordt.',
    length: 6,
  },
  changes: {
    title: 'Hoor de wissel',
    blurb: 'Tik mee en markeer de tellen waarop een nieuw akkoord begint.',
    length: 5,
  },
  mixed: {
    title: 'Door elkaar',
    blurb: 'Beide soorten vragen, om en om.',
    length: 6,
  },
};

/** Beats played for a strum-or-pick question: long enough to hear the pattern, short enough to replay. */
export const TECHNIQUE_FRAGMENT_BEATS = 8;
