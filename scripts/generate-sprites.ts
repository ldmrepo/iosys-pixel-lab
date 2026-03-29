/**
 * generate-sprites.ts
 *
 * Generates pixel-art character spritesheet PNGs using pngjs.
 * Each sheet is 4 columns x 7 rows = 28 frames, each frame 16x24 pixels.
 * Total image: 64 x 168 pixels.
 *
 * Row layout:
 *   0: idle     (2 frames used, cols 0-1)
 *   1: typing   (4 frames used, cols 0-3)
 *   2: reading  (2 frames used, cols 0-1)
 *   3: executing(4 frames used, cols 0-3)
 *   4: waiting  (2 frames used, cols 0-1)
 *   5: done     (2 frames used, cols 0-1)
 *   6: error    (2 frames used, cols 0-1)
 */

import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

// ---------- palette types ----------
interface Palette {
  skin: string;
  hair: string;
  body: string;
  accent: string;
  outline: string;
}

// ---------- colour helpers ----------
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

// ---------- character drawing primitives ----------
// Draw a basic front-facing pixel character within a 16x24 cell at (ox, oy)
function drawCharBase(png: PNG, ox: number, oy: number, p: Palette) {
  const outline = hexToRGBA(p.outline);
  const skin = hexToRGBA(p.skin);
  const hair = hexToRGBA(p.hair);
  const body = hexToRGBA(p.body);

  // Hair (top of head) - rows 1-4
  fillRect(png, ox + 5, oy + 1, 6, 4, hair);
  // Hair outline
  fillRect(png, ox + 4, oy + 2, 1, 3, outline);
  fillRect(png, ox + 11, oy + 2, 1, 3, outline);
  fillRect(png, ox + 5, oy + 0, 6, 1, outline);

  // Face (skin) - rows 5-8
  fillRect(png, ox + 5, oy + 5, 6, 4, skin);
  // Face outline sides
  fillRect(png, ox + 4, oy + 5, 1, 4, outline);
  fillRect(png, ox + 11, oy + 5, 1, 4, outline);

  // Eyes - 2 pixels, dark
  const eyeColor: [number, number, number, number] = [40, 20, 60, 255];
  setPixel(png, ox + 6, oy + 6, eyeColor);
  setPixel(png, ox + 9, oy + 6, eyeColor);

  // Body (torso) - rows 9-16
  fillRect(png, ox + 4, oy + 9, 8, 8, body);
  // Body outline sides
  fillRect(png, ox + 3, oy + 9, 1, 8, outline);
  fillRect(png, ox + 12, oy + 9, 1, 8, outline);
  // Neck outline top
  fillRect(png, ox + 5, oy + 9, 6, 1, outline);

  // Legs - rows 17-22
  fillRect(png, ox + 5, oy + 17, 3, 6, hexToRGBA('#3A3A5A'));
  fillRect(png, ox + 9, oy + 17, 3, 6, hexToRGBA('#3A3A5A'));
  // Shoes
  fillRect(png, ox + 5, oy + 21, 3, 2, outline);
  fillRect(png, ox + 9, oy + 21, 3, 2, outline);
}

// ---------- per-status visual variations ----------

// idle: arms at sides, slight breathing animation (frame 0 normal, frame 1 raised 1px)
function drawIdle(png: PNG, ox: number, oy: number, p: Palette, frame: number) {
  const yOff = frame === 1 ? -1 : 0;
  drawCharBase(png, ox, oy + yOff, p);
}

// typing: hands move on keyboard. frames 0-3 alternate arm positions
function drawTyping(png: PNG, ox: number, oy: number, p: Palette, frame: number) {
  drawCharBase(png, ox, oy, p);
  const accent = hexToRGBA(p.accent);
  const skin = hexToRGBA(p.skin);
  // Arms extended forward (typing on desk)
  if (frame % 2 === 0) {
    // Left hand forward
    fillRect(png, ox + 2, oy + 12, 2, 2, skin);
    fillRect(png, ox + 12, oy + 13, 2, 2, skin);
  } else {
    // Right hand forward
    fillRect(png, ox + 2, oy + 13, 2, 2, skin);
    fillRect(png, ox + 12, oy + 12, 2, 2, skin);
  }
  // Small keyboard/laptop indicator
  if (frame < 2) {
    fillRect(png, ox + 3, oy + 15, 10, 1, accent);
  } else {
    fillRect(png, ox + 3, oy + 14, 10, 1, accent);
  }
}

// reading: holding a document/book
function drawReading(png: PNG, ox: number, oy: number, p: Palette, frame: number) {
  drawCharBase(png, ox, oy, p);
  const accent = hexToRGBA(p.accent);
  // Book in hands
  const bookY = frame === 0 ? 11 : 12;
  fillRect(png, ox + 1, oy + bookY, 3, 4, accent);
  fillRect(png, ox + 1, oy + bookY, 3, 1, hexToRGBA('#FFFFFF'));
}

// executing: running animation with motion lines
function drawExecuting(png: PNG, ox: number, oy: number, p: Palette, frame: number) {
  const xShift = frame % 2 === 0 ? 0 : 1;
  drawCharBase(png, ox + xShift, oy, p);
  const accent = hexToRGBA(p.accent);
  // Motion lines behind the character
  const lineX = ox + xShift - 1;
  if (frame === 0 || frame === 2) {
    setPixel(png, lineX, oy + 10, accent);
    setPixel(png, lineX, oy + 13, accent);
    setPixel(png, lineX, oy + 16, accent);
  } else {
    setPixel(png, lineX, oy + 11, accent);
    setPixel(png, lineX, oy + 14, accent);
  }
  // Gear/cog indicator on body
  setPixel(png, ox + xShift + 7, oy + 11, accent);
  setPixel(png, ox + xShift + 8, oy + 12, accent);
}

