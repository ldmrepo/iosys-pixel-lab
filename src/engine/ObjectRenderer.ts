/**
 * ObjectRenderer — Renders furniture objects (desks, chairs, plants, etc.)
 * from sprite sheets onto the Canvas 2D context.
 *
 * Supports two render layers:
 *   - "wall" layer: rendered below characters (carpets, wall hangings)
 *   - "object" layer: depth-sorted with characters
 *
 * Uses viewport culling to skip off-screen objects.
 */

import type { FurnitureObject, FurnitureSpriteSheet } from '../shared/types';
import { Camera } from './Camera';

export class ObjectRenderer {
  /** Loaded sprite sheet images keyed by sheet ID. */
  private sheets: Map<string, HTMLImageElement> = new Map();

  /** All furniture objects in the scene. */
  private furniture: FurnitureObject[] = [];

  /** Tile size in world pixels. */
  private tileSize: number;

  /** Debug mode: show object IDs on canvas. */
  debug = false;

  constructor(tileSize: number) {
    this.tileSize = tileSize;
  }

  /**
   * Load all furniture sprite sheet images in parallel.
   * Resolves when every sheet has either loaded or failed (non-blocking on error).
   */
  async loadSheets(sheetDefs: Record<string, FurnitureSpriteSheet>): Promise<void> {
    const promises = Object.entries(sheetDefs).map(([id, def]) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.sheets.set(id, img);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load furniture sheet: ${id} (${def.url})`);
          resolve();
        };
        img.src = def.url;
      });
    });
    await Promise.all(promises);
  }

  /** Replace the furniture list. */
  setFurniture(furniture: FurnitureObject[]): void {
    this.furniture = furniture;
  }

  /**
   * Render the "wall" layer furniture -- items that appear beneath characters
   * (e.g., carpets, floor mats, wall paintings drawn at ground level).
   * Applies viewport culling so off-screen objects are skipped.
   */
  renderWallLayer(ctx: CanvasRenderingContext2D, camera: Camera): void {
    for (const obj of this.furniture) {
      if (obj.layer !== 'wall') continue;
      if (!this.isVisible(obj, camera)) continue;
      this.renderObject(ctx, camera, obj);
    }
  }

  /**
   * Render a single furniture object onto the canvas.
   *
   * Coordinate pipeline:
   *   1. Compute world position from tile coordinates and drawOffsetY
   *   2. Convert to screen position via camera.worldToScreen
   *   3. Draw the sprite region scaled by camera.zoom
   */
  renderObject(ctx: CanvasRenderingContext2D, camera: Camera, obj: FurnitureObject): void {
    const sheet = this.sheets.get(obj.sprite.sheetId);
    if (!sheet) return;

    const { sx, sy, sw, sh } = obj.sprite.region;

    // World position: tile origin with optional vertical offset
    // drawOffsetY shifts the sprite upward (e.g., tall bookshelf drawn above its footprint)
    const worldX = obj.tileX * this.tileSize + (obj.drawOffsetX ?? 0);
    const worldY = obj.tileY * this.tileSize - (obj.drawOffsetY ?? 0);

    // Convert to screen coordinates
    const screenPos = camera.worldToScreen(worldX, worldY);

    // Scale sprite dimensions by current zoom; use explicit render size when provided
    const drawWidth = (obj.renderWidth ?? sw) * camera.zoom;
    const drawHeight = (obj.renderHeight ?? sh) * camera.zoom;

    ctx.drawImage(
      sheet,
      sx, sy, sw, sh,
      screenPos.x, screenPos.y, drawWidth, drawHeight,
    );

    // Debug: draw object ID label (small text)
    if (this.debug) {
      const label = obj.id;
      const fontSize = Math.max(5, 6 * camera.zoom);
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      const labelX = screenPos.x + drawWidth / 2;
      const labelY = screenPos.y + drawHeight - 2 * camera.zoom;
      // Background
      const metrics = ctx.measureText(label);
      const pad = 1;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(
        labelX - metrics.width / 2 - pad,
        labelY - fontSize / 2 - pad,
        metrics.width + pad * 2,
        fontSize + pad * 2,
      );
      // Text
      ctx.fillStyle = '#00ff00';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, labelX, labelY);
    }
  }

  /**
   * Return all furniture that belongs to the "object" layer (anything not "wall").
   * These items need depth-sorting alongside characters.
   */
  getObjectLayerFurniture(): FurnitureObject[] {
    return this.furniture.filter((f) => f.layer !== 'wall');
  }

  /**
   * Compute the Y value used for depth sorting.
   *
   * Uses the explicit sortY if provided, otherwise defaults to the bottom
   * edge of the furniture's tile footprint.  The result is in world pixels
   * so it can be compared directly with character worldY values.
   */
  getSortY(obj: FurnitureObject): number {
    const row = obj.sortY ?? (obj.tileY + obj.heightTiles - 1);
    return (row + 1) * this.tileSize; // bottom edge of the tile row
  }

  /**
   * Check whether a furniture object's bounding box intersects the camera's
   * visible rectangle.  Returns false for objects entirely outside the viewport
   * so they can be skipped during rendering.
   */
  private isVisible(obj: FurnitureObject, camera: Camera): boolean {
    const rw = obj.renderWidth ?? obj.sprite.region.sw;
    const rh = obj.renderHeight ?? obj.sprite.region.sh;

    // Bounding box in world coordinates
    const objLeft = obj.tileX * this.tileSize;
    const objTop = obj.tileY * this.tileSize - (obj.drawOffsetY ?? 0);
    const objRight = objLeft + rw;
    const objBottom = objTop + rh;

    const visible = camera.getVisibleRect();

    // AABB overlap test
    return (
      objRight > visible.left &&
      objLeft < visible.right &&
      objBottom > visible.top &&
      objTop < visible.bottom
    );
  }
}
