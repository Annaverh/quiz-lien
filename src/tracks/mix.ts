import { engine } from '../audio/engine';
import { clamp } from '../lib/math';
import { storage } from '../lib/storage';

const MIX_KEY = 'strum-pick-change/mix/v1';
const DEFAULT_LEVEL = 0.5;

type Listener = (level: number) => void;

/** Real-song volume, shared by every slider on the page and remembered in this browser. */
class MixLevel {
  #level: number;
  readonly #listeners = new Set<Listener>();

  constructor() {
    const stored = storage.read<unknown>(MIX_KEY, DEFAULT_LEVEL);
    this.#level = typeof stored === 'number' && Number.isFinite(stored) ? clamp(stored, 0, 1) : DEFAULT_LEVEL;
    engine.setTrackLevel(this.#level);
  }

  get level(): number {
    return this.#level;
  }

  set(level: number): void {
    this.#level = clamp(level, 0, 1);
    storage.write(MIX_KEY, this.#level);
    engine.setTrackLevel(this.#level);
    for (const listener of this.#listeners) listener(this.#level);
  }

  /** Returns the unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}

export const mix = new MixLevel();
