import type { OfficeLayout, TileInfo, Seat, FurnitureObject } from './types';

/**
 * Office layout: 20 cols × 15 rows, 16px/tile
 *
 * Tile Types:
 *   type:'wall'  — non-walkable boundary (rendered dark)
 *   type:'floor' — walkable, spriteIndex encodes zone:
 *     0 = corridor (light oak)
 *     1 = work zone (medium brown)
 *     2 = lounge   (warm mid-tone)
 *
 * Furniture is a separate layer on top of tiles.
 */

// ─── Tile helpers ───────────────────────────────────────────
const wall  = (): TileInfo => ({ type: 'wall',  walkable: false, spriteIndex: 3 });
const corr  = (): TileInfo => ({ type: 'floor', walkable: true,  spriteIndex: 0 }); // corridor
const work  = (): TileInfo => ({ type: 'floor', walkable: true,  spriteIndex: 1 }); // work zone
const lounge= (): TileInfo => ({ type: 'floor', walkable: true,  spriteIndex: 2 }); // lounge

// ─── 20×15 Tile Grid ────────────────────────────────────────
//
// Y layout:
//  0       = top wall
//  1-2     = corridor / display area
//  3-7     = work zone (both pods)
//  8-12    = lounge
//  13      = corridor (south)
//  14      = bottom wall
//
// X layout:
//  0,19    = side wall strip
//  1-18    = interior

const tiles: TileInfo[][] = [];
for (let y = 0; y < 15; y++) {
  const row: TileInfo[] = [];
  for (let x = 0; x < 20; x++) {
    if (y === 0 || y === 14 || x === 0 || x === 19) {
      row.push(wall());
    } else if (y === 1 || y === 2 || y === 13) {
      row.push(corr());
    } else if (y >= 3 && y <= 7) {
      row.push(work());
    } else {
      // y 8-12
      row.push(lounge());
    }
  }
  tiles.push(row);
}

