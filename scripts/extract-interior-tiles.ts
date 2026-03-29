/**
 * extract-interior-tiles.ts
 *
 * Extracts tiles from MetroCity Interior Home assets and assembles
 * the office-tiles.png tileset (128x64, 8 columns x 4 rows, 16x16 per tile).
 *
 * Tile index mapping (must match office-layout.ts):
 *   0  = floor (light)    <- TilesHouse.png wood floor
 *   1  = floor (dark)     <- TilesHouse.png darker wood floor
 *   2  = wall (top)       <- TilesHouse.png wall header
 *   3  = wall (side)      <- TilesHouse.png wall body
 *   4  = desk (top)       <- Kitchen-Sheet cabinet, top half
 *   5  = desk (front)     <- Kitchen-Sheet cabinet, bottom half
 *   6  = chair            <- Miscellaneous-Sheet chair
 *   7  = plant            <- Flowers-Sheet potted plant
 *   8  = bookshelf        <- Cupboard-Sheet bookshelf
 *   9  = rug              <- Carpet-Sheet carpet pattern
 *   10 = whiteboard       <- Paintings-Sheet painting / TV-Sheet
 *   11 = water cooler     <- Kitchen-Sheet fridge/dispenser
 *
 * Usage: npx tsx scripts/extract-interior-tiles.ts
 */

import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// Constants
// ============================================================

const TILE = 16; // output tile size
const OUT_COLS = 8;
const OUT_ROWS = 4;
const OUT_W = TILE * OUT_COLS; // 128
const OUT_H = TILE * OUT_ROWS; // 64

// ============================================================
// PNG helpers
// ============================================================

function loadPNG(filePath: string): PNG {
  const data = fs.readFileSync(filePath);
  return PNG.sync.read(data);
}

function createPNG(w: number, h: number): PNG {
  const png = new PNG({ width: w, height: h });
  // Initialize to fully transparent
  png.data.fill(0);
  return png;
}

/**
 * Copy a rectangular region from src to dst with no scaling.
 * Clips to source bounds automatically.
 */
function copyRegion(
  dst: PNG,
  dstX: number,
  dstY: number,
  src: PNG,
  srcX: number,
  srcY: number,
  w: number,
  h: number,
): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = srcX + x;
      const sy = srcY + y;
      const dx = dstX + x;
      const dy = dstY + y;
      if (sx < 0 || sy < 0 || sx >= src.width || sy >= src.height) continue;
      if (dx < 0 || dy < 0 || dx >= dst.width || dy >= dst.height) continue;
      const srcIdx = (sy * src.width + sx) * 4;
      const dstIdx = (dy * dst.width + dx) * 4;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }
}

/**
 * Downscale a region from src into a TILE x TILE area in dst,
 * using nearest-neighbor interpolation to preserve pixel art quality.
 */
