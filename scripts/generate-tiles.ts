/**
 * generate-tiles.ts
 *
 * Generates an office tileset PNG using pngjs.
 * Tile size: 16x16 pixels
 * Sheet: 8 columns x 4 rows = 32 tiles (128 x 64 pixels)
 *
 * Tile index layout:
 *   0: floor light   (#D4C8A8)
 *   1: floor dark    (#C4B898)
 *   2: wall top      (#4A4A5A)
 *   3: wall side     (#3A3A4A)
 *   4: desk top      (#8B7355)
 *   5: desk front    (#6B5335)
 *   6: chair         (#4A6FA5)
 *   7: plant pot     (#2D8B46)
 *   8-31: reserved (transparent)
 *
 * Additional detail tiles for richer visuals:
 *   8:  bookshelf    (#6B4423)
 *   9:  rug          (#B85C38)
 *   10: whiteboard   (#E8E8E8)
 *   11: water cooler (#5BC0EB)
 */

import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

const TILE = 16;
const COLS = 8;
const ROWS = 4;
const SHEET_W = TILE * COLS;  // 128
const SHEET_H = TILE * ROWS;  // 64

function hexToRGBA(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
    255,
  ];
}

function setPixel(png: PNG, x: number, y: number, rgba: [number, number, number, number]) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = rgba[0];
  png.data[idx + 1] = rgba[1];
  png.data[idx + 2] = rgba[2];
  png.data[idx + 3] = rgba[3];
}

function fillRect(
  png: PNG,
  x: number,
  y: number,
  w: number,
  h: number,
  rgba: [number, number, number, number],
) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(png, x + dx, y + dy, rgba);
    }
  }
}

// Draw tile at column/row position
type TileDrawFn = (png: PNG, ox: number, oy: number) => void;

// --- Tile draw functions ---

function drawFloorLight(png: PNG, ox: number, oy: number) {
  const base = hexToRGBA('#D4C8A8');
  const detail = hexToRGBA('#CCC09E');
  fillRect(png, ox, oy, TILE, TILE, base);
  // Subtle texture: small dots
  setPixel(png, ox + 3, oy + 3, detail);
  setPixel(png, ox + 11, oy + 7, detail);
  setPixel(png, ox + 7, oy + 12, detail);
}

function drawFloorDark(png: PNG, ox: number, oy: number) {
  const base = hexToRGBA('#C4B898');
  const detail = hexToRGBA('#BAB08E');
  fillRect(png, ox, oy, TILE, TILE, base);
  setPixel(png, ox + 5, oy + 5, detail);
  setPixel(png, ox + 10, oy + 10, detail);
  setPixel(png, ox + 2, oy + 13, detail);
}

function drawWallTop(png: PNG, ox: number, oy: number) {
  const base = hexToRGBA('#4A4A5A');
  const highlight = hexToRGBA('#5A5A6A');
  const shadow = hexToRGBA('#3A3A4A');
  fillRect(png, ox, oy, TILE, TILE, base);
  // Top edge highlight
  fillRect(png, ox, oy, TILE, 2, highlight);
  // Bottom edge shadow
  fillRect(png, ox, oy + 14, TILE, 2, shadow);
  // Brick pattern
  fillRect(png, ox + 4, oy + 5, 8, 1, shadow);
  fillRect(png, ox + 0, oy + 9, 6, 1, shadow);
  fillRect(png, ox + 8, oy + 9, 8, 1, shadow);
}

function drawWallSide(png: PNG, ox: number, oy: number) {
  const base = hexToRGBA('#3A3A4A');
  const highlight = hexToRGBA('#4A4A5A');
  fillRect(png, ox, oy, TILE, TILE, base);
  // Vertical highlight strip
  fillRect(png, ox, oy, 2, TILE, highlight);
  // Brick lines
  fillRect(png, ox + 4, oy + 4, 1, 8, highlight);
  fillRect(png, ox + 10, oy + 2, 1, 12, highlight);
}

