import type { OfficeLayout, TileInfo, Seat, FurnitureObject, FloorZone } from './types';
import { ZONE_INDEX } from './types';

// ─── Zone Boundary Constants ────────────────────────────────
// All coordinates inclusive, interior only (excludes outer walls)
const ZONES = {
  server:  { x1: 1,  y1: 1,  x2: 8,  y2: 9  },   // top-left 8x9
  workA:   { x1: 9,  y1: 1,  x2: 28, y2: 9  },   // top-right 20x9
  workB:   { x1: 1,  y1: 11, x2: 14, y2: 15 },   // mid-left 14x5 (y=10 is partition wall row)
  meeting: { x1: 16, y1: 11, x2: 21, y2: 15 },   // mid-right interior (walls at x=15, x=22, y=10, y=16)
  lounge:  { x1: 1,  y1: 17, x2: 14, y2: 22 },   // lower-left 14x6 (y=16 has partial meeting south wall)
  lobby:   { x1: 15, y1: 17, x2: 28, y2: 22 },   // lower-right 14x6
} as const;

// ─── Tile Helpers ────────────────────────────────────────────
const wall = (): TileInfo => ({ type: 'wall', walkable: false, spriteIndex: 3 });
const floor = (zone: FloorZone): TileInfo => ({
  type: 'floor', walkable: true, spriteIndex: ZONE_INDEX[zone], zone,
});

// ─── 30×24 Tile Grid ─────────────────────────────────────────
const tiles: TileInfo[][] = [];
for (let y = 0; y < 24; y++) {
  const row: TileInfo[] = [];
  for (let x = 0; x < 30; x++) {

    // a) Outer walls
    if (y === 0 || y === 23 || x === 0 || x === 29) {
      row.push(wall());

    // b) Server room south partition wall: y=10, x in [1..7]
    } else if (y === 10 && x >= 1 && x <= 7) {
      row.push(wall());

    // c) Meeting room partition walls
    // North wall: y=10, x in [15..22] except x in [18,19] (doorway gap)
    } else if (y === 10 && x >= 15 && x <= 22 && x !== 18 && x !== 19) {
      row.push(wall());

    // South wall: y=16, x in [15..22] except x in [18,19] (doorway gap)
    } else if (y === 16 && x >= 15 && x <= 22 && x !== 18 && x !== 19) {
      row.push(wall());

    // West wall: x=15, y in [11..15]
    } else if (x === 15 && y >= 11 && y <= 15) {
      row.push(wall());

    // East wall: x=22, y in [11..15]
    } else if (x === 22 && y >= 11 && y <= 15) {
      row.push(wall());

    // d) Floor zones (checked in order)
    // server zone: x in [1..8], y in [1..9]
    } else if (x >= 1 && x <= 8 && y >= 1 && y <= 9) {
      row.push(floor('server'));

    // workA zone: x in [9..28], y in [1..9]
    } else if (x >= 9 && x <= 28 && y >= 1 && y <= 9) {
      row.push(floor('work'));

    // workB zone: x in [1..14], y in [11..15]
    } else if (x >= 1 && x <= 14 && y >= 11 && y <= 15) {
      row.push(floor('work'));

    // meeting interior: x in [16..21], y in [11..15]
    } else if (x >= 16 && x <= 21 && y >= 11 && y <= 15) {
      row.push(floor('meeting'));

    // east utility (kitchenette): x in [23..28], y in [11..15]
    } else if (x >= 23 && x <= 28 && y >= 11 && y <= 15) {
      row.push(floor('corridor'));

    // lounge zone: x in [1..14], y in [17..22]
    } else if (x >= 1 && x <= 14 && y >= 17 && y <= 22) {
      row.push(floor('lounge'));

    // lobby zone: x in [15..28], y in [17..22]
    } else if (x >= 15 && x <= 28 && y >= 17 && y <= 22) {
      row.push(floor('lobby'));

    // y=10 remaining (not wall, not already handled)
    } else if (y === 10) {
      if (x === 8) {
        row.push(floor('corridor'));  // server room door gap
      } else if (x >= 9 && x <= 14) {
        row.push(floor('corridor'));  // open corridor between work areas
      } else if (x === 18 || x === 19) {
        row.push(floor('corridor'));  // meeting room north door gap (already handled above but safety)
      } else {
        row.push(floor('corridor'));
      }

    // y=16 remaining (not wall, not already handled)
    } else if (y === 16) {
      if (x >= 1 && x <= 14) {
        row.push(floor('corridor'));  // corridor between workB and lounge
      } else if (x === 18 || x === 19) {
        row.push(floor('corridor'));  // meeting room south door gap (already handled above but safety)
      } else if (x >= 23 && x <= 28) {
        row.push(floor('corridor'));  // east utility south corridor
      } else {
        row.push(floor('corridor'));
      }

    // Anything else
    } else {
      row.push(floor('corridor'));
    }
  }
  tiles.push(row);
}

