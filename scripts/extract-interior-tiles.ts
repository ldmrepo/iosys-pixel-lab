/**
 * extract-interior-tiles.ts
 *
 * Extracts tiles from MetroCity Interior assets and assembles
 * the office-tiles.png tileset (128x64, 8 columns x 4 rows, 16x16 per tile).
 *
 * Tile index mapping (must match office-layout.ts):
 *   0  = floor (light)    <- TilesHouse.png grid(3,4)  wood floor
 *   1  = floor (dark)     <- TilesHouse.png grid(2,8)  darker wood floor
 *   2  = wall (top)       <- TilesHouse.png grid(25,0) wall header/trim
 *   3  = wall (side)      <- TilesHouse.png grid(25,1) wall body
 *   4  = desk (top)       <- LivingRoom-Sheet.png table surface
 *   5  = desk (front)     <- Home/Miscellaneous-Sheet.png drawer/cabinet front
 *   6  = chair            <- Kitchen1-Sheet.png wooden chair
 *   7  = plant            <- Flowers-Sheet.png potted plant
 *   8  = bookshelf        <- Cupboard-Sheet.png bookshelf with books
 *   9  = rug              <- Carpet-Sheet.png ornate carpet
 *   10 = monitor          <- TV-Sheet.png wide-screen monitor
 *   11 = water cooler     <- Hospital/Miscellaneous-Sheet.png dispenser
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
 * Nearest-neighbor scale a region from src into a target area in dst.
 * Preserves pixel art crispness.
 */
