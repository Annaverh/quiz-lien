import { engine } from '../../audio/engine';
import type { Playback } from '../../audio/playback';
import { el } from '../../lib/dom';
import { errorMessage, notify } from '../../lib/notify';
import type { Song } from '../../music/types';
import { mix } from '../../tracks/mix';
import { arrangeForPlayback, fitBeats, resetTiming, saveTiming, songTiming, trackSrc } from '../../tracks/timing';
import type { View } from '../types';
import { bindSpaceTap, pulse } from './keyboard';
import { createPlayButton } from './playButton';

const PRE_ROLL_SECONDS = 4;
const MIN_TAPS = 4;
/** Taps further than this from the arrangement's tempo were probably half or double time. */
const TEMPO_TOLERANCE = { low: 0.75, high: 1.33 };

/**
 * Teacher tool: find where the fragment starts in a recording, and the record's tempo,
 * by tapping along. Saves to this browser and produces a line for the track manifest.
 */
export function createSyncPanel(song: Song): View {
  let buffer: AudioBuffer | null = null;
  let playback: Playback | null = null;
  let taps: number[] = [];
  let from = 0;
  let alive = true;
  const firstChord = song.progression[0]?.[0] ?? '';

  const readout = el('p', { class: 'sync-readout' });
  const status = el('p', { class: 'hint', 'aria-live': 'polite' });
  const copyBox = el('input', {
    class: 'copy-box',
    readOnly: true,
    'aria-label': 'Timing line to copy',
    onFocus: (event: Event) => (event.target as HTMLInputElement).select(),
  });
  const tapButton = el(
    'button',
    {
      type: 'button',
      class: 'tap-btn',
      disabled: true,
      onPointerdown: (event: Event) => {
        event.preventDefault();
        tap();
      },
    },
    'Beat',
    el('small', {}, 'Tap here, or press the space bar, on every beat'),
  );
  const startButton = el(
    'button',
    { type: 'button', class: 'btn', onClick: () => (playback ? finish() : void listen()) },
    'Start tapping',
  );

  const together = createPlayButton({
    label: 'Hear it together',
    getPlayable: () => ({
      ...arrangeForPlayback(song),
      track: buffer ? { buffer, start: songTiming(song).start } : null,
    }),
    onStart: () => {
      if (mix.level < 0.2) mix.set(0.5);
    },
  });

  function render(): void {
    const timing = songTiming(song);
    readout.textContent = `First chord at ${timing.start.toFixed(2)} s · ${timing.bpm.toFixed(1)} BPM${timing.isCustom ? ' (set in this browser)' : ''}`;
    copyBox.value = `'${song.id}': { file: '${trackSrc(song) ?? ''}', start: ${timing.start.toFixed(2)}, bpm: ${timing.bpm.toFixed(1)} },`;
  }

  async function listen(): Promise<void> {
    if (!buffer) return;
    from = Math.max(0, songTiming(song).start - PRE_ROLL_SECONDS);
    taps = [];
    try {
      playback = await engine.play(
        { notes: [], duration: buffer.duration - from, track: { buffer, start: from, solo: true } },
        {
          onEnd: () => {
            if (playback) finish();
          },
        },
      );
      startButton.textContent = 'Finish';
      tapButton.disabled = false;
      status.textContent = `Playing from ${from.toFixed(1)} s. Tap on every beat, starting exactly when ${firstChord} begins. Tap 8 beats or more, then press Finish.`;
    } catch (error) {
      notify(errorMessage(error, 'Sound could not start.'));
    }
  }

  function tap(): void {
    if (!playback) return;
    taps.push(from + playback.position);
    pulse(tapButton);
    status.textContent = `${taps.length} ${taps.length === 1 ? 'tap' : 'taps'}. Keep going, then press Finish.`;
  }

  function finish(): void {
    const current = playback;
    playback = null; // cleared first, so the stop below doesn't re-enter through onEnd
    current?.stop();
    startButton.textContent = 'Start tapping';
    tapButton.disabled = true;

    if (taps.length < MIN_TAPS) {
      status.textContent = 'Not enough taps to work out the timing. Try again and tap at least 8 beats.';
      return;
    }
    const fit = fitBeats(taps);
    const ratio = fit.bpm / song.bpm;
    if (!(ratio > TEMPO_TOLERANCE.low && ratio < TEMPO_TOLERANCE.high)) {
      status.textContent = `Those taps were about ${Math.round(fit.bpm)} BPM, but this song expects about ${song.bpm}. Tap once per beat and try again.`;
      return;
    }
    saveTiming(song, fit);
    render();
    status.textContent = `Saved. Your taps were within ${Math.round(fit.spread * 1000)} ms of a steady beat. Press "Hear it together" to check, and nudge if needed.`;
  }

  function nudge(deltaStart: number, deltaBpm: number): void {
    const timing = songTiming(song);
    saveTiming(song, { start: timing.start + deltaStart, bpm: timing.bpm + deltaBpm });
    render();
    if (together.playback) {
      together.stop();
      void together.start();
    }
  }

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(copyBox.value);
      status.textContent = 'Copied. Paste it into src/tracks/manifest.ts to make it the default for every learner.';
    } catch {
      copyBox.focus();
      copyBox.select();
      status.textContent = 'Press Ctrl+C (or Cmd+C) to copy the selected line.';
    }
  }

  const nudgeButton = (label: string, deltaStart: number, deltaBpm: number): HTMLElement =>
    el('button', { type: 'button', class: 'btn small', onClick: () => nudge(deltaStart, deltaBpm) }, label);

  const node = el(
    'details',
    { class: 'learn', hidden: true },
    el('summary', {}, 'Line up the real song (for teachers)'),
    el(
      'div',
      { class: 'learn-body sync' },
      el(
        'p',
        { class: 'hint' },
        `Do this once per recording so it plays in time with the app guitar. Start tapping, then tap on every beat from the moment ${firstChord} begins. The setting is saved in this browser.`,
      ),
      readout,
      el('div', { class: 'action-row' }, startButton, together.node),
      tapButton,
      status,
      el(
        'div',
        { class: 'nudges' },
        el('span', { class: 'seg-label' }, 'Song starts'),
        nudgeButton('Earlier −0.1 s', -0.1, 0),
        nudgeButton('−0.02 s', -0.02, 0),
        nudgeButton('+0.02 s', 0.02, 0),
        nudgeButton('Later +0.1 s', 0.1, 0),
      ),
      el(
        'div',
        { class: 'nudges' },
        el('span', { class: 'seg-label' }, 'Tempo'),
        nudgeButton('−0.5 BPM', 0, -0.5),
        nudgeButton('+0.5 BPM', 0, 0.5),
      ),
      el(
        'div',
        { class: 'action-row' },
        copyBox,
        el('button', { type: 'button', class: 'btn small', onClick: () => void copy() }, 'Copy timing'),
        el(
          'button',
          {
            type: 'button',
            class: 'btn quiet small',
            onClick: () => {
              resetTiming(song);
              render();
              status.textContent = 'Back to the default timing.';
            },
          },
          'Reset',
        ),
      ),
    ),
  );
  render();

  void engine.loadTrack(trackSrc(song)).then(loaded => {
    if (!alive) return;
    buffer = loaded;
    node.hidden = !buffer;
  });

  const unbindSpace = bindSpaceTap(() => playback !== null, tap);

  return {
    node,
    destroy() {
      alive = false;
      playback?.stop();
      together.stop();
      unbindSpace();
    },
  };
}