// Compile-time grid size assertion
if (tiles.length !== 24 || tiles[0].length !== 30) {
  throw new Error(`Grid must be 30x24, got ${tiles[0].length}x${tiles.length}`);
}

// ─── Sprite Constants ────────────────────────────────────────
// All coordinates verified against actual sprite sheet images.
// Phase 1: 91 entries preserved exactly as-is
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
  // Sofa — LivingRoom1: first row is blue sofa-front (80x48)
  SOFA_FRONT:   { sheetId: 'livingRoom1', region: { sx: 0,   sy: 0,   sw: 80, sh: 48 } },
  SOFA_BACK:    { sheetId: 'livingRoom1', region: { sx: 0,   sy: 96,  sw: 80, sh: 48 } },
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

  // ── Phase 2: New sprites ──

  // Sofa color variants (LivingRoom1-Sheet, same dimensions as existing SOFA_FRONT: 80x48)
  SOFA_GREEN_FRONT: { sheetId: 'livingRoom1', region: { sx: 0, sy: 288, sw: 80, sh: 48 } },
  SOFA_CYAN_FRONT:  { sheetId: 'livingRoom1', region: { sx: 0, sy: 576, sw: 80, sh: 48 } },
  SOFA_BLUE_FRONT:  { sheetId: 'livingRoom1', region: { sx: 0, sy: 0,   sw: 80, sh: 48 } },

  // Kitchen items (Kitchen-Sheet 1152x96, items at 96px intervals)
  KITCHEN_FRIDGE:   { sheetId: 'kitchen', region: { sx:  96, sy: 0, sw: 96, sh: 96 } },
  KITCHEN_COUNTER:  { sheetId: 'kitchen', region: { sx:   0, sy: 0, sw: 96, sh: 96 } },
  KITCHEN_SINK:     { sheetId: 'kitchen', region: { sx: 288, sy: 0, sw: 96, sh: 96 } },

  // Large TV for meeting room (TV-Sheet 256x96)
  TV_LARGE:         { sheetId: 'tv', region: { sx: 128, sy: 0, sw: 128, sh: 96 } },

  // Additional paintings (Paintings 320x32, Paintings1 160x32)
  PAINTING_3: { sheetId: 'paintings',  region: { sx: 128, sy: 0, sw: 32, sh: 32 } },
  PAINTING_4: { sheetId: 'paintings',  region: { sx: 192, sy: 0, sw: 32, sh: 32 } },
  PAINTING_5: { sheetId: 'paintings1', region: { sx:   0, sy: 0, sw: 32, sh: 32 } },
  PAINTING_6: { sheetId: 'paintings1', region: { sx:  32, sy: 0, sw: 32, sh: 32 } },
  PAINTING_7: { sheetId: 'paintings1', region: { sx:  64, sy: 0, sw: 32, sh: 32 } },
  PAINTING_8: { sheetId: 'paintings1', region: { sx:  96, sy: 0, sw: 32, sh: 32 } },

  // Additional plant variants (Flowers-Sheet 384x96)
  PLANT_SMALL: { sheetId: 'flowers', region: { sx:  0, sy: 0, sw: 32, sh: 48 } },
  PLANT_LARGE: { sheetId: 'flowers', region: { sx: 48, sy: 0, sw: 32, sh: 48 } },
  PLANT_POT:   { sheetId: 'flowers', region: { sx: 80, sy: 0, sw: 32, sh: 48 } },

  // Window variants (Windows-Sheet 896x64, 64px per window)
  WINDOW_PURPLE: { sheetId: 'windows', region: { sx: 192, sy: 0, sw: 64, sh: 64 } },
  WINDOW_WHITE:  { sheetId: 'windows', region: { sx: 288, sy: 0, sw: 64, sh: 64 } },

  // Reception desk placeholder (Kitchen counter style)
  RECEPTION_DESK: { sheetId: 'kitchen', region: { sx: 576, sy: 0, sw: 96, sh: 96 } },
} as const;

