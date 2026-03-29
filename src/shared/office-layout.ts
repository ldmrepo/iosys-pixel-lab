import type { OfficeLayout, TileInfo, Seat, FurnitureObject } from './types';

/**
 * Office layout: 20 columns x 15 rows, tile size 16px
 *
 * Dual-layer architecture:
 *   Layer 1 — tiles[][]: floor/wall grid only (no furniture in tiles)
 *   Layer 2 — furniture[]: all desks, chairs, decorations as FurnitureObject
 *
 * Floor tile spriteIndex:
 *   0 = floor light,  1 = floor dark  (checkerboard pattern)
 *   2 = wall top,     3 = wall side
 *
 * Layout visual (20x15):
 *   Row  0: wall-top all across
 *   Row  1: wall-side | interior floor | wall-side
 *   Row  2: desks (top row)
 *   Row  3: chairs facing up (top row seats)
 *   Row  4: open floor
 *   Row  5-9: rug area / lounge
 *   Row 10: open floor
 *   Row 11: chairs facing down (bottom row seats)
 *   Row 12: desks (bottom row)
 *   Row 13: wall-side | interior floor | wall-side
 *   Row 14: wall-top all across (bottom wall)
 */

// ─── Floor / Wall Tile Helpers ───

const fL = (): TileInfo => ({ type: 'floor', walkable: true, spriteIndex: 0 });
const fD = (): TileInfo => ({ type: 'floor', walkable: true, spriteIndex: 1 });
const wT = (): TileInfo => ({ type: 'wall', walkable: false, spriteIndex: 2 });
const wS = (): TileInfo => ({ type: 'wall', walkable: false, spriteIndex: 3 });

// Checkerboard helper: light on even sum, dark on odd sum
const f = (x: number, y: number): TileInfo => ((x + y) % 2 === 0 ? fL() : fD());

// Build 20x15 grid — floor and wall ONLY (furniture is in the furniture[] array)
const tiles: TileInfo[][] = [];
for (let y = 0; y < 15; y++) {
  const row: TileInfo[] = [];
  for (let x = 0; x < 20; x++) {
    if (y === 0 || y === 14) {
      // Top and bottom wall rows
      row.push(wT());
    } else if (x === 0 || x === 19) {
      // Left and right wall columns
      row.push(wS());
    } else {
      // Interior floor — checkerboard
      row.push(f(x, y));
    }
  }
  tiles.push(row);
}

// ─── Furniture Objects ───
// Each object references a sprite sheet registered in asset-manifest.ts furnitureSheets
// and provides the exact pixel region (sx, sy, sw, sh) within that sheet.

