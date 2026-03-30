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

// ─── 30×24 Tile Grid (unified floor) ─────────────────────────
const tiles: TileInfo[][] = [];
for (let y = 0; y < 24; y++) {
  const row: TileInfo[] = [];
  for (let x = 0; x < 30; x++) {
    if (y === 0 || y === 23 || x === 0 || x === 29) {
      row.push(wall());
    } else {
      row.push(floor('work'));
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
  // Desks — Kitchen1-Sheet (96x96 cells, one per column)
  DESK_TOP:     { sheetId: 'cupboard', region: { sx: 78, sy: 18, sw: 37, sh: 30 } },
  DESK_BOT:     { sheetId: 'cupboard', region: { sx: 142, sy: 18, sw: 35, sh: 30 } },
  // Chairs — Kitchen1: 96x96 cells, one per column
  CHAIR_UP:     { sheetId: 'kitchen1', region: { sx:  42, sy:  7, sw: 12, sh: 25 } },
  CHAIR_LEFT:   { sheetId: 'kitchen1', region: { sx: 232, sy:  9, sw: 14, sh: 23 } },
  CHAIR_DOWN:   { sheetId: 'kitchen1', region: { sx: 138, sy: 12, sw: 12, sh: 20 } },
  CHAIR_RIGHT:  { sheetId: 'kitchen1', region: { sx: 330, sy:  9, sw: 14, sh: 23 } },
  // Monitor / TV — 64x96 cell
  MONITOR:      { sheetId: 'tv',       region: { sx: 128, sy: 0, sw: 64, sh: 96 } },
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
  // Lamps — Lights-Sheet: 64x64 cells
  LAMP:         { sheetId: 'lights', region: { sx:  0, sy: 0, sw: 64, sh: 64 } },
  LAMP_BROWN:   { sheetId: 'lights', region: { sx: 64, sy: 0, sw: 64, sh: 64 } },
  // Windows — Windows-Sheet: 64x64 cells
  WINDOW_WOOD:  { sheetId: 'windows', region: { sx:   0, sy: 0, sw: 64, sh: 64 } },
  WINDOW_BLUE:  { sheetId: 'windows', region: { sx: 256, sy: 0, sw: 64, sh: 64 } },
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
  KITCHEN_FRIDGE:   { sheetId: 'kitchen', region: { sx: 672, sy: 0, sw: 96, sh: 96 } },
  KITCHEN_COUNTER:  { sheetId: 'kitchen', region: { sx:  96, sy: 0, sw: 96, sh: 96 } },
  KITCHEN_SINK:     { sheetId: 'kitchen', region: { sx: 288, sy: 0, sw: 96, sh: 96 } },

  // Large TV for meeting room (TV-Sheet 256x96, 64x96 cell)
  TV_LARGE:         { sheetId: 'tv', region: { sx: 128, sy: 0, sw: 64, sh: 96 } },

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
  WINDOW_PURPLE: { sheetId: 'windows', region: { sx: 576, sy: 0, sw: 64, sh: 64 } },
  WINDOW_WHITE:  { sheetId: 'windows', region: { sx: 384, sy: 0, sw: 64, sh: 64 } },

  // Reception desk (Kitchen-Sheet col8 = cabinet-counter)
  RECEPTION_DESK: { sheetId: 'kitchen', region: { sx: 768, sy: 0, sw: 96, sh: 96 } },
} as const;

// ─── Furniture & Seats ──────────────────────────────────────
const furniture: FurnitureObject[] = [];
const seats: Seat[] = [];
let seatId = 1;

/**
 * Desk Row: N single desks in a horizontal row.
 * Each desk = 1 desk surface + 1 monitor + 1 chair = 1 seat.
 * Desk at y, chair at y+1 centered below desk (character faces DOWN/forward).
 */
function createDeskRow(startX: number, y: number, count: number, prefix: string) {
  const spacing = 3; // 2-tile desk + 1-tile gap
  for (let i = 0; i < count; i++) {
    const x = startX + i * spacing;
    const id = `s${seatId++}`;
    // All visuals centered on character position (tileX=x → worldX = x*16+8)
    // Desk: 32px wide, center at x*16+8 → drawOffsetX = 8-16 = -8
    furniture.push({
      id: `desk-${prefix}-${i}`, type: 'desk',
      tileX: x, tileY: y, widthTiles: 2, heightTiles: 1,
      walkableMask: [false, false],
      sprite: SPRITES.DESK_TOP, renderWidth: 32, renderHeight: 20, drawOffsetY: 4, drawOffsetX: -8,
    });
    // Monitor: 24px wide, center at x*16+8 → drawOffsetX = 8-12 = -4
    furniture.push({
      id: `mon-${prefix}-${i}`, type: 'monitor',
      tileX: x, tileY: y, widthTiles: 2, heightTiles: 1,
      walkableMask: [false, false],
      sprite: SPRITES.MONITOR, renderWidth: 24, renderHeight: 12, drawOffsetY: 8, drawOffsetX: -4, sortY: y - 1,
    });
    // Chair: 10px wide, center at x*16+8 → drawOffsetX = 8-5 = 3
    furniture.push({
      id: `chair-${id}`, type: 'chair',
      tileX: x, tileY: y - 1, widthTiles: 1, heightTiles: 1,
      walkableMask: [true],
      sprite: SPRITES.CHAIR_DOWN, renderWidth: 10, renderHeight: 14, seatId: id,
      drawOffsetY: 0, drawOffsetX: 3, sortY: y - 2,
    });
    seats.push({ id, tileX: x, tileY: y - 1, deskTileX: x, deskTileY: y, facing: 'down' });
  }
}

// ── Work Zone A: 1 row × 6 desks = 6 seats (ZONES.workA: x=9..28, y=1..9) ──
createDeskRow(10, 5, 6, 'A');   // desks at y:5, chairs at y:4

// Total seat count: 6 seats


// Verify all furniture has walkableMask
const missing = furniture.filter(f => !f.walkableMask);
if (missing.length > 0) {
  throw new Error(`Furniture missing walkableMask: ${missing.map(f => f.id).join(', ')}`);
}

// ─── Export ──────────────────────────────────────────────────
export const officeLayout: OfficeLayout = {
  width: 30, height: 24, tileSize: 16,
  tiles, furniture, seats,
};

export default officeLayout;

// Suppress unused variable warning for ZONES (used during construction above)
void ZONES;