// ─── Furniture & Seats ──────────────────────────────────────
const furniture: FurnitureObject[] = [];
const seats: Seat[] = [];
let seatId = 1;

/**
 * Island Pod: 2 columns of 2 desks each;
 * top desks face south (chairs below), bottom desks face north (chairs above).
 * Pod footprint: 6 tiles wide x 5 tiles tall (sy to sy+4)
 * Produces 4 seats per pod.
 */
function createPod(sx: number, sy: number, prefix: string) {
  for (let i = 0; i < 2; i++) {
    const dx = sx + i * 3;

    // Top desk (facing south)
    furniture.push({
      id: `desk-${prefix}-top-${i}`, type: 'desk',
      tileX: dx, tileY: sy, widthTiles: 2, heightTiles: 1,
      walkableMask: [false, false],
      sprite: SPRITES.DESK_TOP, drawOffsetY: -16,
    });
    furniture.push({
      id: `mon-${prefix}-top-${i}`, type: 'monitor',
      tileX: dx, tileY: sy, widthTiles: 2, heightTiles: 1,
      walkableMask: [false, false],
      sprite: SPRITES.MONITOR, drawOffsetY: -8, sortY: -1,
    });
    for (let c = 0; c < 2; c++) {
      const id = `s${seatId++}`;
      furniture.push({
        id: `chair-${id}`, type: 'chair',
        tileX: dx + c, tileY: sy + 1, widthTiles: 1, heightTiles: 1,
        walkableMask: [true],
        sprite: SPRITES.CHAIR_DOWN, seatId: id, drawOffsetY: -8,
      });
      seats.push({ id, tileX: dx + c, tileY: sy + 1, deskTileX: dx, deskTileY: sy, facing: 'down' });
    }

    // Bottom desk (facing north)
    const bdy = sy + 3;
    furniture.push({
      id: `desk-${prefix}-bot-${i}`, type: 'desk',
      tileX: dx, tileY: bdy, widthTiles: 2, heightTiles: 1,
      walkableMask: [false, false],
      sprite: SPRITES.DESK_BOT, drawOffsetY: -16,
    });
    furniture.push({
      id: `mon-${prefix}-bot-${i}`, type: 'monitor',
      tileX: dx, tileY: bdy, widthTiles: 2, heightTiles: 1,
      walkableMask: [false, false],
      sprite: SPRITES.MONITOR, drawOffsetY: -8, sortY: -1,
    });
    for (let c = 0; c < 2; c++) {
      const id = `s${seatId++}`;
      furniture.push({
        id: `chair-${id}`, type: 'chair',
        tileX: dx + c, tileY: bdy - 1, widthTiles: 1, heightTiles: 1,
        walkableMask: [true],
        sprite: SPRITES.CHAIR_UP, seatId: id, drawOffsetY: -8,
      });
      seats.push({ id, tileX: dx + c, tileY: bdy - 1, deskTileX: dx, deskTileY: bdy, facing: 'up' });
    }
  }
}