function downscaleRegion(
  dst: PNG,
  dstX: number,
  dstY: number,
  src: PNG,
  srcX: number,
  srcY: number,
  srcW: number,
  srcH: number,
): void {
  for (let dy = 0; dy < TILE; dy++) {
    for (let dx = 0; dx < TILE; dx++) {
      // Map destination pixel to source pixel (nearest neighbor)
      const sx = srcX + Math.floor((dx * srcW) / TILE);
      const sy = srcY + Math.floor((dy * srcH) / TILE);
      if (sx >= src.width || sy >= src.height) continue;
      const srcIdx = (sy * src.width + sx) * 4;
      const outX = dstX + dx;
      const outY = dstY + dy;
      if (outX >= dst.width || outY >= dst.height) continue;
      const dstIdx = (outY * dst.width + outX) * 4;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }
}

/**
 * Place a tile at a given tile-index position (0-31) in the output image.
 * Index 0 = row 0 col 0, index 1 = row 0 col 1, ... index 8 = row 1 col 0, etc.
 */
function tilePos(index: number): { x: number; y: number } {
  const col = index % OUT_COLS;
  const row = Math.floor(index / OUT_COLS);
  return { x: col * TILE, y: row * TILE };
}

// ============================================================
// Main
// ============================================================

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const homeDir = path.join(projectRoot, 'public', 'assets', 'metrocity', 'Interior', 'Home');
  const outDir = path.join(projectRoot, 'public', 'assets', 'tiles');

  fs.mkdirSync(outDir, { recursive: true });

  console.log('[extract] Loading MetroCity Interior assets...');

  const tilesHouse = loadPNG(path.join(homeDir, 'TilesHouse.png'));
  const miscSheet = loadPNG(path.join(homeDir, 'Miscellaneous-Sheet.png'));
  const flowersSheet = loadPNG(path.join(homeDir, 'Flowers-Sheet.png'));
  const cupboardSheet = loadPNG(path.join(homeDir, 'Cupboard-Sheet.png'));
  const carpetSheet = loadPNG(path.join(homeDir, 'Carpet-Sheet.png'));
  const paintingsSheet = loadPNG(path.join(homeDir, 'Paintings-Sheet.png'));
  const kitchenSheet = loadPNG(path.join(homeDir, 'Kitchen-Sheet.png'));
  const tvSheet = loadPNG(path.join(homeDir, 'TV-Sheet.png'));
  const livingRoomSheet = loadPNG(path.join(homeDir, 'LivingRoom-Sheet.png'));

  console.log(`[extract] TilesHouse: ${tilesHouse.width}x${tilesHouse.height}`);
  console.log(`[extract] Miscellaneous: ${miscSheet.width}x${miscSheet.height}`);
  console.log(`[extract] Flowers: ${flowersSheet.width}x${flowersSheet.height}`);
  console.log(`[extract] Cupboard: ${cupboardSheet.width}x${cupboardSheet.height}`);
  console.log(`[extract] Carpet: ${carpetSheet.width}x${carpetSheet.height}`);
  console.log(`[extract] Paintings: ${paintingsSheet.width}x${paintingsSheet.height}`);
  console.log(`[extract] Kitchen: ${kitchenSheet.width}x${kitchenSheet.height}`);
  console.log(`[extract] TV: ${tvSheet.width}x${tvSheet.height}`);
  console.log(`[extract] LivingRoom: ${livingRoomSheet.width}x${livingRoomSheet.height}`);

  const out = createPNG(OUT_W, OUT_H);

  // -------------------------------------------------------
  // Index 0: Floor (light) - from TilesHouse.png
  // Using column 29, row 6 (bright cream/yellow floor tile)
  // Grid position (29,6) = pixel (464,96), fully opaque, avg rgb(255,243,198)
  // -------------------------------------------------------
  {
    const pos = tilePos(0);
    copyRegion(out, pos.x, pos.y, tilesHouse, 29 * 16, 6 * 16, TILE, TILE);
    console.log('[extract] Tile 0 (floor light): TilesHouse grid(29,6)');
  }

  // -------------------------------------------------------
  // Index 1: Floor (dark) - from TilesHouse.png
  // Using column 25, row 6 (slightly darker beige floor tile)
  // Grid position (25,6) = pixel (400,96), fully opaque, avg rgb(242,228,177)
  // -------------------------------------------------------
  {
    const pos = tilePos(1);
    copyRegion(out, pos.x, pos.y, tilesHouse, 25 * 16, 6 * 16, TILE, TILE);
    console.log('[extract] Tile 1 (floor dark): TilesHouse grid(25,6)');
  }

  // -------------------------------------------------------
  // Index 2: Wall (top) - from TilesHouse.png
  // Using column 25, row 0 (wall header/trim - darker beige strip)
  // Grid position (25,0) = pixel (400,0), avg rgb(183,159,110)
  // -------------------------------------------------------
  {
    const pos = tilePos(2);
    copyRegion(out, pos.x, pos.y, tilesHouse, 25 * 16, 0 * 16, TILE, TILE);
    console.log('[extract] Tile 2 (wall top): TilesHouse grid(25,0)');
  }

  // -------------------------------------------------------
  // Index 3: Wall (side) - from TilesHouse.png
  // Using column 25, row 1 (wall body - light cream)
  // Grid position (25,1) = pixel (400,16), avg rgb(246,233,184)
  // -------------------------------------------------------
  {
    const pos = tilePos(3);
    copyRegion(out, pos.x, pos.y, tilesHouse, 25 * 16, 1 * 16, TILE, TILE);
    console.log('[extract] Tile 3 (wall side): TilesHouse grid(25,1)');
  }

  // -------------------------------------------------------
  // Index 4: Desk (top surface) - from Kitchen-Sheet.png
  // Kitchen cabinet at region (128,21, 33x34) - rectangular counter.
  // Use top half (128,21, 33x17) downscaled to 16x16 for desk surface.
  // -------------------------------------------------------
  {
    const pos = tilePos(4);
    downscaleRegion(out, pos.x, pos.y, kitchenSheet, 128, 21, 33, 17);
    console.log('[extract] Tile 4 (desk top): Kitchen cabinet top half, downscaled');
  }

  // -------------------------------------------------------
  // Index 5: Desk (front) - from Kitchen-Sheet.png
  // Bottom half of kitchen cabinet: (128,38, 33x17)
  // -------------------------------------------------------
  {
    const pos = tilePos(5);
    downscaleRegion(out, pos.x, pos.y, kitchenSheet, 128, 38, 33, 17);
    console.log('[extract] Tile 5 (desk front): Kitchen cabinet bottom half, downscaled');
  }

  // -------------------------------------------------------
  // Index 6: Chair - from Miscellaneous-Sheet.png
  // Pink/magenta office chair at region (409,31, 12x21).
  // Center it within the 16x16 tile.
  // -------------------------------------------------------
  {
    const pos = tilePos(6);
    downscaleRegion(out, pos.x, pos.y, miscSheet, 405, 29, 18, 25);
    console.log('[extract] Tile 6 (chair): Miscellaneous chair, downscaled');
  }

  // -------------------------------------------------------
  // Index 7: Plant - from Flowers-Sheet.png
  // Large potted plant at region (22,3, 20x43).
  // Downscale entire plant to 16x16.
  // -------------------------------------------------------
  {
    const pos = tilePos(7);
    downscaleRegion(out, pos.x, pos.y, flowersSheet, 22, 3, 20, 43);
    console.log('[extract] Tile 7 (plant): Flowers large plant, downscaled');
  }

  // -------------------------------------------------------
  // Index 8: Bookshelf - from Cupboard-Sheet.png
  // Bookshelf with colored books at region (270,20, 36x43).
  // Downscale to 16x16.
  // -------------------------------------------------------
  {
    const pos = tilePos(8);
    downscaleRegion(out, pos.x, pos.y, cupboardSheet, 270, 20, 36, 43);
    console.log('[extract] Tile 8 (bookshelf): Cupboard bookshelf, downscaled');
  }

  // -------------------------------------------------------
  // Index 9: Rug - from Carpet-Sheet.png
  // Ornate carpet at region (128,0, 64x64).
  // Take a 16x16 center portion or downscale the whole pattern.
  // Using center 32x32 downscaled to 16x16 for good pattern visibility.
  // -------------------------------------------------------
  {
    const pos = tilePos(9);
    downscaleRegion(out, pos.x, pos.y, carpetSheet, 128 + 16, 16, 32, 32);
    console.log('[extract] Tile 9 (rug): Carpet center portion, downscaled');
  }

  // -------------------------------------------------------
  // Index 10: Whiteboard - from Paintings-Sheet.png
  // Square painting at region (263,7, 18x21).
  // Downscale to 16x16 - wall decoration that serves as whiteboard.
  // -------------------------------------------------------
  {
    const pos = tilePos(10);
    downscaleRegion(out, pos.x, pos.y, paintingsSheet, 263, 7, 18, 21);
    console.log('[extract] Tile 10 (whiteboard): Paintings framed picture, downscaled');
  }

  // -------------------------------------------------------
  // Index 11: Water cooler - from Kitchen-Sheet.png
  // Tall fridge/dispenser at region (704,10, 32x86) - the standing fridge.
  // Downscale to 16x16.
  // -------------------------------------------------------
  {
    const pos = tilePos(11);
    downscaleRegion(out, pos.x, pos.y, kitchenSheet, 704, 10, 32, 86);
    console.log('[extract] Tile 11 (water cooler): Kitchen fridge, downscaled');
  }

  // -------------------------------------------------------
  // Remaining indices 12-31 are unused; leave transparent.
  // -------------------------------------------------------

  // Write output
  const outPath = path.join(outDir, 'office-tiles.png');
  const buffer = PNG.sync.write(out);
  fs.writeFileSync(outPath, buffer);
  console.log(`[extract] Output: ${outPath} (${OUT_W}x${OUT_H})`);
  console.log('[extract] Done.');
}

main().catch((err) => {
  console.error('[extract] Error:', err);
  process.exit(1);
});