function nearestNeighborScale(
  src: PNG,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  dst: PNG,
  dx: number,
  dy: number,
): void {
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const srcX = sx + Math.floor(x * sw / dw);
      const srcY = sy + Math.floor(y * sh / dh);
      if (srcX >= src.width || srcY >= src.height) continue;
      const srcIdx = (srcY * src.width + srcX) * 4;
      const dstIdx = ((dy + y) * dst.width + (dx + x)) * 4;
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
  const hospitalDir = path.join(projectRoot, 'public', 'assets', 'metrocity', 'Interior', 'Hospital');
  const outDir = path.join(projectRoot, 'public', 'assets', 'tiles');

  fs.mkdirSync(outDir, { recursive: true });

  console.log('[extract] Loading MetroCity Interior assets...');

  const tilesHouse = loadPNG(path.join(homeDir, 'TilesHouse.png'));
  const livingRoomSheet = loadPNG(path.join(homeDir, 'LivingRoom-Sheet.png'));
  const miscSheetHome = loadPNG(path.join(homeDir, 'Miscellaneous-Sheet.png'));
  const kitchen1Sheet = loadPNG(path.join(homeDir, 'Kitchen1-Sheet.png'));
  const flowersSheet = loadPNG(path.join(homeDir, 'Flowers-Sheet.png'));
  const cupboardSheet = loadPNG(path.join(homeDir, 'Cupboard-Sheet.png'));
  const carpetSheet = loadPNG(path.join(homeDir, 'Carpet-Sheet.png'));
  const tvSheet = loadPNG(path.join(homeDir, 'TV-Sheet.png'));
  const miscSheetHospital = loadPNG(path.join(hospitalDir, 'Miscellaneous-Sheet.png'));

  console.log(`[extract] TilesHouse: ${tilesHouse.width}x${tilesHouse.height}`);
  console.log(`[extract] LivingRoom: ${livingRoomSheet.width}x${livingRoomSheet.height}`);
  console.log(`[extract] Home Miscellaneous: ${miscSheetHome.width}x${miscSheetHome.height}`);
  console.log(`[extract] Kitchen1: ${kitchen1Sheet.width}x${kitchen1Sheet.height}`);
  console.log(`[extract] Flowers: ${flowersSheet.width}x${flowersSheet.height}`);
  console.log(`[extract] Cupboard: ${cupboardSheet.width}x${cupboardSheet.height}`);
  console.log(`[extract] Carpet: ${carpetSheet.width}x${carpetSheet.height}`);
  console.log(`[extract] TV: ${tvSheet.width}x${tvSheet.height}`);
  console.log(`[extract] Hospital Miscellaneous: ${miscSheetHospital.width}x${miscSheetHospital.height}`);

  const out = createPNG(OUT_W, OUT_H);

  // -------------------------------------------------------
  // ALL tiles are native 16x16 from TilesHouse.png — NO downscaling
  // -------------------------------------------------------

  // Index 0: Floor (light) — warm brown wood plank (horizontal grain)
  // grid(2,2) rgb(144,106,60) — matches demo floor
  {
    const pos = tilePos(0);
    copyRegion(out, pos.x, pos.y, tilesHouse, 2 * 16, 2 * 16, TILE, TILE);
    console.log('[extract] Tile 0 (floor light): TilesHouse grid(2,2)');
  }

  // Index 1: Floor (dark) — slightly darker wood plank
  // grid(3,3) rgb(120,75,18) — subtle contrast with index 0
  {
    const pos = tilePos(1);
    copyRegion(out, pos.x, pos.y, tilesHouse, 3 * 16, 3 * 16, TILE, TILE);
    console.log('[extract] Tile 1 (floor dark): TilesHouse grid(3,3)');
  }

  // -------------------------------------------------------
  // Index 2: Wall (top) - from TilesHouse.png
  // Grid position (25,0) = pixel (400,0), wall header/trim, avg rgb(183,159,110)
  // -------------------------------------------------------
  {
    const pos = tilePos(2);
    copyRegion(out, pos.x, pos.y, tilesHouse, 25 * 16, 0 * 16, TILE, TILE);
    console.log('[extract] Tile 2 (wall top): TilesHouse grid(25,0)');
  }

  // -------------------------------------------------------
  // Index 3: Wall (side) - from TilesHouse.png
  // Grid position (25,1) = pixel (400,16), wall body, avg rgb(246,233,184)
  // -------------------------------------------------------
  {
    const pos = tilePos(3);
    copyRegion(out, pos.x, pos.y, tilesHouse, 25 * 16, 1 * 16, TILE, TILE);
    console.log('[extract] Tile 3 (wall side): TilesHouse grid(25,1)');
  }

  // Index 4: Desk (top) — dark brown wood block (desk surface)
  // grid(7,4) rgb(65,54,37) — solid dark wood, reads as desk/table top-down
  {
    const pos = tilePos(4);
    copyRegion(out, pos.x, pos.y, tilesHouse, 7 * 16, 4 * 16, TILE, TILE);
    console.log('[extract] Tile 4 (desk top): TilesHouse grid(7,4)');
  }

  // Index 5: Desk (front) — dark brown wood with grain
  // grid(8,4) rgb(65,54,37) — matches desk top, slight variation
  {
    const pos = tilePos(5);
    copyRegion(out, pos.x, pos.y, tilesHouse, 8 * 16, 4 * 16, TILE, TILE);
    console.log('[extract] Tile 5 (desk front): TilesHouse grid(8,4)');
  }

  // Index 6: Chair — dark teal/navy block (modern office chair feel)
  // grid(12,5) rgb(12,79,92) — reads as chair seat from top-down
  {
    const pos = tilePos(6);
    copyRegion(out, pos.x, pos.y, tilesHouse, 12 * 16, 5 * 16, TILE, TILE);
    console.log('[extract] Tile 6 (chair): TilesHouse grid(12,5)');
  }

  // Index 7: Plant — green cross/medical (reusing as plant indicator)
  // grid(14,18) rgb(101,141,115) — green tile, reads as vegetation
  {
    const pos = tilePos(7);
    copyRegion(out, pos.x, pos.y, tilesHouse, 14 * 16, 18 * 16, TILE, TILE);
    console.log('[extract] Tile 7 (plant): TilesHouse grid(14,18)');
  }

  // Index 8: Bookshelf — brown shelf piece with dark detail
  // grid(0,16) rgb(125,101,72) — warm brown block, reads as furniture
  {
    const pos = tilePos(8);
    copyRegion(out, pos.x, pos.y, tilesHouse, 0 * 16, 16 * 16, TILE, TILE);
    console.log('[extract] Tile 8 (bookshelf): TilesHouse grid(0,16)');
  }

  // Index 9: Rug — golden/yellow decorative pattern
  // grid(25,8) rgb(210,189,138) — warm golden tile, reads as rug/carpet area
  {
    const pos = tilePos(9);
    copyRegion(out, pos.x, pos.y, tilesHouse, 25 * 16, 8 * 16, TILE, TILE);
    console.log('[extract] Tile 9 (rug): TilesHouse grid(25,8)');
  }

  // Index 10: Whiteboard/monitor — gray metal surface
  // grid(16,4) rgb(60,60,60) — dark gray, reads as screen/board
  {
    const pos = tilePos(10);
    copyRegion(out, pos.x, pos.y, tilesHouse, 16 * 16, 4 * 16, TILE, TILE);
    console.log('[extract] Tile 10 (monitor): TilesHouse grid(16,4)');
  }

  // Index 11: Water cooler — light gray metallic
  // grid(9,9) rgb(140,142,144) — gray tile, reads as appliance
  {
    const pos = tilePos(11);
    copyRegion(out, pos.x, pos.y, tilesHouse, 9 * 16, 9 * 16, TILE, TILE);
    console.log('[extract] Tile 11 (water cooler): TilesHouse grid(9,9)');
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