// ── Work Zone A: 3 pods, 12 seats (ZONES.workA: x=9..28, y=1..9) ──
createPod(10, 2, 'A1');   // pod at x:10-15, y:2-6, seats s1-s4
createPod(17, 2, 'A2');   // pod at x:17-22, y:2-6, seats s5-s8
createPod(23, 2, 'A3');   // pod at x:23-28, y:2-6, seats s9-s12

// ── Work Zone B: 2 pods, 8 seats (ZONES.workB: x=1..14, y=11..15) ──
createPod(2, 11, 'B1');   // pod at x:2-7, y:11-15, seats s13-s16
createPod(9, 11, 'B2');   // pod at x:9-14, y:11-15, seats s17-s20

// Total seat count: 12 (Zone A) + 8 (Zone B) = 20 seats

// ── Server Room (ZONES.server: x=1..8, y=1..9) ──
// 4 server racks in 2 rows with a 1-tile aisle at y=5
furniture.push({
  id: 'rack-0', type: 'server-rack',
  tileX: 1, tileY: 1, widthTiles: 4, heightTiles: 4,
  walkableMask: Array(16).fill(false),
  sprite: SPRITES.SERVER_RACK_PURPLE, drawOffsetY: -48,
});
furniture.push({
  id: 'rack-1', type: 'server-rack',
  tileX: 5, tileY: 1, widthTiles: 4, heightTiles: 4,
  walkableMask: Array(16).fill(false),
  sprite: SPRITES.SERVER_RACK_BLUE, drawOffsetY: -48,
});
furniture.push({
  id: 'rack-2', type: 'server-rack',
  tileX: 1, tileY: 6, widthTiles: 4, heightTiles: 4,
  walkableMask: Array(16).fill(false),
  sprite: SPRITES.SERVER_RACK_GREEN, drawOffsetY: -48,
});
furniture.push({
  id: 'rack-3', type: 'server-rack',
  tileX: 5, tileY: 6, widthTiles: 4, heightTiles: 4,
  walkableMask: Array(16).fill(false),
  sprite: SPRITES.SERVER_RACK_CYAN, drawOffsetY: -48,
});

// Server monitoring equipment (R3.1: WATER_COOLER-based monitoring)
furniture.push({
  id: 'monitor-srv', type: 'water-cooler',
  tileX: 3, tileY: 5, widthTiles: 1, heightTiles: 2,
  walkableMask: [false, false],
  sprite: SPRITES.WATER_COOLER, drawOffsetY: -16,
});

// Server room lamp (R6.2 ambient lighting)
furniture.push({
  id: 'lamp-srv', type: 'lamp',
  tileX: 6, tileY: 5, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.LAMP, drawOffsetY: -24,
});

// ── Meeting Room (interior: x=16..21, y=11..15) ──
// Conference table: 3 adjacent DESK_TOP sprites (6-tile-wide table)
furniture.push({
  id: 'desk-mtg-0', type: 'desk',
  tileX: 16, tileY: 12, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.DESK_TOP, drawOffsetY: -16,
});
furniture.push({
  id: 'desk-mtg-1', type: 'desk',
  tileX: 18, tileY: 12, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.DESK_TOP, drawOffsetY: -16,
});
furniture.push({
  id: 'desk-mtg-2', type: 'desk',
  tileX: 20, tileY: 12, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.DESK_TOP, drawOffsetY: -16,
});

