import type { Playable, PlaybackHandlers, StepInfo } from './types';

/** How long after the last step a fragment counts as finished. */
const END_PAD_SECONDS = 0.2;
const FADE_SECONDS = 0.08;

type State = 'playing' | 'finished' | 'released';

/** One running fragment. Reports the current step to the UI and can be stopped at any time. */
export class Playback {
  readonly #ctx: AudioContext;
  readonly #buses: readonly GainNode[];
  readonly #sources: readonly AudioScheduledSourceNode[];
  readonly #t0: number;
  readonly #timing: Playable;
  readonly #handlers: PlaybackHandlers;
  #state: State = 'playing';
  #raf = 0;
  #lastKey: string | null = null;

  constructor(
    ctx: AudioContext,
    buses: readonly GainNode[],
    sources: readonly AudioScheduledSourceNode[],
    t0: number,
    timing: Playable,
    handlers: PlaybackHandlers,
  ) {
    this.#ctx = ctx;
    this.#buses = buses;
    this.#sources = sources;
    this.#t0 = t0;
    this.#timing = timing;
    this.#handlers = handlers;
    this.#raf = requestAnimationFrame(this.#tick);
  }

  /** Seconds since the fragment started (negative just before it starts). */
  get position(): number {
    return this.#ctx.currentTime - this.#t0;
  }

  get isPlaying(): boolean {
    return this.#state === 'playing';
  }

  #tick = (): void => {
    if (this.#state !== 'playing') return;
    const pos = this.position;
    if (pos >= this.#timing.duration + END_PAD_SECONDS) {
      this.#state = 'finished';
      this.#emitStep(null);
      this.#handlers.onEnd?.({ stopped: false });
      return;
    }
    this.#emitStep(this.#locate(pos));
    this.#raf = requestAnimationFrame(this.#tick);
  };

  #locate(pos: number): StepInfo | null {
    const { leadIn = 0, stepDur, beatDur, totalSteps, stepsPerBeat } = this.#timing;
    if (!stepDur || !beatDur || !totalSteps || !stepsPerBeat || pos < 0) return null;
    if (pos < leadIn) return { countIn: Math.floor(pos / beatDur), step: -1, beat: -1 };
    const step = Math.min(totalSteps - 1, Math.floor((pos - leadIn) / stepDur));
    return { countIn: -1, step, beat: Math.floor(step / stepsPerBeat) };
  }

  #emitStep(info: StepInfo | null): void {
    const key = info ? `${info.countIn}:${info.step}` : null;
    if (key === this.#lastKey) return;
    this.#lastKey = key;
    this.#handlers.onStep?.(info);
  }

  /** Fades out and frees the audio graph. Only a fragment that was still running reports `onEnd`. */
  stop(): void {
    if (this.#state === 'released') return;
    const wasPlaying = this.#state === 'playing';
    this.#state = 'released';
    cancelAnimationFrame(this.#raf);

    const now = this.#ctx.currentTime;
    for (const bus of this.#buses) {
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
    }
    setTimeout(
      () => {
        for (const source of this.#sources) {
          try {
            source.stop();
          } catch {
            // Already stopped.
          }
        }
        for (const bus of this.#buses) bus.disconnect();
      },
      (FADE_SECONDS + 0.07) * 1000,
    );

    if (wasPlaying) {
      this.#emitStep(null);
      this.#handlers.onEnd?.({ stopped: true });
    }
  }
}
