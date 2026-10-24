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

/** Dutch decimal comma for display; the manifest line keeps JavaScript's decimal point. */
const formatNumber = (value: number, digits: number): string =>
  value.toLocaleString('nl-NL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

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
    'aria-label': 'Timingregel om te kopiëren',
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
    'Tel',
    el('small', {}, 'Tik hier of druk op de spatiebalk, op elke tel'),
  );
  const startButton = el(
    'button',
    { type: 'button', class: 'btn', onClick: () => (playback ? finish() : void listen()) },
    'Begin met tikken',
  );

  const together = createPlayButton({
    label: 'Samen afspelen',
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
    readout.textContent = `Eerste akkoord op ${formatNumber(timing.start, 2)} s · ${formatNumber(timing.bpm, 1)} BPM${timing.isCustom ? ' (ingesteld in deze browser)' : ''}`;
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
      startButton.textContent = 'Klaar';
      tapButton.disabled = false;
      status.textContent = `Speelt vanaf ${formatNumber(from, 1)} s. Tik op elke tel, precies vanaf het moment dat ${firstChord} begint. Tik minstens 8 tellen en druk dan op Klaar.`;
    } catch (error) {
      notify(errorMessage(error, 'Het geluid kon niet starten.'));
    }
  }

  function tap(): void {
    if (!playback) return;
    taps.push(from + playback.position);
    pulse(tapButton);
    status.textContent = `${taps.length} ${taps.length === 1 ? 'tik' : 'tikken'}. Ga door en druk dan op Klaar.`;
  }

  function finish(): void {
    const current = playback;
    playback = null; // cleared first, so the stop below doesn't re-enter through onEnd
    current?.stop();
    startButton.textContent = 'Begin met tikken';
    tapButton.disabled = true;

    if (taps.length < MIN_TAPS) {
      status.textContent = 'Te weinig tikken om de timing te bepalen. Probeer het opnieuw en tik minstens 8 tellen.';
      return;
    }
    const fit = fitBeats(taps);
    const ratio = fit.bpm / song.bpm;
    if (!(ratio > TEMPO_TOLERANCE.low && ratio < TEMPO_TOLERANCE.high)) {
      status.textContent = `Je tikte ongeveer ${Math.round(fit.bpm)} BPM, maar dit nummer zit rond ${song.bpm}. Tik één keer per tel en probeer het opnieuw.`;
      return;
    }
    saveTiming(song, fit);
    render();
    status.textContent = `Opgeslagen. Je tikken zaten binnen ${Math.round(fit.spread * 1000)} ms van een vaste tel. Druk op "Samen afspelen" om te controleren en schuif bij als dat nodig is.`;
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
      status.textContent = 'Gekopieerd. Plak de regel in src/tracks/manifest.ts om hem voor iedereen in te stellen.';
    } catch {
      copyBox.focus();
      copyBox.select();
      status.textContent = 'Druk op Ctrl+C (of Cmd+C) om de geselecteerde regel te kopiëren.';
    }
  }

  const nudgeButton = (label: string, deltaStart: number, deltaBpm: number): HTMLElement =>
    el('button', { type: 'button', class: 'btn small', onClick: () => nudge(deltaStart, deltaBpm) }, label);

  const node = el(
    'details',
    { class: 'learn', hidden: true },
    el('summary', {}, 'Origineel gelijkzetten (voor docenten)'),
    el(
      'div',
      { class: 'learn-body sync' },
      el(
        'p',
        { class: 'hint' },
        `Doe dit één keer per opname, zodat die gelijk loopt met de gitaar van de app. Begin met tikken en tik op elke tel vanaf het moment dat ${firstChord} begint. De instelling wordt in deze browser bewaard.`,
      ),
      readout,
      el('div', { class: 'action-row' }, startButton, together.node),
      tapButton,
      status,
      el(
        'div',
        { class: 'nudges' },
        el('span', { class: 'seg-label' }, 'Start'),
        nudgeButton('Eerder −0,1 s', -0.1, 0),
        nudgeButton('−0,02 s', -0.02, 0),
        nudgeButton('+0,02 s', 0.02, 0),
        nudgeButton('Later +0,1 s', 0.1, 0),
      ),
      el(
        'div',
        { class: 'nudges' },
        el('span', { class: 'seg-label' }, 'Tempo'),
        nudgeButton('−0,5 BPM', 0, -0.5),
        nudgeButton('+0,5 BPM', 0, 0.5),
      ),
      el(
        'div',
        { class: 'action-row' },
        copyBox,
        el('button', { type: 'button', class: 'btn small', onClick: () => void copy() }, 'Kopieer timing'),
        el(
          'button',
          {
            type: 'button',
            class: 'btn quiet small',
            onClick: () => {
              resetTiming(song);
              render();
              status.textContent = 'Terug naar de standaardtiming.';
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