// Meeting chairs (6 chairs, 3 on each side — decoration only, not agent seats)
furniture.push({
  id: 'chair-mtg-n0', type: 'chair',
  tileX: 16, tileY: 11, widthTiles: 1, heightTiles: 1,
  walkableMask: [true],
  sprite: SPRITES.CHAIR_DOWN, drawOffsetY: -8,
});
furniture.push({
  id: 'chair-mtg-n1', type: 'chair',
  tileX: 18, tileY: 11, widthTiles: 1, heightTiles: 1,
  walkableMask: [true],
  sprite: SPRITES.CHAIR_DOWN, drawOffsetY: -8,
});
furniture.push({
  id: 'chair-mtg-n2', type: 'chair',
  tileX: 20, tileY: 11, widthTiles: 1, heightTiles: 1,
  walkableMask: [true],
  sprite: SPRITES.CHAIR_DOWN, drawOffsetY: -8,
});
furniture.push({
  id: 'chair-mtg-s0', type: 'chair',
  tileX: 16, tileY: 13, widthTiles: 1, heightTiles: 1,
  walkableMask: [true],
  sprite: SPRITES.CHAIR_UP, drawOffsetY: -8,
});
furniture.push({
  id: 'chair-mtg-s1', type: 'chair',
  tileX: 18, tileY: 13, widthTiles: 1, heightTiles: 1,
  walkableMask: [true],
  sprite: SPRITES.CHAIR_UP, drawOffsetY: -8,
});
furniture.push({
  id: 'chair-mtg-s2', type: 'chair',
  tileX: 20, tileY: 13, widthTiles: 1, heightTiles: 1,
  walkableMask: [true],
  sprite: SPRITES.CHAIR_UP, drawOffsetY: -8,
});

// Meeting room TV (wall-mounted on north partition wall row y=10)
furniture.push({
  id: 'tv-mtg', type: 'monitor',
  tileX: 18, tileY: 10, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.MONITOR, layer: 'wall', drawOffsetY: -16,
});

// Meeting room whiteboard (R3.3 — on west interior wall x=15)
furniture.push({
  id: 'whiteboard-mtg', type: 'whiteboard',
  tileX: 15, tileY: 13, widthTiles: 1, heightTiles: 2,
  walkableMask: [false, false],
  sprite: SPRITES.MONITOR, layer: 'wall', drawOffsetY: -16,
});

// Meeting room carpet
furniture.push({
  id: 'carpet-mtg', type: 'carpet',
  tileX: 16, tileY: 11, widthTiles: 6, heightTiles: 5,
  walkableMask: Array(30).fill(true),
  sprite: SPRITES.CARPET, layer: 'wall',
});

// Meeting room door (north doorway at x:18-19, y:10)
furniture.push({
  id: 'door-mtg-n', type: 'door',
  tileX: 18, tileY: 10, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.DOOR, layer: 'wall', drawOffsetY: -64,
});

// ── Lounge (ZONES.lounge: x=1..14, y=17..22) ──
// Carpet (center)
furniture.push({
  id: 'carpet-lounge', type: 'carpet',
  tileX: 5, tileY: 18, widthTiles: 4, heightTiles: 4,
  walkableMask: Array(16).fill(true),
  sprite: SPRITES.CARPET, layer: 'wall',
});

// Sofas (2 colored sofas, using 80x48 sprites)
furniture.push({
  id: 'sofa-lounge-green', type: 'sofa',
  tileX: 4, tileY: 17, widthTiles: 4, heightTiles: 1,
  walkableMask: [false, false, false, false],
  sprite: SPRITES.SOFA_GREEN_FRONT, drawOffsetY: -16,
});
furniture.push({
  id: 'sofa-lounge-cyan', type: 'sofa',
  tileX: 4, tileY: 21, widthTiles: 4, heightTiles: 1,
  walkableMask: [false, false, false, false],
  sprite: SPRITES.SOFA_CYAN_FRONT, drawOffsetY: -16,
});

// Fireplace (chimney is 48x48 = 3x3 tiles, on west wall)
furniture.push({
  id: 'fireplace', type: 'fireplace',
  tileX: 1, tileY: 18, widthTiles: 3, heightTiles: 3,
  walkableMask: Array(9).fill(false),
  sprite: SPRITES.CHIMNEY_0, drawOffsetY: -16,
});

// Coffee table
furniture.push({
  id: 'table-lounge', type: 'desk',
  tileX: 6, tileY: 19, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.DESK_TOP, drawOffsetY: -16,
});

