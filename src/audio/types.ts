import type { Click } from '../music/arrangement';
import type { NoteEvent } from '../music/types';

/** A recording that plays under the app guitar. */
export interface TrackCue {
  buffer: AudioBuffer;
  /** Second in the recording that lines up with the fragment's first beat. */
  start: number;
  /** Ignore the real-song slider (the sync tool must always be audible). */
  solo?: boolean;
}

/** Anything the engine can play: an arrangement, a one-off snippet or a bare recording. */
export interface Playable {
  notes: readonly NoteEvent[];
  duration: number;
  clicks?: readonly Click[];
  chimes?: readonly { time: number }[];
  track?: TrackCue | null;
  leadIn?: number;
  /** Timing fields below enable step reporting. */
  beatDur?: number;
  stepDur?: number;
  totalSteps?: number;
  stepsPerBeat?: number;
}

export interface StepInfo {
  /** Count-in beat, or -1 once the fragment is playing. */
  countIn: number;
  /** Current step, or -1 during the count-in. */
  step: number;
  beat: number;
}

export interface PlaybackHandlers {
  onStep?: (info: StepInfo | null) => void;
  onEnd?: (result: { stopped: boolean }) => void;
}
