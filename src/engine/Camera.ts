/**
 * Camera — Viewport management with panning and zooming.
 *
 * Converts between world coordinates (tile-based) and screen coordinates (canvas pixels).
 * Supports smooth focus-on with lerp interpolation.
 */

export class Camera {
  /** World position of camera center. */
  x: number = 0;
  y: number = 0;

  /** Zoom level: 1.0 = 100%. Range: [minZoom, maxZoom]. */
  zoom: number = 1.0;

  /** Canvas viewport dimensions in CSS pixels. */
  viewportWidth: number;
  viewportHeight: number;

  /** Zoom constraints. */
  readonly minZoom: number = 0.5;
  readonly maxZoom: number = 6.0;

  /** World bounds for clamping (set after tilemap is loaded). */
  worldWidth: number = 0;
  worldHeight: number = 0;

  /** Smooth focus target. null means no active smooth focus. */
  private focusTarget: { x: number; y: number } | null = null;
  private readonly focusLerpSpeed: number = 4.0; // units per second multiplier

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  /** Set world bounds for camera clamping. */
  setWorldBounds(width: number, height: number): void {
    this.worldWidth = width;
    this.worldHeight = height;
  }

  /** Pan the camera by screen-space delta (already accounting for zoom). */
  pan(dx: number, dy: number): void {
    this.x -= dx / this.zoom;
    this.y -= dy / this.zoom;
    this.clamp();
    // Cancel smooth focus when user manually pans
    this.focusTarget = null;
  }

  /** Set zoom level, clamped to [minZoom, maxZoom]. */
  setZoom(newZoom: number): void {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
    this.clamp();
  }

  /**
   * Smoothly move camera to center on a world position.
   * Call update(dt) each frame to animate.
   */
  focusOn(worldX: number, worldY: number): void {
    this.focusTarget = { x: worldX, y: worldY };
  }

  /** Immediately center on a world position (no animation). */
  centerOn(worldX: number, worldY: number): void {
    this.x = worldX;
    this.y = worldY;
    this.focusTarget = null;
    this.clamp();
  }

  /**
   * Update smooth focus interpolation.
   * Call this in the game loop update phase.
   */
  update(dt: number): void {
    if (!this.focusTarget) return;

    const t = 1 - Math.exp(-this.focusLerpSpeed * dt);
    this.x += (this.focusTarget.x - this.x) * t;
    this.y += (this.focusTarget.y - this.y) * t;

    // Snap when close enough
    const dist = Math.abs(this.focusTarget.x - this.x) + Math.abs(this.focusTarget.y - this.y);
    if (dist < 0.5) {
      this.x = this.focusTarget.x;
      this.y = this.focusTarget.y;
      this.focusTarget = null;
    }

    this.clamp();
  }

  /**
   * Convert world coordinates to screen (canvas) coordinates.
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const sx = (worldX - this.x) * this.zoom + this.viewportWidth / 2;
    const sy = (worldY - this.y) * this.zoom + this.viewportHeight / 2;
    return { x: sx, y: sy };
  }

  /**
   * Convert screen (canvas) coordinates to world coordinates.
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const wx = (screenX - this.viewportWidth / 2) / this.zoom + this.x;
    const wy = (screenY - this.viewportHeight / 2) / this.zoom + this.y;
    return { x: wx, y: wy };
  }

  /**
   * Get the visible world rectangle (for culling).
   */
  getVisibleRect(): { left: number; top: number; right: number; bottom: number } {
    const halfW = this.viewportWidth / 2 / this.zoom;
    const halfH = this.viewportHeight / 2 / this.zoom;
    return {
      left: this.x - halfW,
      top: this.y - halfH,
      right: this.x + halfW,
      bottom: this.y + halfH,
    };
  }

  /** Clamp camera position to world bounds. */
  private clamp(): void {
    if (this.worldWidth <= 0 || this.worldHeight <= 0) return;

    const halfViewW = this.viewportWidth / 2 / this.zoom;
    const halfViewH = this.viewportHeight / 2 / this.zoom;

    // If the viewport is larger than the world, center it
    if (halfViewW * 2 >= this.worldWidth) {
      this.x = this.worldWidth / 2;
    } else {
      this.x = Math.max(halfViewW, Math.min(this.worldWidth - halfViewW, this.x));
    }

    if (halfViewH * 2 >= this.worldHeight) {
      this.y = this.worldHeight / 2;
    } else {
      this.y = Math.max(halfViewH, Math.min(this.worldHeight - halfViewH, this.y));
    }
  }
}