const furniture: FurnitureObject[] = [

  // ════════════════════════════════════════════
  // DESKS — Top row (y=2), 4 desks
  // Each desk: 2 tiles wide, 1 tile tall footprint
  // Sprite: Kitchen1-Sheet table-top (seen from above) — 64x48 px
  // ════════════════════════════════════════════

  {
    id: 'desk-top-1',
    type: 'desk',
    tileX: 3, tileY: 2,
    widthTiles: 2, heightTiles: 1,
    sprite: { sheetId: 'kitchen1', region: { sx: 496, sy: 0, sw: 64, sh: 48 } },
    drawOffsetY: -16,
  },
  {
    id: 'desk-top-2',
    type: 'desk',
    tileX: 7, tileY: 2,
    widthTiles: 2, heightTiles: 1,
    sprite: { sheetId: 'kitchen1', region: { sx: 496, sy: 0, sw: 64, sh: 48 } },
    drawOffsetY: -16,
  },
  {
    id: 'desk-top-3',
    type: 'desk',
    tileX: 11, tileY: 2,
    widthTiles: 2, heightTiles: 1,
    sprite: { sheetId: 'kitchen1', region: { sx: 496, sy: 0, sw: 64, sh: 48 } },
    drawOffsetY: -16,
  },
  {
    id: 'desk-top-4',
    type: 'desk',
    tileX: 15, tileY: 2,
    widthTiles: 2, heightTiles: 1,
    sprite: { sheetId: 'kitchen1', region: { sx: 496, sy: 0, sw: 64, sh: 48 } },
    drawOffsetY: -16,
  },

  // ════════════════════════════════════════════
  // DESKS — Bottom row (y=12), 4 desks
  // Sprite: Kitchen1-Sheet table-front (front-facing) — 64x48 px
  // ════════════════════════════════════════════

  {
    id: 'desk-bot-1',
    type: 'desk',
    tileX: 3, tileY: 12,
    widthTiles: 2, heightTiles: 1,
    sprite: { sheetId: 'kitchen1', region: { sx: 400, sy: 0, sw: 64, sh: 48 } },
    drawOffsetY: -16,
  },
  {
    id: 'desk-bot-2',
    type: 'desk',
    tileX: 7, tileY: 12,
    widthTiles: 2, heightTiles: 1,
    sprite: { sheetId: 'kitchen1', region: { sx: 400, sy: 0, sw: 64, sh: 48 } },
    drawOffsetY: -16,
  },
  {
    id: 'desk-bot-3',
    type: 'desk',
    tileX: 11, tileY: 12,
    widthTiles: 2, heightTiles: 1,
    sprite: { sheetId: 'kitchen1', region: { sx: 400, sy: 0, sw: 64, sh: 48 } },
    drawOffsetY: -16,
  },
  {
    id: 'desk-bot-4',
    type: 'desk',
    tileX: 15, tileY: 12,
    widthTiles: 2, heightTiles: 1,
    sprite: { sheetId: 'kitchen1', region: { sx: 400, sy: 0, sw: 64, sh: 48 } },
    drawOffsetY: -16,
  },

  // ════════════════════════════════════════════
  // CHAIRS — Top row (y=3), facing UP toward desks at y=2
  // 8 chairs, 2 per desk (seatId = seat-1 .. seat-8)
  // Sprite: Kitchen1-Sheet chair-up — 32x32 px
  // ════════════════════════════════════════════

  {
    id: 'chair-1',
    type: 'chair',
    tileX: 3, tileY: 3,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 128, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-1',
    drawOffsetY: -8,
  },
  {
    id: 'chair-2',
    type: 'chair',
    tileX: 4, tileY: 3,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 128, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-2',
    drawOffsetY: -8,
  },
  {
    id: 'chair-3',
    type: 'chair',
    tileX: 7, tileY: 3,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 128, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-3',
    drawOffsetY: -8,
  },
  {
    id: 'chair-4',
    type: 'chair',
    tileX: 8, tileY: 3,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 128, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-4',
    drawOffsetY: -8,
  },
  {
    id: 'chair-5',
    type: 'chair',
    tileX: 11, tileY: 3,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 128, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-5',
    drawOffsetY: -8,
  },
  {
    id: 'chair-6',
    type: 'chair',
    tileX: 12, tileY: 3,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 128, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-6',
    drawOffsetY: -8,
  },
  {
    id: 'chair-7',
    type: 'chair',
    tileX: 15, tileY: 3,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 128, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-7',
    drawOffsetY: -8,
  },
  {
    id: 'chair-8',
    type: 'chair',
    tileX: 16, tileY: 3,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 128, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-8',
    drawOffsetY: -8,
  },

  // ════════════════════════════════════════════
  // CHAIRS — Bottom row (y=11), facing DOWN toward desks at y=12
  // 8 chairs, 2 per desk (seatId = seat-9 .. seat-16)
  // Sprite: Kitchen1-Sheet chair-down — 32x32 px
  // ════════════════════════════════════════════

  {
    id: 'chair-9',
    type: 'chair',
    tileX: 3, tileY: 11,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 32, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-9',
    drawOffsetY: -8,
  },
  {
    id: 'chair-10',
    type: 'chair',
    tileX: 4, tileY: 11,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 32, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-10',
    drawOffsetY: -8,
  },
  {
    id: 'chair-11',
    type: 'chair',
    tileX: 7, tileY: 11,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 32, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-11',
    drawOffsetY: -8,
  },
  {
    id: 'chair-12',
    type: 'chair',
    tileX: 8, tileY: 11,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 32, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-12',
    drawOffsetY: -8,
  },
  {
    id: 'chair-13',
    type: 'chair',
    tileX: 11, tileY: 11,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 32, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-13',
    drawOffsetY: -8,
  },
  {
    id: 'chair-14',
    type: 'chair',
    tileX: 12, tileY: 11,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 32, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-14',
    drawOffsetY: -8,
  },
  {
    id: 'chair-15',
    type: 'chair',
    tileX: 15, tileY: 11,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 32, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-15',
    drawOffsetY: -8,
  },
  {
    id: 'chair-16',
    type: 'chair',
    tileX: 16, tileY: 11,
    widthTiles: 1, heightTiles: 1,
    walkableMask: [true],
    sprite: { sheetId: 'kitchen1', region: { sx: 32, sy: 0, sw: 32, sh: 32 } },
    seatId: 'seat-16',
    drawOffsetY: -8,
  },

  // ════════════════════════════════════════════
  // CARPET — Center lounge area (4x4 tiles)
  // Ornate carpet from Carpet-Sheet frame 2 (64x64 px)
  // Placed on layer='wall' so it renders below characters
  // ════════════════════════════════════════════

  {
    id: 'carpet-center',
    type: 'carpet',
    tileX: 8, tileY: 6,
    widthTiles: 4, heightTiles: 4,
    walkableMask: [
      true, true, true, true,
      true, true, true, true,
      true, true, true, true,
      true, true, true, true,
    ],
    sprite: { sheetId: 'carpet', region: { sx: 128, sy: 0, sw: 64, sh: 64 } },
    layer: 'wall',
  },

  // ════════════════════════════════════════════
  // SOFAS — Lounge area near center carpet
  // LivingRoom1-Sheet: blue sofa front view (4x2 tiles = 64x32 px)
  // ════════════════════════════════════════════

  {
    id: 'sofa-1',
    type: 'sofa',
    tileX: 8, tileY: 5,
    widthTiles: 4, heightTiles: 1,
    sprite: { sheetId: 'livingRoom1', region: { sx: 112, sy: 16, sw: 64, sh: 32 } },
    drawOffsetY: -8,
  },
  {
    id: 'sofa-2',
    type: 'sofa',
    tileX: 8, tileY: 10,
    widthTiles: 4, heightTiles: 1,
    sprite: { sheetId: 'livingRoom1', region: { sx: 16, sy: 16, sw: 64, sh: 32 } },
    drawOffsetY: -8,
  },

  // ════════════════════════════════════════════
  // PLANTS — Corner decorations
  // Flowers-Sheet: large potted plant (2x3 tiles = 32x48 px)
  // ════════════════════════════════════════════

  {
    id: 'plant-1',
    type: 'plant',
    tileX: 1, tileY: 11,
    widthTiles: 1, heightTiles: 1,
    sprite: { sheetId: 'flowers', region: { sx: 16, sy: 0, sw: 32, sh: 48 } },
    drawOffsetY: -32,
  },
  {
    id: 'plant-2',
    type: 'plant',
    tileX: 18, tileY: 3,
    widthTiles: 1, heightTiles: 1,
    sprite: { sheetId: 'flowers', region: { sx: 16, sy: 0, sw: 32, sh: 48 } },
    drawOffsetY: -32,
  },

  // ════════════════════════════════════════════
  // BOOKSHELVES — Bottom wall area (row 13)
  // Cupboard-Sheet: bookshelf with colored books (2x3 tiles = 32x48 px)
  // ════════════════════════════════════════════

  {
    id: 'bookshelf-1',
    type: 'bookshelf',
    tileX: 1, tileY: 13,
    widthTiles: 2, heightTiles: 1,
    sprite: { sheetId: 'cupboard', region: { sx: 224, sy: 16, sw: 32, sh: 48 } },
    drawOffsetY: -32,
  },
  {
    id: 'bookshelf-2',
    type: 'bookshelf',
    tileX: 17, tileY: 13,
    widthTiles: 2, heightTiles: 1,
    sprite: { sheetId: 'cupboard', region: { sx: 256, sy: 16, sw: 32, sh: 48 } },
    drawOffsetY: -32,
  },

  // ════════════════════════════════════════════
  // PAINTINGS — Top wall decorations (row 1, layer='wall')
  // Paintings-Sheet: 32x32 px frames
  // ════════════════════════════════════════════

  {
    id: 'painting-1',
    type: 'painting',
    tileX: 2, tileY: 1,
    widthTiles: 1, heightTiles: 1,
    sprite: { sheetId: 'paintings', region: { sx: 0, sy: 0, sw: 32, sh: 32 } },
    layer: 'wall',
  },
  {
    id: 'painting-2',
    type: 'painting',
    tileX: 17, tileY: 1,
    widthTiles: 1, heightTiles: 1,
    sprite: { sheetId: 'paintings', region: { sx: 64, sy: 0, sw: 32, sh: 32 } },
    layer: 'wall',
  },

  // ════════════════════════════════════════════
  // WATER COOLER — Right side (row 7)
  // Hospital Miscellaneous-Sheet: tall blue appliance (2x4 tiles = 32x64 px)
  // ════════════════════════════════════════════

  {
    id: 'water-cooler',
    type: 'water-cooler',
    tileX: 18, tileY: 7,
    widthTiles: 1, heightTiles: 2,
    sprite: { sheetId: 'miscHospital', region: { sx: 816, sy: 0, sw: 32, sh: 64 } },
    drawOffsetY: -16,
  },

  // ════════════════════════════════════════════
  // MONITORS — On desks (purely decorative, on top of desk sprites)
  // TV-Sheet: small monitor/TV front view (2x2 tiles = 32x32 px)
  // Placed at desk positions, layer='object' so they draw above desks
  // ════════════════════════════════════════════

  {
    id: 'monitor-top-1',
    type: 'monitor',
    tileX: 3, tileY: 2,
    widthTiles: 2, heightTiles: 1,
    walkableMask: [false, false],
    sprite: { sheetId: 'tv', region: { sx: 16, sy: 0, sw: 32, sh: 32 } },
    drawOffsetY: -12,
    sortY: -1,
  },
  {
    id: 'monitor-top-2',
    type: 'monitor',
    tileX: 7, tileY: 2,
    widthTiles: 2, heightTiles: 1,
    walkableMask: [false, false],
    sprite: { sheetId: 'tv', region: { sx: 16, sy: 0, sw: 32, sh: 32 } },
    drawOffsetY: -12,
    sortY: -1,
  },
  {
    id: 'monitor-top-3',
    type: 'monitor',
    tileX: 11, tileY: 2,
    widthTiles: 2, heightTiles: 1,
    walkableMask: [false, false],
    sprite: { sheetId: 'tv', region: { sx: 16, sy: 0, sw: 32, sh: 32 } },
    drawOffsetY: -12,
    sortY: -1,
  },
  {
    id: 'monitor-top-4',
    type: 'monitor',
    tileX: 15, tileY: 2,
    widthTiles: 2, heightTiles: 1,
    walkableMask: [false, false],
    sprite: { sheetId: 'tv', region: { sx: 16, sy: 0, sw: 32, sh: 32 } },
    drawOffsetY: -12,
    sortY: -1,
  },
  {
    id: 'monitor-bot-1',
    type: 'monitor',
    tileX: 3, tileY: 12,
    widthTiles: 2, heightTiles: 1,
    walkableMask: [false, false],
    sprite: { sheetId: 'tv', region: { sx: 16, sy: 0, sw: 32, sh: 32 } },
    drawOffsetY: -12,
    sortY: -1,
  },
  {
    id: 'monitor-bot-2',
    type: 'monitor',
    tileX: 7, tileY: 12,
    widthTiles: 2, heightTiles: 1,
    walkableMask: [false, false],
    sprite: { sheetId: 'tv', region: { sx: 16, sy: 0, sw: 32, sh: 32 } },
    drawOffsetY: -12,
    sortY: -1,
  },
  {
    id: 'monitor-bot-3',
    type: 'monitor',
    tileX: 11, tileY: 12,
    widthTiles: 2, heightTiles: 1,
    walkableMask: [false, false],
    sprite: { sheetId: 'tv', region: { sx: 16, sy: 0, sw: 32, sh: 32 } },
    drawOffsetY: -12,
    sortY: -1,
  },
  {
    id: 'monitor-bot-4',
    type: 'monitor',
    tileX: 15, tileY: 12,
    widthTiles: 2, heightTiles: 1,
    walkableMask: [false, false],
    sprite: { sheetId: 'tv', region: { sx: 16, sy: 0, sw: 32, sh: 32 } },
    drawOffsetY: -12,
    sortY: -1,
  },
];