// Lounge lamps (2)
furniture.push({
  id: 'lamp-lounge-L', type: 'lamp',
  tileX: 3, tileY: 19, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.LAMP, drawOffsetY: -24,
});
furniture.push({
  id: 'lamp-lounge-R', type: 'lamp',
  tileX: 11, tileY: 19, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.LAMP_BROWN, drawOffsetY: -24,
});

// ── Kitchenette (east utility: x=23..28, y=11..15) ──
furniture.push({
  id: 'fridge', type: 'appliance',
  tileX: 27, tileY: 11, widthTiles: 2, heightTiles: 3,
  walkableMask: Array(6).fill(false),
  sprite: SPRITES.KITCHEN_FRIDGE, drawOffsetY: -48,
});
furniture.push({
  id: 'counter', type: 'appliance',
  tileX: 24, tileY: 11, widthTiles: 2, heightTiles: 3,
  walkableMask: Array(6).fill(false),
  sprite: SPRITES.KITCHEN_COUNTER, drawOffsetY: -48,
});
furniture.push({
  id: 'cooler', type: 'water-cooler',
  tileX: 26, tileY: 13, widthTiles: 1, heightTiles: 2,
  walkableMask: [false, false],
  sprite: SPRITES.WATER_COOLER, drawOffsetY: -16,
});

// ── Lobby (ZONES.lobby: x=15..28, y=17..22) ──
// Lobby sofa
furniture.push({
  id: 'sofa-lobby', type: 'sofa',
  tileX: 20, tileY: 20, widthTiles: 4, heightTiles: 1,
  walkableMask: [false, false, false, false],
  sprite: SPRITES.SOFA_FRONT, drawOffsetY: -16,
});

// Reception desk
furniture.push({
  id: 'reception', type: 'reception-desk',
  tileX: 19, tileY: 18, widthTiles: 2, heightTiles: 2,
  walkableMask: [false, false, false, false],
  sprite: SPRITES.RECEPTION_DESK, drawOffsetY: -48,
});

// Lobby glass front door (south wall at y=23)
furniture.push({
  id: 'door-lobby', type: 'door',
  tileX: 20, tileY: 23, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.DOOR_HOSP_DOUBLE, layer: 'wall', drawOffsetY: -64,
});

// Lobby lamps (2)
furniture.push({
  id: 'lamp-lobby-L', type: 'lamp',
  tileX: 16, tileY: 18, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.LAMP, drawOffsetY: -24,
});
furniture.push({
  id: 'lamp-lobby-R', type: 'lamp',
  tileX: 27, tileY: 18, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.LAMP_BROWN, drawOffsetY: -24,
});

// Large lobby plants (2)
furniture.push({
  id: 'plant-lobby-L', type: 'plant',
  tileX: 15, tileY: 17, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_LARGE, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-lobby-R', type: 'plant',
  tileX: 28, tileY: 22, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_LARGE, drawOffsetY: -32,
});

// ── Bookshelves in Work Zone A along north wall ──
furniture.push({
  id: 'shelf-workA-L', type: 'bookshelf',
  tileX: 9, tileY: 1, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.BOOKSHELF_L, drawOffsetY: -32,
});
furniture.push({
  id: 'shelf-workA-R', type: 'bookshelf',
  tileX: 27, tileY: 1, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.BOOKSHELF_R, drawOffsetY: -32,
});

// Verify all furniture has walkableMask
const missing = furniture.filter(f => !f.walkableMask);
if (missing.length > 0) {
  throw new Error(`Furniture missing walkableMask: ${missing.map(f => f.id).join(', ')}`);
}

