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
  // Index 0: Floor (light) - from TilesHouse.png
  // Grid position (3,4) = pixel (48,64), wood floor, avg rgb(183,166,144)
  // -------------------------------------------------------
  {
    const pos = tilePos(0);
    copyRegion(out, pos.x, pos.y, tilesHouse, 3 * 16, 4 * 16, TILE, TILE);
    console.log('[extract] Tile 0 (floor light): TilesHouse grid(3,4)');
  }

  // -------------------------------------------------------
  // Index 1: Floor (dark) - from TilesHouse.png
  // Grid position (2,8) = pixel (32,128), darker wood, avg rgb(140,93,34)
  // -------------------------------------------------------
  {
    const pos = tilePos(1);
    copyRegion(out, pos.x, pos.y, tilesHouse, 2 * 16, 8 * 16, TILE, TILE);
    console.log('[extract] Tile 1 (floor dark): TilesHouse grid(2,8)');
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

  // -------------------------------------------------------
  // Index 4: Desk (top surface) - from LivingRoom-Sheet.png
  // Region (25,15, 46x16) - table/desk top surface
  // Downscale 46x16 -> 16x16
  // -------------------------------------------------------
  {
    const pos = tilePos(4);
    nearestNeighborScale(livingRoomSheet, 25, 15, 46, 16, TILE, TILE, out, pos.x, pos.y);
    console.log('[extract] Tile 4 (desk top): LivingRoom table surface, downscaled 46x16->16x16');
  }

  // -------------------------------------------------------
  // Index 5: Desk (front) - from Home/Miscellaneous-Sheet.png
  // Region (591,35, 35x21) - drawer/cabinet front
  // Downscale 35x21 -> 16x16
  // -------------------------------------------------------
  {
    const pos = tilePos(5);
    nearestNeighborScale(miscSheetHome, 591, 35, 35, 21, TILE, TILE, out, pos.x, pos.y);
    console.log('[extract] Tile 5 (desk front): Home Misc cabinet front, downscaled 35x21->16x16');
  }

  // -------------------------------------------------------
  // Index 6: Chair - from Kitchen1-Sheet.png
  // Region (138,12, 12x20) - wooden chair
  // Scale 12x20 -> 16x16
  // -------------------------------------------------------
  {
    const pos = tilePos(6);
    nearestNeighborScale(kitchen1Sheet, 138, 12, 12, 20, TILE, TILE, out, pos.x, pos.y);
    console.log('[extract] Tile 6 (chair): Kitchen1 wooden chair, scaled 12x20->16x16');
  }

  // -------------------------------------------------------
  // Index 7: Plant - from Flowers-Sheet.png
  // Region (22,3, 20x43) - large potted plant
  // Downscale 20x43 -> 16x16
  // -------------------------------------------------------
  {
    const pos = tilePos(7);
    nearestNeighborScale(flowersSheet, 22, 3, 20, 43, TILE, TILE, out, pos.x, pos.y);
    console.log('[extract] Tile 7 (plant): Flowers large plant, downscaled 20x43->16x16');
  }

  // -------------------------------------------------------
  // Index 8: Bookshelf - from Cupboard-Sheet.png
  // Region (270,20, 36x43) - bookshelf with colored books
  // Downscale 36x43 -> 16x16
  // -------------------------------------------------------
  {
    const pos = tilePos(8);
    nearestNeighborScale(cupboardSheet, 270, 20, 36, 43, TILE, TILE, out, pos.x, pos.y);
    console.log('[extract] Tile 8 (bookshelf): Cupboard bookshelf, downscaled 36x43->16x16');
  }

  // -------------------------------------------------------
  // Index 9: Rug - from Carpet-Sheet.png
  // Region (128,0, 64x64) - ornate carpet, full pattern
  // Downscale 64x64 -> 16x16
  // -------------------------------------------------------
  {
    const pos = tilePos(9);
    nearestNeighborScale(carpetSheet, 128, 0, 64, 64, TILE, TILE, out, pos.x, pos.y);
    console.log('[extract] Tile 9 (rug): Carpet full pattern, downscaled 64x64->16x16');
  }

  // -------------------------------------------------------
  // Index 10: Monitor - from TV-Sheet.png
  // Region (136,2, 48x27) - wide-screen monitor/TV
  // Downscale 48x27 -> 16x16
  // -------------------------------------------------------
  {
    const pos = tilePos(10);
    nearestNeighborScale(tvSheet, 136, 2, 48, 27, TILE, TILE, out, pos.x, pos.y);
    console.log('[extract] Tile 10 (monitor): TV wide-screen, downscaled 48x27->16x16');
  }

  // -------------------------------------------------------
  // Index 11: Water cooler - from Hospital/Miscellaneous-Sheet.png
  // Region (2234,28, 12x18) - water dispenser
  // Scale 12x18 -> 16x16
  // -------------------------------------------------------
  {
    const pos = tilePos(11);
    nearestNeighborScale(miscSheetHospital, 2234, 28, 12, 18, TILE, TILE, out, pos.x, pos.y);
    console.log('[extract] Tile 11 (water cooler): Hospital Misc dispenser, scaled 12x18->16x16');
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