// ─── Sprite Constants ────────────────────────────────────────
// All coordinates verified against actual sprite sheet images.
const SPRITES = {
  // Desks — Kitchen1-Sheet (chairs row 0, desks/counters further right)
  DESK_TOP:     { sheetId: 'kitchen1', region: { sx: 256, sy: 0, sw: 80, sh: 48 } },
  DESK_BOT:     { sheetId: 'kitchen1', region: { sx: 336, sy: 0, sw: 80, sh: 48 } },
  // Chairs — Kitchen1: 4 small chairs at left, ~16-32px each
  CHAIR_UP:     { sheetId: 'kitchen1', region: { sx: 0,  sy: 0, sw: 16, sh: 32 } },
  CHAIR_LEFT:   { sheetId: 'kitchen1', region: { sx: 16, sy: 0, sw: 16, sh: 32 } },
  CHAIR_DOWN:   { sheetId: 'kitchen1', region: { sx: 32, sy: 0, sw: 16, sh: 32 } },
  CHAIR_RIGHT:  { sheetId: 'kitchen1', region: { sx: 48, sy: 0, sw: 16, sh: 32 } },
  // Monitor / TV
  MONITOR:      { sheetId: 'tv',       region: { sx: 16,  sy: 0, sw: 32, sh: 32 } },
  // Sofa — LivingRoom1: first row is blue sofa-front (48×16), col 0=full front, col 1=plain front
  SOFA_FRONT:   { sheetId: 'livingRoom1', region: { sx: 0,   sy: 0, sw: 80, sh: 48 } },
  SOFA_BACK:    { sheetId: 'livingRoom1', region: { sx: 0,   sy: 96, sw: 80, sh: 48 } },
  // Carpet
  CARPET:       { sheetId: 'carpet',   region: { sx: 128, sy: 0, sw: 64, sh: 64 } },
  // Plants — Flowers-Sheet: first plant at sx=16
  PLANT:        { sheetId: 'flowers',  region: { sx: 16, sy: 0, sw: 32, sh: 48 } },
  // Bookshelf — Cupboard: wider units around sx=224
  BOOKSHELF_L:  { sheetId: 'cupboard', region: { sx: 224, sy: 16, sw: 32, sh: 48 } },
  BOOKSHELF_R:  { sheetId: 'cupboard', region: { sx: 256, sy: 16, sw: 32, sh: 48 } },
  // Paintings
  PAINTING_1:   { sheetId: 'paintings', region: { sx:  0, sy: 0, sw: 32, sh: 32 } },
  PAINTING_2:   { sheetId: 'paintings', region: { sx: 64, sy: 0, sw: 32, sh: 32 } },
  // Water cooler — Hospital misc
  WATER_COOLER: { sheetId: 'miscHospital', region: { sx: 816, sy: 0, sw: 32, sh: 64 } },
  // Lamps — Lights-Sheet: white lamp at 0, brown at 64
  LAMP:         { sheetId: 'lights', region: { sx:  0, sy: 0, sw: 32, sh: 32 } },
  LAMP_BROWN:   { sheetId: 'lights', region: { sx: 64, sy: 0, sw: 32, sh: 32 } },
  // Windows — Windows-Sheet: horizontal strip, 48px wide each, wood at 0, blue-tint at 96
  WINDOW_WOOD:  { sheetId: 'windows', region: { sx:  0, sy: 0, sw: 48, sh: 48 } },
  WINDOW_BLUE:  { sheetId: 'windows', region: { sx: 96, sy: 0, sw: 48, sh: 48 } },
  // Door — Doors-Sheet: glass-pane door is index 2 (sx≈160), solid wood sx≈240
  DOOR:         { sheetId: 'doors', region: { sx: 160, sy: 0, sw: 64, sh: 80 } },

  // ── Server Racks (Beds1-Sheet 256x320, 4x5 grid at 64x64) ──
  SERVER_RACK_PURPLE:  { sheetId: 'beds1', region: { sx:   0, sy:   0, sw: 64, sh: 64 } },
  SERVER_RACK_BLUE:    { sheetId: 'beds1', region: { sx:  64, sy:   0, sw: 64, sh: 64 } },
  SERVER_RACK_CYAN:    { sheetId: 'beds1', region: { sx: 128, sy:   0, sw: 64, sh: 64 } },
  SERVER_RACK_RED:     { sheetId: 'beds1', region: { sx: 192, sy:   0, sw: 64, sh: 64 } },
  SERVER_RACK_BLUE_N:  { sheetId: 'beds1', region: { sx:   0, sy:  64, sw: 64, sh: 64 } },
  SERVER_RACK_BLUE_N2: { sheetId: 'beds1', region: { sx:  64, sy:  64, sw: 64, sh: 64 } },
  SERVER_RACK_CYAN_N:  { sheetId: 'beds1', region: { sx: 128, sy:  64, sw: 64, sh: 64 } },
  SERVER_RACK_RED_N:   { sheetId: 'beds1', region: { sx: 192, sy:  64, sw: 64, sh: 64 } },
  SERVER_RACK_GREEN:   { sheetId: 'beds1', region: { sx:   0, sy: 128, sw: 64, sh: 64 } },
  SERVER_RACK_GREEN2:  { sheetId: 'beds1', region: { sx:  64, sy: 128, sw: 64, sh: 64 } },
  SERVER_RACK_GREEN_C: { sheetId: 'beds1', region: { sx: 128, sy: 128, sw: 64, sh: 64 } },
  SERVER_RACK_GREEN_R: { sheetId: 'beds1', region: { sx: 192, sy: 128, sw: 64, sh: 64 } },
  SERVER_RACK_MULTI_0: { sheetId: 'beds1', region: { sx:   0, sy: 192, sw: 64, sh: 64 } },
  SERVER_RACK_MULTI_1: { sheetId: 'beds1', region: { sx:  64, sy: 192, sw: 64, sh: 64 } },
  SERVER_RACK_MULTI_2: { sheetId: 'beds1', region: { sx: 128, sy: 192, sw: 64, sh: 64 } },
  SERVER_RACK_MULTI_3: { sheetId: 'beds1', region: { sx: 192, sy: 192, sw: 64, sh: 64 } },
  SERVER_RACK_DARK_0:  { sheetId: 'beds1', region: { sx:   0, sy: 256, sw: 64, sh: 64 } },
  SERVER_RACK_DARK_1:  { sheetId: 'beds1', region: { sx:  64, sy: 256, sw: 64, sh: 64 } },
  SERVER_RACK_DARK_2:  { sheetId: 'beds1', region: { sx: 128, sy: 256, sw: 64, sh: 64 } },
  SERVER_RACK_DARK_3:  { sheetId: 'beds1', region: { sx: 192, sy: 256, sw: 64, sh: 64 } },

  // ── Modern Chimneys (Chimney-Sheet 384x48, 8 sprites at 48x48) ──
  CHIMNEY_0: { sheetId: 'chimney', region: { sx:   0, sy: 0, sw: 48, sh: 48 } },
  CHIMNEY_1: { sheetId: 'chimney', region: { sx:  48, sy: 0, sw: 48, sh: 48 } },
  CHIMNEY_2: { sheetId: 'chimney', region: { sx:  96, sy: 0, sw: 48, sh: 48 } },
  CHIMNEY_3: { sheetId: 'chimney', region: { sx: 144, sy: 0, sw: 48, sh: 48 } },
  CHIMNEY_4: { sheetId: 'chimney', region: { sx: 192, sy: 0, sw: 48, sh: 48 } },
  CHIMNEY_5: { sheetId: 'chimney', region: { sx: 240, sy: 0, sw: 48, sh: 48 } },
  CHIMNEY_6: { sheetId: 'chimney', region: { sx: 288, sy: 0, sw: 48, sh: 48 } },
  CHIMNEY_7: { sheetId: 'chimney', region: { sx: 336, sy: 0, sw: 48, sh: 48 } },

  // ── Classic Chimneys (Chimney1-Sheet 256x32, 8 sprites at 32x32) ──
  CHIMNEY1_0: { sheetId: 'chimney1', region: { sx:   0, sy: 0, sw: 32, sh: 32 } },
  CHIMNEY1_1: { sheetId: 'chimney1', region: { sx:  32, sy: 0, sw: 32, sh: 32 } },
  CHIMNEY1_2: { sheetId: 'chimney1', region: { sx:  64, sy: 0, sw: 32, sh: 32 } },
  CHIMNEY1_3: { sheetId: 'chimney1', region: { sx:  96, sy: 0, sw: 32, sh: 32 } },
  CHIMNEY1_4: { sheetId: 'chimney1', region: { sx: 128, sy: 0, sw: 32, sh: 32 } },
  CHIMNEY1_5: { sheetId: 'chimney1', region: { sx: 160, sy: 0, sw: 32, sh: 32 } },
  CHIMNEY1_6: { sheetId: 'chimney1', region: { sx: 192, sy: 0, sw: 32, sh: 32 } },
  CHIMNEY1_7: { sheetId: 'chimney1', region: { sx: 224, sy: 0, sw: 32, sh: 32 } },

  // ── Hospital Doors (DoorsHospital-Sheet 800x80, 10 sprites at 80x80) ──
  DOOR_HOSP_DOUBLE:    { sheetId: 'doorsHospital', region: { sx:   0, sy: 0, sw: 80, sh: 80 } },
  DOOR_HOSP_FRAME_L:   { sheetId: 'doorsHospital', region: { sx:  80, sy: 0, sw: 80, sh: 80 } },
  DOOR_HOSP_FRAME_R:   { sheetId: 'doorsHospital', region: { sx: 160, sy: 0, sw: 80, sh: 80 } },
  DOOR_HOSP_SLIM_L:    { sheetId: 'doorsHospital', region: { sx: 240, sy: 0, sw: 80, sh: 80 } },
  DOOR_HOSP_SLIM_R:    { sheetId: 'doorsHospital', region: { sx: 320, sy: 0, sw: 80, sh: 80 } },
  DOOR_HOSP_HANDLE:    { sheetId: 'doorsHospital', region: { sx: 400, sy: 0, sw: 80, sh: 80 } },
  DOOR_HOSP_SINGLE:    { sheetId: 'doorsHospital', region: { sx: 480, sy: 0, sw: 80, sh: 80 } },
  DOOR_HOSP_SINGLE_W:  { sheetId: 'doorsHospital', region: { sx: 560, sy: 0, sw: 80, sh: 80 } },
  DOOR_HOSP_SMALL:     { sheetId: 'doorsHospital', region: { sx: 640, sy: 0, sw: 80, sh: 80 } },
  DOOR_HOSP_FRAME_END: { sheetId: 'doorsHospital', region: { sx: 720, sy: 0, sw: 80, sh: 80 } },

  // ── Bathroom (Bathroom-Sheet 576x96, 6 items at 96x96) ──
  // NOTE: Item widths may not be exactly 96px uniform — verify visually in Phase 4
  BATHROOM_SINK:      { sheetId: 'bathroom', region: { sx:   0, sy: 0, sw: 96, sh: 96 } },
  BATHROOM_DISPENSER: { sheetId: 'bathroom', region: { sx:  96, sy: 0, sw: 96, sh: 96 } },
  BATHROOM_BATHTUB:   { sheetId: 'bathroom', region: { sx: 192, sy: 0, sw: 96, sh: 96 } },
  BATHROOM_CABINET:   { sheetId: 'bathroom', region: { sx: 288, sy: 0, sw: 96, sh: 96 } },
  BATHROOM_MAT:       { sheetId: 'bathroom', region: { sx: 384, sy: 0, sw: 96, sh: 96 } },
  BATHROOM_SHELF:     { sheetId: 'bathroom', region: { sx: 480, sy: 0, sw: 96, sh: 96 } },

  // ── Hospital Beds (BedHospital-Sheet 128x64, 2 sprites at 64x64) ──
  BED_HOSPITAL_0: { sheetId: 'bedHospital', region: { sx:  0, sy: 0, sw: 64, sh: 64 } },
  BED_HOSPITAL_1: { sheetId: 'bedHospital', region: { sx: 64, sy: 0, sw: 64, sh: 64 } },

  // ── Beds (Beds-Sheet 256x256, 4x4 grid at 64x64) ──
  BED_0:  { sheetId: 'beds', region: { sx:   0, sy:   0, sw: 64, sh: 64 } },
  BED_1:  { sheetId: 'beds', region: { sx:  64, sy:   0, sw: 64, sh: 64 } },
  BED_2:  { sheetId: 'beds', region: { sx: 128, sy:   0, sw: 64, sh: 64 } },
  BED_3:  { sheetId: 'beds', region: { sx: 192, sy:   0, sw: 64, sh: 64 } },
  BED_4:  { sheetId: 'beds', region: { sx:   0, sy:  64, sw: 64, sh: 64 } },
  BED_5:  { sheetId: 'beds', region: { sx:  64, sy:  64, sw: 64, sh: 64 } },
  BED_6:  { sheetId: 'beds', region: { sx: 128, sy:  64, sw: 64, sh: 64 } },
  BED_7:  { sheetId: 'beds', region: { sx: 192, sy:  64, sw: 64, sh: 64 } },
  BED_8:  { sheetId: 'beds', region: { sx:   0, sy: 128, sw: 64, sh: 64 } },
  BED_9:  { sheetId: 'beds', region: { sx:  64, sy: 128, sw: 64, sh: 64 } },
  BED_10: { sheetId: 'beds', region: { sx: 128, sy: 128, sw: 64, sh: 64 } },
  BED_11: { sheetId: 'beds', region: { sx: 192, sy: 128, sw: 64, sh: 64 } },
  BED_12: { sheetId: 'beds', region: { sx:   0, sy: 192, sw: 64, sh: 64 } },
  BED_13: { sheetId: 'beds', region: { sx:  64, sy: 192, sw: 64, sh: 64 } },
  BED_14: { sheetId: 'beds', region: { sx: 128, sy: 192, sw: 64, sh: 64 } },
  BED_15: { sheetId: 'beds', region: { sx: 192, sy: 192, sw: 64, sh: 64 } },
} as const;

