/**
 * Fully procedural Web Audio sound design — no audio files, no network.
 * The AudioContext is only created after an explicit user gesture
 * (the "Start Driving" button or the first drive key), so nothing is audible
 * before the visitor interacts.
 */

type Ctx = AudioContext;

class SoundEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engineOscA: OscillatorNode | null = null;
  private engineOscB: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private roadGain: GainNode | null = null;
  private roadFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private birdTimer: ReturnType<typeof setTimeout> | null = null;
  private enabled = true;
  private started = false;

  get isStarted() {
    return this.started;
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  start() {
    if (this.started) {
      void this.ctx?.resume();
      return;
    }
    const AC: typeof AudioContext | undefined =
      typeof window !== "undefined"
        ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    this.started = true;
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.master.gain.setTargetAtTime(this.enabled ? 0.9 : 0, ctx.currentTime, 0.6);

    const noise = this.noiseBuffer(ctx);

    // Engine: two detuned oscillators through a low-pass filter.
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = "lowpass";
    this.engineFilter.frequency.value = 420;
    this.engineFilter.Q.value = 2;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineOscA = ctx.createOscillator();
    this.engineOscA.type = "sawtooth";
    this.engineOscB = ctx.createOscillator();
    this.engineOscB.type = "square";
    const bGain = ctx.createGain();
    bGain.gain.value = 0.35;
    this.engineOscA.connect(this.engineFilter);
    this.engineOscB.connect(bGain).connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain).connect(this.master);
    this.engineOscA.frequency.value = 48;
    this.engineOscB.frequency.value = 24;
    this.engineOscA.start();
    this.engineOscB.start();

    // Tyre / road rumble: band-passed noise.
    const roadSrc = ctx.createBufferSource();
    roadSrc.buffer = noise;
    roadSrc.loop = true;
    this.roadFilter = ctx.createBiquadFilter();
    this.roadFilter.type = "bandpass";
    this.roadFilter.frequency.value = 700;
    this.roadFilter.Q.value = 0.7;
    this.roadGain = ctx.createGain();
    this.roadGain.gain.value = 0;
    roadSrc.connect(this.roadFilter).connect(this.roadGain).connect(this.master);
    roadSrc.start();

    // Ambient wind: slow, low-passed noise with a breathing LFO.
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = noise;
    windSrc.loop = true;
    windSrc.playbackRate.value = 0.5;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 380;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.035;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(this.windGain.gain);
    lfo.start();
    windSrc.connect(windFilter).connect(this.windGain).connect(this.master);
    windSrc.start();

    this.scheduleBirds();
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.15);
    }
  }

  /** Called every frame by the vehicle. */
  update(speedRatio: number, throttle: number, offroad: boolean, active: boolean) {
    const ctx = this.ctx;
    if (!ctx || !this.engineGain || !this.engineOscA || !this.engineOscB || !this.engineFilter) return;
    const t = ctx.currentTime;
    const s = Math.min(1, Math.abs(speedRatio));
    const idle = active ? 1 : 0.4;
    const base = 44 + s * 92 + throttle * 14;
    this.engineOscA.frequency.setTargetAtTime(base, t, 0.08);
    this.engineOscB.frequency.setTargetAtTime(base * 0.5 + 1.5, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(320 + s * 900 + throttle * 300, t, 0.1);
    this.engineGain.gain.setTargetAtTime((0.028 + s * 0.04 + throttle * 0.025) * idle, t, 0.12);
    if (this.roadGain && this.roadFilter) {
      this.roadGain.gain.setTargetAtTime(s * (offroad ? 0.11 : 0.05), t, 0.15);
      this.roadFilter.frequency.setTargetAtTime(offroad ? 320 : 650 + s * 500, t, 0.2);
    }
  }

  /** Soft two-note chime for discoveries / opening panels. */
  chime(kind: "discover" | "open" | "close" = "open") {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const notes = kind === "discover" ? [659.25, 987.77, 1318.5] : kind === "open" ? [523.25, 783.99] : [783.99, 523.25];
    notes.forEach((f, i) => {
      const t0 = ctx.currentTime + i * 0.09;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.07, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
      o.connect(g).connect(this.master!);
      o.start(t0);
      o.stop(t0 + 1);
    });
  }

  private tone(f: number, t0: number, dur: number, gain: number, type: OscillatorType = "sine", endF?: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (endF) o.frequency.exponentialRampToValueAtTime(endF, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master!);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  /** Bright blip for collecting a token. */
  token() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.tone(880, t, 0.12, 0.06, "triangle", 1320);
    this.tone(1320, t + 0.07, 0.18, 0.05, "triangle", 1760);
  }

  /** Two-tone car horn. */
  honk() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.tone(392, t, 0.32, 0.06, "square");
    this.tone(494, t, 0.32, 0.04, "square");
  }

  /** Short celebratory arpeggio for completing the world. */
  fanfare() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, t + i * 0.12, 0.6, 0.06, "triangle"));
  }

  /** Short muffled thud for collisions. */
  thud(strength: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(120, t0);
    o.frequency.exponentialRampToValueAtTime(45, t0 + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(Math.min(0.25, 0.06 + strength * 0.02), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
    o.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + 0.3);
  }

  private chirp() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    pan.connect(this.master);
    const reps = 2 + Math.floor(Math.random() * 3);
    const baseF = 2400 + Math.random() * 1600;
    for (let i = 0; i < reps; i++) {
      const t0 = ctx.currentTime + i * (0.11 + Math.random() * 0.05);
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(baseF, t0);
      o.frequency.exponentialRampToValueAtTime(baseF * (1.25 + Math.random() * 0.3), t0 + 0.07);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.012, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      o.connect(g).connect(pan);
      o.start(t0);
      o.stop(t0 + 0.1);
    }
  }

  private scheduleBirds() {
    const next = 3500 + Math.random() * 7000;
    this.birdTimer = setTimeout(() => {
      if (this.enabled && this.ctx?.state === "running") this.chirp();
      this.scheduleBirds();
    }, next);
  }

  private noiseBuffer(ctx: Ctx) {
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // Slightly pinked noise sounds less harsh.
      last = 0.97 * last + 0.03 * (Math.random() * 2 - 1);
      data[i] = last * 6;
    }
    return buffer;
  }

  suspend() {
    void this.ctx?.suspend();
  }

  resume() {
    void this.ctx?.resume();
  }

  dispose() {
    if (this.birdTimer) clearTimeout(this.birdTimer);
    void this.ctx?.close();
    this.ctx = null;
    this.started = false;
  }
}

export const sound = new SoundEngine();