function drawDeskTop(png: PNG, ox: number, oy: number) {
  const base = hexToRGBA('#8B7355');
  const edge = hexToRGBA('#7A6345');
  const surface = hexToRGBA('#9B8365');
  fillRect(png, ox, oy, TILE, TILE, base);
  // Wood grain lines
  fillRect(png, ox + 1, oy + 3, 14, 1, surface);
  fillRect(png, ox + 1, oy + 7, 14, 1, surface);
  fillRect(png, ox + 1, oy + 11, 14, 1, surface);
  // Edge border
  fillRect(png, ox, oy, TILE, 1, edge);
  fillRect(png, ox, oy + 15, TILE, 1, edge);
  fillRect(png, ox, oy, 1, TILE, edge);
  fillRect(png, ox + 15, oy, 1, TILE, edge);
}

function drawDeskFront(png: PNG, ox: number, oy: number) {
  const base = hexToRGBA('#6B5335');
  const panel = hexToRGBA('#7B6345');
  const edge = hexToRGBA('#5B4325');
  fillRect(png, ox, oy, TILE, TILE, base);
  // Panel inset
  fillRect(png, ox + 2, oy + 2, 12, 12, panel);
  // Drawer handle
  fillRect(png, ox + 6, oy + 7, 4, 2, edge);
  // Bottom edge
  fillRect(png, ox, oy + 15, TILE, 1, edge);
}

function drawChair(png: PNG, ox: number, oy: number) {
  const base = hexToRGBA('#4A6FA5');
  const dark = hexToRGBA('#3A5F95');
  const light = hexToRGBA('#5A7FB5');
  // Transparent background first
  // Seat
  fillRect(png, ox + 3, oy + 6, 10, 6, base);
  // Backrest
  fillRect(png, ox + 4, oy + 1, 8, 5, dark);
  fillRect(png, ox + 5, oy + 2, 6, 3, light);
  // Legs
  fillRect(png, ox + 4, oy + 12, 2, 3, hexToRGBA('#333333'));
  fillRect(png, ox + 10, oy + 12, 2, 3, hexToRGBA('#333333'));
  // Wheels
  setPixel(png, ox + 4, oy + 15, hexToRGBA('#222222'));
  setPixel(png, ox + 11, oy + 15, hexToRGBA('#222222'));
}

function drawPlant(png: PNG, ox: number, oy: number) {
  const pot = hexToRGBA('#8B4513');
  const potLight = hexToRGBA('#A0522D');
  const leaf = hexToRGBA('#2D8B46');
  const leafLight = hexToRGBA('#3DA856');
  // Pot
  fillRect(png, ox + 5, oy + 10, 6, 5, pot);
  fillRect(png, ox + 6, oy + 10, 4, 1, potLight);
  // Pot rim
  fillRect(png, ox + 4, oy + 9, 8, 2, pot);
  // Soil
  fillRect(png, ox + 5, oy + 9, 6, 1, hexToRGBA('#3A2A1A'));
  // Leaves
  fillRect(png, ox + 6, oy + 4, 4, 5, leaf);
  fillRect(png, ox + 4, oy + 5, 3, 3, leafLight);
  fillRect(png, ox + 9, oy + 5, 3, 3, leafLight);
  // Top leaves
  fillRect(png, ox + 7, oy + 2, 2, 2, leaf);
  setPixel(png, ox + 5, oy + 3, leafLight);
  setPixel(png, ox + 10, oy + 3, leafLight);
}

function drawBookshelf(png: PNG, ox: number, oy: number) {
  const wood = hexToRGBA('#6B4423');
  const shelf = hexToRGBA('#8B6443');
  fillRect(png, ox, oy, TILE, TILE, wood);
  // Shelves
  fillRect(png, ox, oy + 5, TILE, 1, shelf);
  fillRect(png, ox, oy + 10, TILE, 1, shelf);
  // Books on top shelf
  fillRect(png, ox + 2, oy + 1, 2, 4, hexToRGBA('#E74C3C'));
  fillRect(png, ox + 5, oy + 1, 2, 4, hexToRGBA('#3498DB'));
  fillRect(png, ox + 8, oy + 2, 2, 3, hexToRGBA('#F1C40F'));
  fillRect(png, ox + 11, oy + 1, 3, 4, hexToRGBA('#2ECC71'));
  // Books on bottom shelf
  fillRect(png, ox + 1, oy + 6, 3, 4, hexToRGBA('#9B59B6'));
  fillRect(png, ox + 5, oy + 6, 2, 4, hexToRGBA('#E67E22'));
  fillRect(png, ox + 8, oy + 7, 3, 3, hexToRGBA('#1ABC9C'));
  fillRect(png, ox + 12, oy + 6, 2, 4, hexToRGBA('#E74C3C'));
  // Bottom section
  fillRect(png, ox + 2, oy + 11, 12, 4, shelf);
}

