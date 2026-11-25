"use client";

/**
 * Tiny synthesized sound manager built on the Web Audio API. No audio
 * files to ship — every effect is a short oscillator/noise burst. Audio
 * contexts can't start before a user gesture in most browsers, so
 * `unlock()` must be called from a click/tap handler before any sound
 * will actually be audible.
 */
export type SoundEffect =
  | "click"
  | "correct"
  | "incorrect"
  | "streak5"
  | "streak10"
  | "complete"
  | "record"
  | "levelup";

class SoundManager {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private _muted = false;

  get muted() {
    return this._muted;
  }

  setMuted(muted: boolean) {
    this._muted = muted;
  }

  unlock() {
    if (this.unlocked) return;
    if (typeof window === "undefined") return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    this.unlocked = true;
  }

  private tone(
    freq: number,
    duration: number,
    opts: { type?: OscillatorType; gain?: number; delay?: number; glideTo?: number } = {},
  ) {
    const ctx = this.ctx;
    if (!ctx || this._muted) return;
    const start = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(freq, start);
    if (opts.glideTo) {
      osc.frequency.exponentialRampToValueAtTime(opts.glideTo, start + duration);
    }
    const peak = opts.gain ?? 0.18;
    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.02, duration / 4));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gainNode).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  play(effect: SoundEffect) {
    if (!this.ctx || this._muted) return;
    switch (effect) {
      case "click":
        this.tone(520, 0.05, { type: "triangle", gain: 0.1 });
        break;
      case "correct":
        this.tone(523.25, 0.1, { type: "sine", gain: 0.2 });
        this.tone(659.25, 0.12, { type: "sine", gain: 0.2, delay: 0.08 });
        this.tone(783.99, 0.16, { type: "sine", gain: 0.18, delay: 0.16 });
        break;
      case "incorrect":
        this.tone(220, 0.16, { type: "sine", gain: 0.12, glideTo: 180 });
        break;
      case "streak5":
        this.tone(659.25, 0.08, { gain: 0.18 });
        this.tone(880, 0.12, { gain: 0.18, delay: 0.09 });
        break;
      case "streak10":
        this.tone(659.25, 0.08, { gain: 0.2 });
        this.tone(880, 0.08, { gain: 0.2, delay: 0.08 });
        this.tone(1174.66, 0.18, { gain: 0.2, delay: 0.16 });
        break;
      case "complete":
        this.tone(523.25, 0.12, { gain: 0.18 });
        this.tone(659.25, 0.12, { gain: 0.18, delay: 0.12 });
        this.tone(783.99, 0.12, { gain: 0.18, delay: 0.24 });
        this.tone(1046.5, 0.22, { gain: 0.2, delay: 0.36 });
        break;
      case "record":
        this.tone(880, 0.1, { gain: 0.2 });
        this.tone(1108.73, 0.1, { gain: 0.2, delay: 0.1 });
        this.tone(1318.51, 0.22, { gain: 0.22, delay: 0.2 });
        break;
      case "levelup":
        this.tone(392, 0.1, { gain: 0.2 });
        this.tone(523.25, 0.1, { gain: 0.2, delay: 0.1 });
        this.tone(659.25, 0.1, { gain: 0.2, delay: 0.2 });
        this.tone(1046.5, 0.3, { gain: 0.24, delay: 0.3 });
        break;
    }
  }
}

export const soundManager = new SoundManager();
