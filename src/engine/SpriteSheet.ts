/**
 * SpriteSheet — Loads a sprite sheet image and draws individual frames.
 *
 * Frame indexing: left-to-right, top-to-bottom.
 * frameIndex = row * columns + col
 */

export class SpriteSheet {
  private image: HTMLImageElement | null = null;
  private loaded: boolean = false;
  private columns: number = 0;
  private rows: number = 0;

  readonly url: string;
  readonly frameWidth: number;
  readonly frameHeight: number;

  constructor(url: string, frameWidth: number, frameHeight: number) {
    this.url = url;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
  }

  /** Load the sprite sheet image. Resolves when fully loaded. */
  load(): Promise<void> {
    if (this.loaded && this.image) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        this.image = img;
        this.columns = Math.floor(img.width / this.frameWidth);
        this.rows = Math.floor(img.height / this.frameHeight);
        this.loaded = true;
        resolve();
      };

      img.onerror = () => {
        reject(new Error(`Failed to load sprite sheet: ${this.url}`));
      };

      img.src = this.url;
    });
  }

  /** Whether the image has finished loading. */
  get isLoaded(): boolean {
    return this.loaded;
  }

  /** Total number of frames in the sheet. */
  get totalFrames(): number {
    return this.columns * this.rows;
  }

  /** Number of columns in the sheet. */
  get columnCount(): number {
    return this.columns;
  }

  /**
   * Draw a single frame to the canvas context.
   *
   * @param ctx - Canvas 2D rendering context
   * @param frameIndex - Index of the frame (left-to-right, top-to-bottom)
   * @param x - Destination x position on canvas
   * @param y - Destination y position on canvas
   * @param scale - Optional scale factor (default 1)
   */
  drawFrame(
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    x: number,
    y: number,
    scale: number = 1
  ): void {
    if (!this.image || !this.loaded || this.columns === 0) return;

    const col = frameIndex % this.columns;
    const row = Math.floor(frameIndex / this.columns);

    const sx = col * this.frameWidth;
    const sy = row * this.frameHeight;

    ctx.drawImage(
      this.image,
      sx,
      sy,
      this.frameWidth,
      this.frameHeight,
      Math.round(x),
      Math.round(y),
      Math.round(this.frameWidth * scale),
      Math.round(this.frameHeight * scale)
    );
  }
}