// waiting: tapping foot, slight sway
function drawWaiting(png: PNG, ox: number, oy: number, p: Palette, frame: number) {
  drawCharBase(png, ox, oy, p);
  const accent = hexToRGBA(p.accent);
  // Thought dots above head
  if (frame === 0) {
    setPixel(png, ox + 6, oy - 1 < 0 ? 0 : oy, accent);
    setPixel(png, ox + 8, oy - 1 < 0 ? 0 : oy, accent);
    setPixel(png, ox + 10, oy - 1 < 0 ? 0 : oy, accent);
  } else {
    setPixel(png, ox + 7, oy - 1 < 0 ? 0 : oy, accent);
    setPixel(png, ox + 9, oy - 1 < 0 ? 0 : oy, accent);
  }
}

// done: checkmark pose, arms up
function drawDone(png: PNG, ox: number, oy: number, p: Palette, frame: number) {
  drawCharBase(png, ox, oy, p);
  const accent = hexToRGBA(p.accent);
  const green: [number, number, number, number] = [34, 197, 94, 255];
  // Checkmark above head
  if (frame === 0) {
    setPixel(png, ox + 6, oy + 0, green);
    setPixel(png, ox + 7, oy + 1, green);
    setPixel(png, ox + 8, oy + 0, green);
    setPixel(png, ox + 9, oy - 1 < 0 ? 0 : oy, green);
  }
  // Arms raised
  fillRect(png, ox + 2, oy + 9, 2, 2, hexToRGBA(p.skin));
  fillRect(png, ox + 12, oy + 9, 2, 2, hexToRGBA(p.skin));
  // Star sparkle
  if (frame === 1) {
    setPixel(png, ox + 14, oy + 7, accent);
    setPixel(png, ox + 1, oy + 7, accent);
  }
}

// error: alarmed pose, exclamation mark
function drawError(png: PNG, ox: number, oy: number, p: Palette, frame: number) {
  drawCharBase(png, ox, oy, p);
  const red: [number, number, number, number] = [239, 68, 68, 255];
  // Exclamation mark above head
  if (frame === 0) {
    fillRect(png, ox + 7, oy + 0, 2, 1, red);
  } else {
    fillRect(png, ox + 7, oy + 0, 2, 1, red);
    setPixel(png, ox + 8, oy + 1, red);
  }
  // Red tint on outline
  setPixel(png, ox + 4, oy + 5, red);
  setPixel(png, ox + 11, oy + 5, red);
}

// ---------- sheet layout ----------
const FRAME_W = 16;
const FRAME_H = 24;
const COLS = 4;
const ROWS = 7;
const SHEET_W = FRAME_W * COLS; // 64
const SHEET_H = FRAME_H * ROWS; // 168

type DrawFn = (png: PNG, ox: number, oy: number, p: Palette, frame: number) => void;

const ROW_DRAW: { draw: DrawFn; frameCount: number }[] = [
  { draw: drawIdle, frameCount: 2 },
  { draw: drawTyping, frameCount: 4 },
  { draw: drawReading, frameCount: 2 },
  { draw: drawExecuting, frameCount: 4 },
  { draw: drawWaiting, frameCount: 2 },
  { draw: drawDone, frameCount: 2 },
  { draw: drawError, frameCount: 2 },
];

// ---------- character palettes ----------
interface CharacterDef {
  id: string;
  palette: Palette;
}

const CHARACTERS: CharacterDef[] = [
  {
    id: 'claude',
    palette: {
      skin: '#FFD5B8',
      hair: '#8B5CF6',
      body: '#A78BFA',
      accent: '#F97316',
      outline: '#4C1D95',
    },
  },
  {
    id: 'codex',
    palette: {
      skin: '#FFD5B8',
      hair: '#10B981',
      body: '#34D399',
      accent: '#F59E0B',
      outline: '#064E3B',
    },
  },
  {
    id: 'gemini',
    palette: {
      skin: '#FFD5B8',
      hair: '#3B82F6',
      body: '#60A5FA',
      accent: '#EF4444',
      outline: '#1E3A5F',
    },
  },
];

function generateSpriteSheet(char: CharacterDef): PNG {
  const png = new PNG({ width: SHEET_W, height: SHEET_H });

  // Fill with transparent
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;
    png.data[i + 1] = 0;
    png.data[i + 2] = 0;
    png.data[i + 3] = 0;
  }

  for (let row = 0; row < ROWS; row++) {
    const { draw, frameCount } = ROW_DRAW[row];
    for (let col = 0; col < frameCount; col++) {
      const ox = col * FRAME_W;
      const oy = row * FRAME_H;
      draw(png, ox, oy, char.palette, col);
    }
  }

  return png;
}

// ---------- main ----------
async function main() {
  const outDir = path.resolve(__dirname, '..', 'public', 'assets', 'sprites');
  fs.mkdirSync(outDir, { recursive: true });

  for (const char of CHARACTERS) {
    const png = generateSpriteSheet(char);
    const outPath = path.join(outDir, `${char.id}.png`);
    const buffer = PNG.sync.write(png);
    fs.writeFileSync(outPath, buffer);
    console.log(`[sprites] Generated ${outPath} (${SHEET_W}x${SHEET_H})`);
  }

  console.log('[sprites] Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
