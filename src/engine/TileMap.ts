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

  /** Computed walkability grid (floor + furniture masks). */
  private walkGrid: boolean[][] | null = null;

  /** Set precomputed walkability grid (from engine, includes furniture masks). */
  setWalkGrid(grid: boolean[][]): void {
    this.walkGrid = grid;
  }

  /** Check if a tile coordinate is walkable. */
  isWalkable(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileX >= this.layout.width || tileY < 0 || tileY >= this.layout.height) {
      return false;
    }
    if (this.walkGrid) {
      return this.walkGrid[tileY][tileX];
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

    const startCol = Math.max(0, Math.floor(visible.left / ts));
    const endCol = Math.min(this.layout.width - 1, Math.ceil(visible.right / ts));
    const startRow = Math.max(0, Math.floor(visible.top / ts));
    const endRow = Math.min(this.layout.height - 1, Math.ceil(visible.bottom / ts));

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tile = this.layout.tiles[row][col];
        const worldX = col * ts;
        const worldY = row * ts;

        const screen = camera.worldToScreen(worldX, worldY);
        const nextScreen = camera.worldToScreen(worldX + ts, worldY + ts);
        const exactWidth = Math.round(nextScreen.x) - Math.round(screen.x);
        const exactHeight = Math.round(nextScreen.y) - Math.round(screen.y);

        const dx = Math.round(screen.x);
        const dy = Math.round(screen.y);

        if (tile.type === 'wall') {
          // ── Wall tile: dark wainscot base + lighter upper band ──
          ctx.fillStyle = '#2c1f14';
          ctx.fillRect(dx, dy, exactWidth, exactHeight);
          // Top highlight band (baseboard inside of wall)
          ctx.fillStyle = '#4a3222';
          ctx.fillRect(dx, dy, exactWidth, Math.max(2, Math.round(exactHeight * 0.35)));
        } else {
          // ── Floor tiles: color by zone (spriteIndex = zone id) ──
          ctx.fillStyle = this.getZoneColor(tile.spriteIndex);
          ctx.fillRect(dx, dy, exactWidth, exactHeight);
          // Subtle plank lines (use light overlay on dark zones, dark on light)
          const isDarkZone = tile.spriteIndex === 3; // server room
          ctx.fillStyle = isDarkZone ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
          const gap1 = Math.round(exactHeight * 0.33);
          const gap2 = Math.round(exactHeight * 0.66);
          ctx.fillRect(dx, dy + gap1, exactWidth, 1);
          ctx.fillRect(dx, dy + gap2, exactWidth, 1);
        }
      }
    }
  }

  /** Invalidate the offscreen cache (call when layout changes). */
  invalidateCache(): void {
    this.cacheValid = false;
    this.cache = null;
  }

  /**
   * Zone floor colors keyed by spriteIndex (= ZONE_INDEX[zone] from types.ts).
   *   0 = corridor  (#d4c8b0 — light beige)
   *   1 = work      (#a0744a — medium brown)
   *   2 = lounge    (#b8895a — warm mid-tone)
   *   3 = server    (#2a2a3a — dark navy)
   *   4 = meeting   (#3a6b4a — forest green)
   *   5 = lobby     (#e8e0d0 — cream)
   */
  private static readonly ZONE_COLORS: Record<number, string> = {
    0: '#d4c8b0',
    1: '#a0744a',
    2: '#b8895a',
    3: '#2a2a3a',
    4: '#3a6b4a',
    5: '#e8e0d0',
  };

  private getZoneColor(spriteIndex: number): string {
    return TileMap.ZONE_COLORS[spriteIndex] ?? '#a0744a';
  }

  /** Fallback (unused but kept for API compatibility) */
  private getFallbackColor(tile: TileInfo): string {
    return tile.type === 'wall' ? '#2c1f14' : '#a0744a';
  }
}