// ── North wall windows (R4.1: 8 windows) ──
furniture.push({
  id: 'win-0', type: 'window',
  tileX: 2, tileY: 0, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.WINDOW_WOOD, layer: 'wall', drawOffsetY: -16,
});
furniture.push({
  id: 'win-1', type: 'window',
  tileX: 5, tileY: 0, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.WINDOW_BLUE, layer: 'wall', drawOffsetY: -16,
});
furniture.push({
  id: 'win-2', type: 'window',
  tileX: 10, tileY: 0, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.WINDOW_WOOD, layer: 'wall', drawOffsetY: -16,
});
furniture.push({
  id: 'win-3', type: 'window',
  tileX: 13, tileY: 0, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.WINDOW_BLUE, layer: 'wall', drawOffsetY: -16,
});
furniture.push({
  id: 'win-4', type: 'window',
  tileX: 16, tileY: 0, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.WINDOW_PURPLE, layer: 'wall', drawOffsetY: -16,
});
furniture.push({
  id: 'win-5', type: 'window',
  tileX: 19, tileY: 0, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.WINDOW_WOOD, layer: 'wall', drawOffsetY: -16,
});
furniture.push({
  id: 'win-6', type: 'window',
  tileX: 22, tileY: 0, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.WINDOW_BLUE, layer: 'wall', drawOffsetY: -16,
});
furniture.push({
  id: 'win-7', type: 'window',
  tileX: 25, tileY: 0, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.WINDOW_WHITE, layer: 'wall', drawOffsetY: -16,
});

// ── Wall paintings (R4.3: 8 paintings) ──
furniture.push({
  id: 'paint-0', type: 'painting',
  tileX: 3, tileY: 1, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PAINTING_1, layer: 'wall',
});
furniture.push({
  id: 'paint-1', type: 'painting',
  tileX: 12, tileY: 1, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PAINTING_2, layer: 'wall',
});
furniture.push({
  id: 'paint-2', type: 'painting',
  tileX: 20, tileY: 1, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PAINTING_3, layer: 'wall',
});
furniture.push({
  id: 'paint-3', type: 'painting',
  tileX: 3, tileY: 17, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PAINTING_4, layer: 'wall',
});
furniture.push({
  id: 'paint-4', type: 'painting',
  tileX: 8, tileY: 17, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PAINTING_5, layer: 'wall',
});
furniture.push({
  id: 'paint-5', type: 'painting',
  tileX: 16, tileY: 17, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PAINTING_6, layer: 'wall',
});
furniture.push({
  id: 'paint-6', type: 'painting',
  tileX: 23, tileY: 17, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PAINTING_7, layer: 'wall',
});
furniture.push({
  id: 'paint-7', type: 'painting',
  tileX: 26, tileY: 1, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PAINTING_8, layer: 'wall',
});

// ── Plants (R4.4 + R6.1: 12 plants) ──
furniture.push({
  id: 'plant-0', type: 'plant',
  tileX: 9, tileY: 9, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-1', type: 'plant',
  tileX: 28, tileY: 1, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_SMALL, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-2', type: 'plant',
  tileX: 1, tileY: 9, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_LARGE, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-3', type: 'plant',
  tileX: 9, tileY: 10, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-4', type: 'plant',
  tileX: 14, tileY: 10, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_POT, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-5', type: 'plant',
  tileX: 1, tileY: 16, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-6', type: 'plant',
  tileX: 14, tileY: 16, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_LARGE, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-7', type: 'plant',
  tileX: 1, tileY: 22, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_SMALL, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-8', type: 'plant',
  tileX: 14, tileY: 22, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-9', type: 'plant',
  tileX: 19, tileY: 22, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_POT, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-10', type: 'plant',
  tileX: 23, tileY: 22, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_LARGE, drawOffsetY: -32,
});
furniture.push({
  id: 'plant-11', type: 'plant',
  tileX: 28, tileY: 17, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT, drawOffsetY: -32,
});

// ─── Export ──────────────────────────────────────────────────
export const officeLayout: OfficeLayout = {
  width: 30, height: 24, tileSize: 16,
  tiles, furniture, seats,
};

export default officeLayout;

// Suppress unused variable warning for ZONES (used during construction above)
void ZONES;