// ─── Furniture & Seats ──────────────────────────────────────
const furniture: FurnitureObject[] = [];
const seats: Seat[] = [];
let seatId = 1;

/** Island Pod: 4 desks; 2 top (chairs face south), 2 bottom (chairs face north) */
function createPod(sx: number, sy: number, prefix: string) {
  for (let i = 0; i < 2; i++) {
    const dx = sx + i * 3;

    // ── Top desk (facing south, chairs sit 1 row below) ──
    furniture.push({
      id: `desk-${prefix}-top-${i}`, type: 'desk',
      tileX: dx, tileY: sy, widthTiles: 2, heightTiles: 1,
      sprite: SPRITES.DESK_TOP, drawOffsetY: -16
    });
    furniture.push({
      id: `mon-${prefix}-top-${i}`, type: 'monitor',
      tileX: dx, tileY: sy, widthTiles: 2, heightTiles: 1,
      walkableMask: [false, false],
      sprite: SPRITES.MONITOR, drawOffsetY: -8, sortY: -1
    });
    for (let c = 0; c < 2; c++) {
      const id = `s${seatId++}`;
      furniture.push({
        id: `chair-${id}`, type: 'chair',
        tileX: dx + c, tileY: sy + 1, widthTiles: 1, heightTiles: 1,
        walkableMask: [true],
        sprite: SPRITES.CHAIR_DOWN, seatId: id, drawOffsetY: -8
      });
      seats.push({ id, tileX: dx + c, tileY: sy + 1, deskTileX: dx, deskTileY: sy, facing: 'down' });
    }

    // ── Bottom desk (facing north, chairs sit 1 row above) ──
    const bdy = sy + 3;
    furniture.push({
      id: `desk-${prefix}-bot-${i}`, type: 'desk',
      tileX: dx, tileY: bdy, widthTiles: 2, heightTiles: 1,
      sprite: SPRITES.DESK_BOT, drawOffsetY: -16
    });
    furniture.push({
      id: `mon-${prefix}-bot-${i}`, type: 'monitor',
      tileX: dx, tileY: bdy, widthTiles: 2, heightTiles: 1,
      walkableMask: [false, false],
      sprite: SPRITES.MONITOR, drawOffsetY: -8, sortY: -1
    });
    for (let c = 0; c < 2; c++) {
      const id = `s${seatId++}`;
      furniture.push({
        id: `chair-${id}`, type: 'chair',
        tileX: dx + c, tileY: bdy - 1, widthTiles: 1, heightTiles: 1,
        walkableMask: [true],
        sprite: SPRITES.CHAIR_UP, seatId: id, drawOffsetY: -8
      });
      seats.push({ id, tileX: dx + c, tileY: bdy - 1, deskTileX: dx, deskTileY: bdy, facing: 'up' });
    }
  }
}

