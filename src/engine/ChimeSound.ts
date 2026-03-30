/**
 * ChimeSound — Web Audio API 2-note ascending chime for turn completion.
 * E5 (659.25 Hz) -> E6 (1318.51 Hz), sine waveform, 0.14 gain, 180ms per note.
 */

const LOCALSTORAGE_KEY = 'pixel-office-sound-enabled';

export class ChimeSound {
  private ctx: AudioContext | null = null;
  private _muted: boolean;

  constructor() {
    // Read persisted mute state (default: enabled)
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    this._muted = stored === 'false';
  }

  get muted(): boolean {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = value;
    localStorage.setItem(LOCALSTORAGE_KEY, value ? 'false' : 'true');
  }

  /** Toggle mute state. Returns new muted value. */
  toggle(): boolean {
    this.muted = !this._muted;
    return this._muted;
  }

  /**
   * Play the 2-note ascending chime.
   * Creates AudioContext on first call (requires user gesture).
   * No-op if muted.
   */
  play(): void {
    if (this._muted) return;

    // Lazy-init AudioContext (browser requires user gesture)
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }

    // Resume if suspended (autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const gain = 0.14;
    const noteDuration = 0.18; // 180ms per note

    // Note 1: E5 (659.25 Hz)
    this.playTone(659.25, now, noteDuration, gain);
    // Note 2: E6 (1318.51 Hz)
    this.playTone(1318.51, now + noteDuration, noteDuration, gain);
  }

  private playTone(freq: number, startTime: number, duration: number, volume: number): void {
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    gainNode.gain.setValueAtTime(volume, startTime);
    // Quick fade-out in last 20ms to avoid click
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}
