import { clamp } from '../lib/math';
import { mulberry32 } from '../lib/random';

export const NOTE_SECONDS = 3.2;

export const midiToFrequency = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

/**
 * A plucked string by Karplus–Strong synthesis: a burst of filtered noise circulating
 * through a delay line one period long, losing a little energy on every pass.
 */
export function renderPluck(sampleRate: number, midi: number, seconds = NOTE_SECONDS): Float32Array<ArrayBuffer> {
  const freq = midiToFrequency(midi);
  const length = Math.floor(sampleRate * seconds);
  const out = new Float32Array(length);

  // Loop delay = N samples − 0.5 (two-point average) + allpass fraction = exactly one period.
  const loopDelay = sampleRate / freq + 0.5;
  let delay = Math.floor(loopDelay);
  let fraction = loopDelay - delay;
  if (fraction < 0.1) {
    delay -= 1;
    fraction += 1;
  }
  const allpassC = (1 - fraction) / (1 + fraction);

  // Low strings ring longer than high ones.
  const t60 = clamp(5 - (midi - 40) * 0.07, 2, 5);
  const loss = 10 ** (-3 / (t60 * freq));

  const line = excitation(delay, midi);

  let pos = 0;
  let apIn = 0;
  let apOut = 0;
  let peak = 1e-6;
  for (let n = 0; n < length; n++) {
    const next = pos + 1 === delay ? 0 : pos + 1;
    const current = line[pos] as number;
    out[n] = current;
    peak = Math.max(peak, Math.abs(current));
    const averaged = loss * 0.5 * (current + (line[next] as number));
    const y = allpassC * averaged + apIn - allpassC * apOut;
    apIn = averaged;
    apOut = y;
    line[pos] = y;
    pos = next;
  }

  const gain = 0.8 / peak;
  for (let n = 0; n < length; n++) out[n] = (out[n] as number) * gain;
  return out;
}

/** Warm (low-passed) noise, combed to mimic plucking near the bridge, with DC removed. */
function excitation(length: number, seed: number): Float32Array {
  const random = mulberry32(seed * 7919);
  const noise = new Float32Array(length);
  let smooth = 0;
  for (let i = 0; i < length; i++) {
    smooth += 0.55 * (random() * 2 - 1 - smooth);
    noise[i] = smooth;
  }
  const pickOffset = Math.max(1, Math.round(length * 0.13));
  const line = new Float32Array(length);
  let mean = 0;
  for (let i = 0; i < length; i++) {
    const value = (noise[i] as number) - (i >= pickOffset ? (noise[i - pickOffset] as number) : 0);
    line[i] = value;
    mean += value / length;
  }
  for (let i = 0; i < length; i++) line[i] = (line[i] as number) - mean;
  return line;
}

/** A short decaying noise tail used as a small-room reverb. */
export function makeRoomImpulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  const random = mulberry32(12345);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (random() * 2 - 1) * (1 - i / length) ** 3;
  }
  return impulse;
}

/** A sine "tick" for count-ins and change bells. */
export function scheduleBlip(
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  frequency: number,
  level: number,
  decay: number,
): OscillatorNode {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(level, time + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
  osc.connect(gain).connect(destination);
  osc.start(time);
  osc.stop(time + decay + 0.02);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
  return osc;
}