// 1. Desk Pods
createPod(2, 3, 'L');
createPod(12, 3, 'R');

// 2. Lounge
furniture.push({
  id: 'carpet-center', type: 'carpet',
  tileX: 8, tileY: 9, widthTiles: 4, heightTiles: 4,
  walkableMask: Array(16).fill(true),
  sprite: SPRITES.CARPET, layer: 'wall'
});
furniture.push({
  id: 'sofa-front', type: 'sofa',
  tileX: 7, tileY: 8, widthTiles: 4, heightTiles: 1,
  sprite: SPRITES.SOFA_FRONT, drawOffsetY: -16
});
furniture.push({
  id: 'sofa-back', type: 'sofa',
  tileX: 7, tileY: 12, widthTiles: 4, heightTiles: 1,
  sprite: SPRITES.SOFA_BACK, drawOffsetY: -16
});

// 3. Decorations
furniture.push({ id: 'plant-L', type: 'plant', tileX: 1, tileY: 12, widthTiles: 1, heightTiles: 1, sprite: SPRITES.PLANT, drawOffsetY: -32 });
furniture.push({ id: 'plant-R', type: 'plant', tileX: 18, tileY: 12, widthTiles: 1, heightTiles: 1, sprite: SPRITES.PLANT, drawOffsetY: -32 });
furniture.push({ id: 'shelf-L', type: 'bookshelf', tileX: 1, tileY: 2, widthTiles: 2, heightTiles: 1, sprite: SPRITES.BOOKSHELF_L, drawOffsetY: -32 });
furniture.push({ id: 'shelf-R', type: 'bookshelf', tileX: 17, tileY: 2, widthTiles: 2, heightTiles: 1, sprite: SPRITES.BOOKSHELF_R, drawOffsetY: -32 });
furniture.push({ id: 'cooler', type: 'water-cooler', tileX: 10, tileY: 2, widthTiles: 1, heightTiles: 2, sprite: SPRITES.WATER_COOLER, drawOffsetY: -16 });
furniture.push({ id: 'paint-1', type: 'painting', tileX: 4, tileY: 1, widthTiles: 1, heightTiles: 1, sprite: SPRITES.PAINTING_1, layer: 'wall' });
furniture.push({ id: 'paint-2', type: 'painting', tileX: 15, tileY: 1, widthTiles: 1, heightTiles: 1, sprite: SPRITES.PAINTING_2, layer: 'wall' });

