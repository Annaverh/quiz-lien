import type { Song } from '../music/types';
import type { Mode } from '../quiz/modes';
import type { Round } from '../quiz/round';

/** A screen or component that owns DOM and, often, playing audio or listeners. */
export interface View {
  node: HTMLElement;
  destroy?(): void;
}

/** What views may ask the app to do; keeps views free of navigation details. */
export interface AppActions {
  readonly round: Round | null;
  goHome(): void;
  startRound(mode: Mode): void;
  nextQuestion(): void;
  study(song: Song): void;
  /** Re-renders the progress bar after an answer. */
  refreshTopbar(): void;
}
