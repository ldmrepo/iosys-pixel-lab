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
// All coordinates measured from PixelOfficeAssets.png (256x160px) via pngjs.
const SPRITES = {
  // Chairs (6 variants, each 11x22px, y=41..62)
  CHAIR_ORANGE: { sheetId: 'pixelOffice', region: { sx: 6,  sy: 41, sw: 11, sh: 22 } },
  CHAIR_YELLOW: { sheetId: 'pixelOffice', region: { sx: 19, sy: 41, sw: 11, sh: 22 } },
  CHAIR_GREEN:  { sheetId: 'pixelOffice', region: { sx: 32, sy: 41, sw: 11, sh: 22 } },
  CHAIR_BLUE:   { sheetId: 'pixelOffice', region: { sx: 45, sy: 41, sw: 11, sh: 22 } },
  CHAIR_WHITE:  { sheetId: 'pixelOffice', region: { sx: 58, sy: 41, sw: 11, sh: 22 } },
  CHAIR_GRAY:   { sheetId: 'pixelOffice', region: { sx: 71, sy: 41, sw: 11, sh: 22 } },

  // Sofas (decorative only, no seats)
  SOFA_ORANGE:  { sheetId: 'pixelOffice', region: { sx: 85, sy: 47, sw: 26, sh: 16 } },
  SOFA_WHITE:   { sheetId: 'pixelOffice', region: { sx: 84, sy: 70, sw: 26, sh: 20 } },

  // Cubicle desks (front view, ~26x21px)
  CUBICLE_DESK_A: { sheetId: 'pixelOffice', region: { sx: 59, sy: 96, sw: 26, sh: 21 } },
  CUBICLE_DESK_B: { sheetId: 'pixelOffice', region: { sx: 88, sy: 96, sw: 26, sh: 25 } },

  // Machines/Appliances (lobby wall items)
  MACHINE_ORANGE:  { sheetId: 'pixelOffice', region: { sx: 115, sy: 47,  sw: 40, sh: 16 } },
  MACHINE_GRAY:    { sheetId: 'pixelOffice', region: { sx: 119, sy: 66,  sw: 33, sh: 15 } },
  MACHINE_CYAN:    { sheetId: 'pixelOffice', region: { sx: 120, sy: 84,  sw: 33, sh: 15 } },
  MACHINE_GREEN:   { sheetId: 'pixelOffice', region: { sx: 120, sy: 102, sw: 33, sh: 16 } },
  MACHINE_ORANGE2: { sheetId: 'pixelOffice', region: { sx: 120, sy: 121, sw: 33, sh: 16 } },
  MACHINE_PURPLE:  { sheetId: 'pixelOffice', region: { sx: 116, sy: 140, sw: 40, sh: 17 } },

  // Window panel (79x17px, 3-pane window strip)
  WINDOW_PANEL:    { sheetId: 'pixelOffice', region: { sx: 171, sy: 44, sw: 79, sh: 17 } },

  // Elevator (92x40px assembly)
  ELEVATOR:        { sheetId: 'pixelOffice', region: { sx: 159, sy: 63, sw: 92, sh: 40 } },

  // Snack racks / shelves
  RACK_GRAY:       { sheetId: 'pixelOffice', region: { sx: 159, sy: 108, sw: 24, sh: 49 } },
  RACK_PINK:       { sheetId: 'pixelOffice', region: { sx: 184, sy: 107, sw: 24, sh: 50 } },
  RACK_SMALL_BLUE: { sheetId: 'pixelOffice', region: { sx: 211, sy: 107, sw: 12, sh: 50 } },

  // Plants (potted, for lobby)
  PLANT_LEFT:      { sheetId: 'pixelOffice', region: { sx: 170, sy: 65, sw: 15, sh: 38 } },
  PLANT_RIGHT:     { sheetId: 'pixelOffice', region: { sx: 213, sy: 63, sw: 18, sh: 40 } },
} as const;

// ---- Furniture & Seats (to be populated in Plan 02) ----
const furniture: FurnitureObject[] = [];
const seats: Seat[] = [];

// Verify all furniture has walkableMask
const missing = furniture.filter(f => !f.walkableMask);
if (missing.length > 0) {
  throw new Error(`Furniture missing walkableMask: ${missing.map(f => f.id).join(', ')}`);
}

export const officeLayout: OfficeLayout = {
  width: 30, height: 24, tileSize: 16,
  tiles, furniture, seats,
};

export default officeLayout;

// Suppress unused variable warnings for SPRITES and ZONES (used in Plan 02)
void SPRITES;
void ZONES;
