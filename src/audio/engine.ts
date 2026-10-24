import type { NoteEvent } from '../music/types';
import { Playback } from './playback';
import { makeRoomImpulse, renderPluck, scheduleBlip } from './synthesis';
import type { Playable, PlaybackHandlers } from './types';

const RELEASE_SECONDS = 0.035;
const START_DELAY_SECONDS = 0.06;
const NOTE_LEVEL = 0.32;
const SOLO_TRACK_LEVEL = 0.7;

/** Maps the 0–1 slider to gain with a perceptual curve; records are mastered far louder than the synth. */
export const trackGain = (level: number): number => 0.85 * level * level;

/** Fetches and decodes an audio file; resolves to null when it is missing or unreadable. */
async function fetchTrack(src: string): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const data = await response.arrayBuffer();
    // An offline context decodes without needing a user gesture first.
    return await new OfflineAudioContext(2, 1, 44100).decodeAudioData(data);
  } catch {
    return null;
  }
}

/** The plucked-string guitar plus an optional recording, mixed in one AudioContext. */
export class GuitarEngine {
  #ctx: AudioContext | null = null;
  #guitarInput: AudioNode | null = null;
  #trackInput: GainNode | null = null;
  #trackLevel = 0.5;
  readonly #noteBuffers = new Map<number, AudioBuffer>();
  readonly #tracks = new Map<string, Promise<AudioBuffer | null>>();
  #current: Playback | null = null;

  /** Plays a fragment, stopping whatever was playing: only one thing plays at a time. */
  async play(playable: Playable, handlers: PlaybackHandlers = {}): Promise<Playback> {
    const ctx = await this.#context();
    this.stop();
    const guitarBus = ctx.createGain();
    guitarBus.connect(this.#guitarInput as AudioNode);
    const trackBus = ctx.createGain();
    if (playable.track?.solo) {
      trackBus.gain.value = SOLO_TRACK_LEVEL;
      trackBus.connect(ctx.destination);
    } else {
      trackBus.connect(this.#trackInput as AudioNode);
    }

    const t0 = ctx.currentTime + START_DELAY_SECONDS;
    const sources: AudioScheduledSourceNode[] = [
      ...playable.notes.map(note => this.#scheduleNote(ctx, guitarBus, t0, note)),
      ...(playable.clicks ?? []).map(c =>
        scheduleBlip(ctx, guitarBus, t0 + c.time, c.accent ? 1760 : 1320, 0.22, 0.05),
      ),
      ...(playable.chimes ?? []).map(c => scheduleBlip(ctx, guitarBus, t0 + c.time, 2093, 0.16, 0.4)),
    ];
    if (playable.track) sources.push(this.#scheduleTrack(ctx, trackBus, t0, playable));

    this.#current = new Playback(ctx, [guitarBus, trackBus], sources, t0, playable, handlers);
    return this.#current;
  }

  playNotes(notes: readonly NoteEvent[]): Promise<Playback> {
    return this.play({ notes, duration: 0 });
  }

  stop(): void {
    this.#current?.stop();
    this.#current = null;
  }

  /** Loads a recording once; every view of a song shares the same download. */
  loadTrack(src: string | null): Promise<AudioBuffer | null> {
    if (!src) return Promise.resolve(null);
    let track = this.#tracks.get(src);
    if (!track) {
      track = fetchTrack(src);
      this.#tracks.set(src, track);
    }
    return track;
  }

  /** Real-song volume (0–1), applied live to whatever is playing. */
  setTrackLevel(level: number): void {
    this.#trackLevel = level;
    if (this.#ctx && this.#trackInput) {
      this.#trackInput.gain.setTargetAtTime(trackGain(level), this.#ctx.currentTime, 0.03);
    }
  }

  async #context(): Promise<AudioContext> {
    if (!this.#ctx) {
      if (typeof AudioContext === 'undefined') {
        throw new Error(
          'Deze browser kan geen geluid afspelen. Probeer een recente versie van Chrome, Firefox, Safari of Edge.',
        );
      }
      const ctx = new AudioContext({ latencyHint: 'interactive' });
      this.#guitarInput = buildGuitarChain(ctx);
      this.#trackInput = ctx.createGain();
      this.#trackInput.gain.value = trackGain(this.#trackLevel);
      this.#trackInput.connect(ctx.destination);
      this.#ctx = ctx;
    }
    if (this.#ctx.state !== 'running') await this.#ctx.resume();
    return this.#ctx;
  }

  #noteBuffer(ctx: AudioContext, midi: number): AudioBuffer {
    let buffer = this.#noteBuffers.get(midi);
    if (!buffer) {
      const samples = renderPluck(ctx.sampleRate, midi);
      buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
      buffer.copyToChannel(samples, 0);
      this.#noteBuffers.set(midi, buffer);
    }
    return buffer;
  }

  #scheduleNote(ctx: AudioContext, bus: AudioNode, t0: number, note: NoteEvent): AudioBufferSourceNode {
    const source = ctx.createBufferSource();
    source.buffer = this.#noteBuffer(ctx, note.midi);
    const gain = ctx.createGain();
    const start = t0 + note.time;
    const end = Math.max(start + 0.05, t0 + note.end);
    const level = note.velocity * NOTE_LEVEL;
    gain.gain.setValueAtTime(level, start);
    gain.gain.setValueAtTime(level, end);
    gain.gain.linearRampToValueAtTime(0, end + RELEASE_SECONDS);
    source.connect(gain).connect(bus);
    source.start(start);
    source.stop(end + RELEASE_SECONDS + 0.01);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    return source;
  }

  /**
   * Starts the recording so that `track.start` lines up with the first beat after the
   * count-in. During a count-in the record already plays as a lead-in.
   */
  #scheduleTrack(ctx: AudioContext, bus: AudioNode, t0: number, playable: Playable): AudioBufferSourceNode {
    const track = playable.track as NonNullable<Playable['track']>;
    const leadIn = playable.leadIn ?? 0;
    const source = ctx.createBufferSource();
    source.buffer = track.buffer;
    const fade = ctx.createGain();
    const fileTimeAtStart = track.start - leadIn;
    const when = t0 + Math.max(0, -fileTimeAtStart);
    const offset = Math.max(0, fileTimeAtStart);
    const end = t0 + playable.duration + 0.6;
    fade.gain.setValueAtTime(1, Math.max(when, end - 0.4));
    fade.gain.linearRampToValueAtTime(0, end);
    source.connect(fade).connect(bus);
    if (offset < track.buffer.duration) {
      source.start(when, offset);
      source.stop(end + 0.02);
    }
    source.onended = () => {
      source.disconnect();
      fade.disconnect();
    };
    return source;
  }
}

/** Body resonance, a soft top end, a little room and a gentle limiter. */
function buildGuitarChain(ctx: AudioContext): AudioNode {
  const input = ctx.createGain();

  const body = ctx.createBiquadFilter();
  body.type = 'peaking';
  body.frequency.value = 110;
  body.Q.value = 1.1;
  body.gain.value = 4;

  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 5200;
  tone.Q.value = 0.5;

  const room = ctx.createConvolver();
  room.buffer = makeRoomImpulse(ctx, 1.6);
  const wet = ctx.createGain();
  wet.gain.value = 0.16;

  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.ratio.value = 3;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.2;

  input.connect(body).connect(tone);
  tone.connect(limiter);
  tone.connect(room).connect(wet).connect(limiter);
  limiter.connect(ctx.destination);
  return input;
}

export const engine = new GuitarEngine();
