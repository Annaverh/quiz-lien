import { engine } from '../../audio/engine';
import type { Playback } from '../../audio/playback';
import type { Playable, StepInfo } from '../../audio/types';
import { el } from '../../lib/dom';
import { icon } from '../../lib/icons';
import { errorMessage, notify } from '../../lib/notify';
import type { NoteEvent } from '../../music/types';

const AUDIO_FAILED = 'Sound could not start. Check your volume and try again.';

export interface PlayButtonOptions<T extends Playable> {
  label: string;
  getPlayable: () => T;
  onStep?: (info: StepInfo | null) => void;
  onStart?: (playable: T) => void;
  onEnd?: (result: { stopped: boolean }) => void;
  /** Checked when a fragment ends by itself: true plays it again. */
  loop?: () => boolean;
  variant?: 'big';
}

export interface PlayButton {
  node: HTMLButtonElement;
  start(): Promise<void>;
  stop(): void;
  readonly playback: Playback | null;
  setLabel(label: string): void;
}

/** A play/stop toggle. Starting it stops anything else that is playing. */
export function createPlayButton<T extends Playable>(options: PlayButtonOptions<T>): PlayButton {
  const { getPlayable, onStep, onStart, onEnd, loop = () => false, variant } = options;
  let label = options.label;
  let playback: Playback | null = null;
  let pending = false;

  const glyph = el('span', { class: 'play-glyph' }, icon('play'));
  const text = el('span', {}, label);
  const node = el(
    'button',
    {
      type: 'button',
      class: variant ? `play-btn ${variant}` : 'play-btn',
      'aria-pressed': 'false',
      onClick: () => (playback ? stop() : void start()),
    },
    glyph,
    text,
  );

  function setPlaying(playing: boolean): void {
    node.classList.toggle('is-playing', playing);
    node.setAttribute('aria-pressed', String(playing));
    glyph.replaceChildren(icon(playing ? 'stop' : 'play'));
    text.textContent = playing ? 'Stop' : label;
  }

  async function start(): Promise<void> {
    if (pending) return;
    pending = true;
    try {
      const playable = getPlayable();
      playback = await engine.play(playable, {
        onStep,
        onEnd: result => {
          playback = null;
          setPlaying(false);
          onEnd?.(result);
          if (!result.stopped && loop()) void start();
        },
      });
      setPlaying(true);
      onStart?.(playable);
    } catch (error) {
      notify(errorMessage(error, AUDIO_FAILED));
    } finally {
      pending = false;
    }
  }

  function stop(): void {
    playback?.stop();
  }

  return {
    node,
    start,
    stop,
    get playback() {
      return playback;
    },
    setLabel(next) {
      label = next;
      if (!playback) text.textContent = next;
    },
  };
}

/** Plays a short snippet (one strum, one chord) and reports failures as a toast. */
export function playSnippet(notes: readonly NoteEvent[]): void {
  engine.playNotes(notes).catch((error: unknown) => notify(errorMessage(error, AUDIO_FAILED)));
}
