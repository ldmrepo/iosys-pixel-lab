/**
 * GameLoop — requestAnimationFrame-based game loop with frame-independent timing.
 *
 * Provides update(dt) -> render() cycle at ~60fps with deltaTime capping
 * to prevent physics jumps on tab switch.
 */

export type UpdateFn = (dt: number) => void;
export type RenderFn = () => void;

export class GameLoop {
  private rafId: number | null = null;
  private lastTime: number = 0;
  private running: boolean = false;
  private paused: boolean = false;

  private updateFn: UpdateFn;
  private renderFn: RenderFn;

  /** Maximum deltaTime cap in seconds. Prevents physics jumps on tab switch. */
  private readonly maxDt: number = 0.1;

  constructor(updateFn: UpdateFn, renderFn: RenderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
  }

  /** Start the game loop. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  /** Stop the game loop entirely. */
  stop(): void {
    this.running = false;
    this.paused = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Pause: keeps rAF alive but skips update/render. */
  pause(): void {
    this.paused = true;
  }

  /** Resume from pause. */
  resume(): void {
    if (!this.running) return;
    this.paused = false;
    this.lastTime = performance.now();
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  private tick = (now: number): void => {
    if (!this.running) return;

    this.rafId = requestAnimationFrame(this.tick);

    if (this.paused) {
      this.lastTime = now;
      return;
    }

    // Calculate deltaTime in seconds, capped to maxDt
    let dt = (now - this.lastTime) / 1000;
    if (dt > this.maxDt) {
      dt = this.maxDt;
    }
    // Guard against negative dt (rare, but possible with performance.now quirks)
    if (dt < 0) {
      dt = 0;
    }
    this.lastTime = now;

    this.updateFn(dt);
    this.renderFn();
  };
}
