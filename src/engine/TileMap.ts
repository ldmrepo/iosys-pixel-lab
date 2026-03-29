/**
 * TileMap — Renders the office tile grid and provides collision/walkability queries.
 *
 * Uses an OfficeLayout to determine tile types and a SpriteSheet for rendering.
 * Supports viewport culling so only visible tiles are drawn each frame.
 * Optionally caches the static floor layer to an offscreen canvas.
 */

import type { OfficeLayout, TileInfo, Seat } from '../shared/types';
import { SpriteSheet } from './SpriteSheet';
import { Camera } from './Camera';

export class TileMap {
  private layout: OfficeLayout;
  private spriteSheet: SpriteSheet;

  /** Offscreen canvas cache for the static tile layer. */
  private cache: HTMLCanvasElement | null = null;
  private cacheValid: boolean = false;

  constructor(layout: OfficeLayout, spriteSheet: SpriteSheet) {
    this.layout = layout;
    this.spriteSheet = spriteSheet;
  }

  /** Update the layout (e.g. if seats change assignment). */
  setLayout(layout: OfficeLayout): void {
    this.layout = layout;
    this.invalidateCache();
  }

  /** Check if a tile coordinate is walkable. */
  isWalkable(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileX >= this.layout.width || tileY < 0 || tileY >= this.layout.height) {
      return false;
    }
    return this.layout.tiles[tileY][tileX].walkable;
  }

  /** Get all seats from the layout. */
  getSeats(): Seat[] {
    return this.layout.seats;
  }

  /** Get tile info at a specific coordinate. */
  getTile(tileX: number, tileY: number): TileInfo | null {
    if (tileX < 0 || tileX >= this.layout.width || tileY < 0 || tileY >= this.layout.height) {
      return null;
    }
    return this.layout.tiles[tileY][tileX];
  }

  /** Convert tile coordinates to world pixel coordinates (top-left of tile). */
  tileToWorld(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * this.layout.tileSize,
      y: tileY * this.layout.tileSize,
    };
  }

  /** Convert world pixel coordinates to tile coordinates (floored). */
  worldToTile(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: Math.floor(worldX / this.layout.tileSize),
      y: Math.floor(worldY / this.layout.tileSize),
    };
  }

  /** Get world dimensions in pixels. */
  getWorldSize(): { width: number; height: number } {
    return {
      width: this.layout.width * this.layout.tileSize,
      height: this.layout.height * this.layout.tileSize,
    };
  }

  /** Get layout dimensions in tiles. */
  getGridSize(): { width: number; height: number } {
    return {
      width: this.layout.width,
      height: this.layout.height,
    };
  }

  get tileSize(): number {
    return this.layout.tileSize;
  }

  /**
   * Render visible tiles to the canvas.
   * Only draws tiles that overlap with the camera's visible rectangle (off-screen culling).
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const ts = this.layout.tileSize;
    const visible = camera.getVisibleRect();

    // Determine the range of tiles visible
    const startCol = Math.max(0, Math.floor(visible.left / ts));
    const endCol = Math.min(this.layout.width - 1, Math.ceil(visible.right / ts));
    const startRow = Math.max(0, Math.floor(visible.top / ts));
    const endRow = Math.min(this.layout.height - 1, Math.ceil(visible.bottom / ts));

    // If sprite sheet is loaded, use it. Otherwise draw colored rectangles as fallback.
    const useSpriteSheet = this.spriteSheet.isLoaded;

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tile = this.layout.tiles[row][col];
        const worldX = col * ts;
        const worldY = row * ts;

        // Convert to screen coordinates
        const screen = camera.worldToScreen(worldX, worldY);
        const screenSize = ts * camera.zoom;

        if (useSpriteSheet) {
          ctx.save();
          // Scale the sprite to match zoomed tile size
          this.spriteSheet.drawFrame(
            ctx,
            tile.spriteIndex,
            screen.x,
            screen.y,
            camera.zoom
          );
          ctx.restore();
        } else {
          // Fallback: colored rectangles based on tile type
          ctx.fillStyle = this.getFallbackColor(tile);
          ctx.fillRect(
            Math.round(screen.x),
            Math.round(screen.y),
            Math.ceil(screenSize),
            Math.ceil(screenSize)
          );

          // Draw grid lines for visual clarity
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 1;
          ctx.strokeRect(
            Math.round(screen.x),
            Math.round(screen.y),
            Math.ceil(screenSize),
            Math.ceil(screenSize)
          );
        }
      }
    }
  }

  /**
   * Render the furniture/object layer (desks, chairs, decorations) on top of floor.
   * Separated from floor rendering for proper layering with characters.
   */
  renderObjects(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const ts = this.layout.tileSize;
    const visible = camera.getVisibleRect();

    const startCol = Math.max(0, Math.floor(visible.left / ts));
    const endCol = Math.min(this.layout.width - 1, Math.ceil(visible.right / ts));
    const startRow = Math.max(0, Math.floor(visible.top / ts));
    const endRow = Math.min(this.layout.height - 1, Math.ceil(visible.bottom / ts));

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tile = this.layout.tiles[row][col];
        // Only render non-floor, non-wall tiles in the object layer
        if (tile.type === 'floor' || tile.type === 'wall') continue;

        const worldX = col * ts;
        const worldY = row * ts;
        const screen = camera.worldToScreen(worldX, worldY);

        if (this.spriteSheet.isLoaded) {
          this.spriteSheet.drawFrame(
            ctx,
            tile.spriteIndex,
            screen.x,
            screen.y,
            camera.zoom
          );
        }
        // Fallback colors are already drawn in the main render pass
      }
    }
  }

  /** Invalidate the offscreen cache (call when layout changes). */
  invalidateCache(): void {
    this.cacheValid = false;
    this.cache = null;
  }

  /** Get a fallback color for tile types when sprites are not loaded. */
  private getFallbackColor(tile: TileInfo): string {
    switch (tile.type) {
      case 'floor':
        return '#e8dcc8';
      case 'wall':
        return '#8b7355';
      case 'desk':
        return '#a0522d';
      case 'chair':
        return '#6b8e23';
      case 'decoration':
        return '#4682b4';
      default:
        return '#cccccc';
    }
  }
}