// ─── Seats — Derived from chair furniture with seatId ───

const seats: Seat[] = [
  // Top row — facing up (chair at y=3, desk at y=2)
  { id: 'seat-1',  tileX: 3,  tileY: 3,  deskTileX: 3,  deskTileY: 2, facing: 'up' },
  { id: 'seat-2',  tileX: 4,  tileY: 3,  deskTileX: 4,  deskTileY: 2, facing: 'up' },
  { id: 'seat-3',  tileX: 7,  tileY: 3,  deskTileX: 7,  deskTileY: 2, facing: 'up' },
  { id: 'seat-4',  tileX: 8,  tileY: 3,  deskTileX: 8,  deskTileY: 2, facing: 'up' },
  { id: 'seat-5',  tileX: 11, tileY: 3,  deskTileX: 11, deskTileY: 2, facing: 'up' },
  { id: 'seat-6',  tileX: 12, tileY: 3,  deskTileX: 12, deskTileY: 2, facing: 'up' },
  { id: 'seat-7',  tileX: 15, tileY: 3,  deskTileX: 15, deskTileY: 2, facing: 'up' },
  { id: 'seat-8',  tileX: 16, tileY: 3,  deskTileX: 16, deskTileY: 2, facing: 'up' },
  // Bottom row — facing down (chair at y=11, desk at y=12)
  { id: 'seat-9',  tileX: 3,  tileY: 11, deskTileX: 3,  deskTileY: 12, facing: 'down' },
  { id: 'seat-10', tileX: 4,  tileY: 11, deskTileX: 4,  deskTileY: 12, facing: 'down' },
  { id: 'seat-11', tileX: 7,  tileY: 11, deskTileX: 7,  deskTileY: 12, facing: 'down' },
  { id: 'seat-12', tileX: 8,  tileY: 11, deskTileX: 8,  deskTileY: 12, facing: 'down' },
  { id: 'seat-13', tileX: 11, tileY: 11, deskTileX: 11, deskTileY: 12, facing: 'down' },
  { id: 'seat-14', tileX: 12, tileY: 11, deskTileX: 12, deskTileY: 12, facing: 'down' },
  { id: 'seat-15', tileX: 15, tileY: 11, deskTileX: 15, deskTileY: 12, facing: 'down' },
  { id: 'seat-16', tileX: 16, tileY: 11, deskTileX: 16, deskTileY: 12, facing: 'down' },
];

// ─── Export ───

export const officeLayout: OfficeLayout = {
  width: 20,
  height: 15,
  tileSize: 16,
  tiles,
  furniture,
  seats,
};

export default officeLayout;