function drawRug(png: PNG, ox: number, oy: number) {
  const base = hexToRGBA('#B85C38');
  const border = hexToRGBA('#A04C28');
  const pattern = hexToRGBA('#D4A574');
  fillRect(png, ox, oy, TILE, TILE, base);
  // Border
  fillRect(png, ox, oy, TILE, 1, border);
  fillRect(png, ox, oy + 15, TILE, 1, border);
  fillRect(png, ox, oy, 1, TILE, border);
  fillRect(png, ox + 15, oy, 1, TILE, border);
  // Diamond pattern center
  setPixel(png, ox + 8, oy + 6, pattern);
  setPixel(png, ox + 7, oy + 7, pattern);
  setPixel(png, ox + 9, oy + 7, pattern);
  setPixel(png, ox + 8, oy + 8, pattern);
  setPixel(png, ox + 6, oy + 8, pattern);
  setPixel(png, ox + 10, oy + 8, pattern);
  setPixel(png, ox + 7, oy + 9, pattern);
  setPixel(png, ox + 9, oy + 9, pattern);
  setPixel(png, ox + 8, oy + 10, pattern);
}

function drawWhiteboard(png: PNG, ox: number, oy: number) {
  const frame = hexToRGBA('#888888');
  const surface = hexToRGBA('#E8E8E8');
  const marker = hexToRGBA('#2563EB');
  const markerR = hexToRGBA('#DC2626');
  fillRect(png, ox, oy, TILE, TILE, frame);
  fillRect(png, ox + 1, oy + 1, 14, 13, surface);
  // Scribbles
  fillRect(png, ox + 3, oy + 3, 8, 1, marker);
  fillRect(png, ox + 3, oy + 5, 6, 1, marker);
  fillRect(png, ox + 3, oy + 7, 10, 1, markerR);
  fillRect(png, ox + 3, oy + 9, 4, 1, marker);
  // Tray at bottom
  fillRect(png, ox + 3, oy + 14, 10, 1, hexToRGBA('#666666'));
}

function drawWaterCooler(png: PNG, ox: number, oy: number) {
  const body = hexToRGBA('#C0C0C0');
  const water = hexToRGBA('#5BC0EB');
  const dark = hexToRGBA('#888888');
  // Body
  fillRect(png, ox + 5, oy + 6, 6, 9, body);
  // Water jug on top
  fillRect(png, ox + 6, oy + 1, 4, 5, water);
  fillRect(png, ox + 7, oy + 0, 2, 1, water);
  // Spout
  fillRect(png, ox + 4, oy + 8, 2, 2, dark);
  // Base
  fillRect(png, ox + 4, oy + 14, 8, 2, dark);
}

// Map from tile index to draw function
const TILE_DRAWS: (TileDrawFn | null)[] = [
  drawFloorLight,   // 0
  drawFloorDark,    // 1
  drawWallTop,      // 2
  drawWallSide,     // 3
  drawDeskTop,      // 4
  drawDeskFront,    // 5
  drawChair,        // 6
  drawPlant,        // 7
  drawBookshelf,    // 8
  drawRug,          // 9
  drawWhiteboard,   // 10
  drawWaterCooler,  // 11
];

function generateTileSheet(): PNG {
  const png = new PNG({ width: SHEET_W, height: SHEET_H });

  // Fill with transparent
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 0;
  }

  for (let idx = 0; idx < TILE_DRAWS.length; idx++) {
    const draw = TILE_DRAWS[idx];
    if (!draw) continue;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const ox = col * TILE;
    const oy = row * TILE;
    draw(png, ox, oy);
  }

  return png;
}

async function main() {
  const outDir = path.resolve(__dirname, '..', 'public', 'assets', 'tiles');
  fs.mkdirSync(outDir, { recursive: true });

  const png = generateTileSheet();
  const outPath = path.join(outDir, 'office-tiles.png');
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outPath, buffer);
  console.log(`[tiles] Generated ${outPath} (${SHEET_W}x${SHEET_H})`);
  console.log('[tiles] Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