// 4. Lounge Lamps
furniture.push({ id: 'lamp-L', type: 'lamp', tileX: 6,  tileY: 9, widthTiles: 1, heightTiles: 1, sprite: SPRITES.LAMP,       drawOffsetY: -24 });
furniture.push({ id: 'lamp-R', type: 'lamp', tileX: 13, tileY: 9, widthTiles: 1, heightTiles: 1, sprite: SPRITES.LAMP_BROWN, drawOffsetY: -24 });

// 5. Windows (top wall: y=0)
[4, 7, 12, 15].forEach((wx, i) => {
  furniture.push({
    id: `win-${i}`, type: 'window',
    tileX: wx, tileY: 0, widthTiles: 2, heightTiles: 1,
    sprite: i % 2 === 0 ? SPRITES.WINDOW_WOOD : SPRITES.WINDOW_BLUE,
    layer: 'wall', drawOffsetY: -16
  });
});

// 6. Entry Door (bottom wall center) — shows on bottom wall row
furniture.push({
  id: 'door-entry', type: 'door',
  tileX: 9, tileY: 14, widthTiles: 2, heightTiles: 1,
  sprite: SPRITES.DOOR, layer: 'wall', drawOffsetY: -64
});

// ─── Export ─────────────────────────────────────────────────
export const officeLayout: OfficeLayout = {
  width: 20, height: 15, tileSize: 16,
  tiles, furniture, seats
};

export default officeLayout;
