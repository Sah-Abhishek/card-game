// Synthesised sound effects (Web Audio) — no audio files to ship.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let muted = (() => {
  try {
    return localStorage.getItem('al-muted') === '1';
  } catch {
    return false;
  }
})();

function audio() {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem('al-muted', m ? '1' : '0');
  } catch {
    /* private mode */
  }
  if (m && ctx) void ctx.suspend();
}

/** Filtered noise burst: the building block for flicks, riffles and crowds. */
function burst(opts: { at?: number; dur: number; freq: number; q?: number; gain: number; type?: BiquadFilterType; attack?: number }) {
  const a = audio();
  if (!a || !noise || !master) return;
  const t = a.currentTime + (opts.at ?? 0);
  const src = a.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = a.createBiquadFilter();
  f.type = opts.type ?? 'bandpass';
  f.frequency.value = opts.freq;
  f.Q.value = opts.q ?? 1;
  const g = a.createGain();
  const attack = opts.attack ?? 0.004;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random());
  src.stop(t + opts.dur + 0.05);
}

function tone(opts: { at?: number; dur: number; freq: number; to?: number; type?: OscillatorType; gain: number; attack?: number }) {
  const a = audio();
  if (!a || !master) return;
  const t = a.currentTime + (opts.at ?? 0);
  const o = a.createOscillator();
  o.type = opts.type ?? 'sine';
  o.frequency.setValueAtTime(opts.freq, t);
  if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + opts.dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain, t + (opts.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + opts.dur + 0.05);
}

export const sfx = {
  /** one card snapping off the deck */
  flick(at = 0) {
    burst({ at, dur: 0.07, freq: 3800, q: 0.8, gain: 0.35 });
  },
  /** a card sliding across the table */
  deal(at = 0) {
    burst({ at, dur: 0.16, freq: 2400, q: 0.6, gain: 0.22, attack: 0.02 });
  },
  flip(at = 0) {
    burst({ at, dur: 0.12, freq: 1800, q: 1.4, gain: 0.3, attack: 0.01 });
    burst({ at: at + 0.05, dur: 0.05, freq: 4200, q: 1, gain: 0.18 });
  },
  /** the classic riffle: a fast stream of flicks that slows at the end */
  riffle(duration = 0.9) {
    const n = 26;
    for (let i = 0; i < n; i++) {
      const p = i / n;
      burst({ at: duration * (p + p * p * 0.25) * 0.8, dur: 0.035, freq: 3000 + Math.random() * 1600, q: 1.2, gain: 0.16 + Math.random() * 0.1 });
    }
    burst({ at: duration, dur: 0.12, freq: 900, q: 0.7, gain: 0.25 }); // square up
  },
  click() {
    tone({ dur: 0.05, freq: 1400, to: 900, type: 'triangle', gain: 0.12 });
  },
  select() {
    tone({ dur: 0.09, freq: 660, to: 990, type: 'triangle', gain: 0.14 });
  },
  hit(strength = 1) {
    tone({ dur: 0.35, freq: 140, to: 45, type: 'sine', gain: 0.6 * strength });
    burst({ dur: 0.18, freq: 600, q: 0.5, gain: 0.45 * strength, type: 'lowpass' });
    burst({ at: 0.01, dur: 0.08, freq: 3000, q: 0.7, gain: 0.2 * strength });
  },
  bigHit() {
    sfx.hit(1.3);
    tone({ at: 0.02, dur: 0.9, freq: 90, to: 30, type: 'sawtooth', gain: 0.25 });
    burst({ at: 0.05, dur: 1.2, freq: 300, q: 0.4, gain: 0.3, type: 'lowpass', attack: 0.05 });
  },
  whoosh(at = 0) {
    const a = audio();
    if (!a || !noise || !master) return;
    const t = a.currentTime + at;
    const src = a.createBufferSource();
    src.buffer = noise;
    const f = a.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 2;
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(3500, t + 0.35);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + 0.5);
  },
  bell(times = 3) {
    for (let i = 0; i < times; i++) {
      const at = i * 0.32;
      for (const [m, gn] of [
        [1, 0.32],
        [2.76, 0.14],
        [5.4, 0.07],
      ] as const)
        tone({ at, dur: 1.4, freq: 880 * m, type: 'sine', gain: gn, attack: 0.002 });
    }
  },
  crowd(intensity = 1, dur = 1.6) {
    burst({ dur, freq: 900, q: 0.35, gain: 0.25 * intensity, attack: 0.25 });
    burst({ at: 0.1, dur: dur * 0.9, freq: 1800, q: 0.5, gain: 0.12 * intensity, attack: 0.3 });
  },
  count(n: number) {
    // the ref's hand slapping the mat
    burst({ dur: 0.12, freq: 500, q: 0.6, gain: 0.55, type: 'lowpass' });
    tone({ dur: 0.18, freq: 120 - n * 10, to: 60, gain: 0.35 });
  },
  kickout() {
    sfx.whoosh();
    sfx.crowd(1.4, 2);
  },
  finisher() {
    tone({ dur: 0.7, freq: 60, to: 220, type: 'sawtooth', gain: 0.18, attack: 0.3 });
    sfx.whoosh(0.35);
  },
  momentum() {
    tone({ dur: 0.18, freq: 880, to: 1320, type: 'triangle', gain: 0.12 });
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ at: i * 0.14, dur: 0.6, freq: f, type: 'triangle', gain: 0.18 }));
    sfx.crowd(1.6, 3);
  },
  lose() {
    [392, 330, 262].forEach((f, i) => tone({ at: i * 0.22, dur: 0.7, freq: f, type: 'triangle', gain: 0.15 }));
  },
};
