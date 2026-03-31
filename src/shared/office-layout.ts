import type { OfficeLayout, TileInfo, Seat, FurnitureObject, FloorZone } from './types';
import { ZONE_INDEX } from './types';

// ─── Zone Boundary Constants ────────────────────────────────
const ZONES = {
  lobby:  { x1: 1,  y1: 1,  x2: 28, y2: 7  },  // top: elevator, sofas, machines, plants, windows
  workA:  { x1: 1,  y1: 9,  x2: 28, y2: 13 },  // mid: cubicle row 1 (5 cubicles)
  workB:  { x1: 1,  y1: 15, x2: 28, y2: 20 },  // bot: cubicle row 2 (5 cubicles)
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
    if (y === 0 || y === 23 || x === 0 || x === 29) {
      row.push(wall());
    } else if (y >= 1 && y <= 7) {
      row.push(floor('lobby'));
    } else if (y === 8 || y === 14 || y === 21 || y === 22) {
      row.push(floor('corridor'));    // corridors between zones
    } else if (y >= 9 && y <= 13) {
      row.push(floor('work'));        // cubicle row 1
    } else if (y >= 15 && y <= 20) {
      row.push(floor('work'));        // cubicle row 2
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

// ─── Furniture & Seats ───────────────────────────────────────
const furniture: FurnitureObject[] = [];
const seats: Seat[] = [];
let seatId = 1;

// Chair color cycle for visual variety
const CHAIR_COLORS = [
  SPRITES.CHAIR_ORANGE, SPRITES.CHAIR_YELLOW, SPRITES.CHAIR_GREEN,
  SPRITES.CHAIR_BLUE,   SPRITES.CHAIR_WHITE,  SPRITES.CHAIR_GRAY,
];

/**
 * Create a row of cubicles (desk + chair = 1 seat each).
 * Desk at (x, deskY) — 2 tiles wide, 1 tile high, non-walkable.
 * Chair at (x, deskY-1) — 1 tile wide, walkable (seat tile), character faces down.
 * drawOffsetY > 0 moves sprite UP (above tile origin).
 * sortY on chairs = chairY - 1 so chairs render behind the seated character.
 */
function createCubicleRow(startX: number, deskY: number, count: number, prefix: string) {
  const spacing = 4; // 2-tile desk + 2-tile gap between cubicles
  for (let i = 0; i < count; i++) {
    const x = startX + i * spacing;
    const id = `s${seatId++}`;
    const chairY = deskY - 1;

    // Cubicle desk: 26x21px original, 2-tile footprint
    // Alternate between CUBICLE_DESK_A and CUBICLE_DESK_B for variety
    furniture.push({
      id: `desk-${prefix}-${i}`, type: 'desk',
      tileX: x, tileY: deskY, widthTiles: 2, heightTiles: 1,
      walkableMask: [false, false],
      sprite: i % 2 === 0 ? SPRITES.CUBICLE_DESK_A : SPRITES.CUBICLE_DESK_B,
      renderWidth: 26, renderHeight: i % 2 === 0 ? 21 : 25,
      drawOffsetX: -3, drawOffsetY: 4,
    });

    // Chair: 11x22px original, 1-tile footprint
    furniture.push({
      id: `chair-${id}`, type: 'chair',
      tileX: x, tileY: chairY, widthTiles: 1, heightTiles: 1,
      walkableMask: [true],
      sprite: CHAIR_COLORS[i % CHAIR_COLORS.length],
      renderWidth: 11, renderHeight: 22,
      seatId: id,
      drawOffsetX: 3, drawOffsetY: 0,
      sortY: chairY - 1,
    });

    seats.push({
      id, tileX: x, tileY: chairY,
      deskTileX: x, deskTileY: deskY,
      facing: 'down',
    });
  }
}

// ── Cubicle Row 1: 5 cubicles at y=10 (desks), y=9 (chairs) ──
createCubicleRow(2, 10, 5, 'A');

// ── Cubicle Row 2: 5 cubicles at y=16 (desks), y=15 (chairs) ──
createCubicleRow(2, 16, 5, 'B');

// Total: 10 seats

// ── Lobby: Elevator (center, against top wall) ──
furniture.push({
  id: 'elevator', type: 'door',
  tileX: 12, tileY: 1, widthTiles: 3, heightTiles: 2,
  walkableMask: [false, false, false, false, false, false],
  sprite: SPRITES.ELEVATOR,
  renderWidth: 48, renderHeight: 32,
  drawOffsetX: 0, drawOffsetY: 0,
});

// ── Lobby: Window panels (left and right sides, on top wall) ──
furniture.push({
  id: 'window-left', type: 'window',
  tileX: 2, tileY: 1, widthTiles: 5, heightTiles: 1,
  walkableMask: [false, false, false, false, false],
  sprite: SPRITES.WINDOW_PANEL,
  renderWidth: 79, renderHeight: 17,
  drawOffsetX: 0, drawOffsetY: 0,
  layer: 'wall',
});
furniture.push({
  id: 'window-right', type: 'window',
  tileX: 19, tileY: 1, widthTiles: 5, heightTiles: 1,
  walkableMask: [false, false, false, false, false],
  sprite: SPRITES.WINDOW_PANEL,
  renderWidth: 79, renderHeight: 17,
  drawOffsetX: 0, drawOffsetY: 0,
  layer: 'wall',
});

// ── Lobby: Plants (flanking elevator) ──
furniture.push({
  id: 'plant-left', type: 'plant',
  tileX: 10, tileY: 2, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_LEFT,
  renderWidth: 15, renderHeight: 38,
  drawOffsetX: 0, drawOffsetY: 22,
});
furniture.push({
  id: 'plant-right', type: 'plant',
  tileX: 16, tileY: 2, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_RIGHT,
  renderWidth: 18, renderHeight: 40,
  drawOffsetX: 0, drawOffsetY: 24,
});

// ── Lobby: Sofas (decorative, no seats) ──
furniture.push({
  id: 'sofa-1', type: 'sofa',
  tileX: 4, tileY: 5, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.SOFA_ORANGE,
  renderWidth: 26, renderHeight: 16,
  drawOffsetX: -3, drawOffsetY: 0,
});
furniture.push({
  id: 'sofa-2', type: 'sofa',
  tileX: 7, tileY: 5, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.SOFA_WHITE,
  renderWidth: 26, renderHeight: 20,
  drawOffsetX: -3, drawOffsetY: 0,
});

// ── Lobby: Vending machines (left wall) ──
furniture.push({
  id: 'machine-1', type: 'appliance',
  tileX: 1, tileY: 3, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.MACHINE_ORANGE,
  renderWidth: 40, renderHeight: 16,
  drawOffsetX: -4, drawOffsetY: 0,
});
furniture.push({
  id: 'machine-2', type: 'appliance',
  tileX: 1, tileY: 4, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.MACHINE_GRAY,
  renderWidth: 33, renderHeight: 15,
  drawOffsetX: 0, drawOffsetY: 0,
});

// ── Lobby: Snack racks (right side) ──
furniture.push({
  id: 'rack-1', type: 'appliance',
  tileX: 26, tileY: 3, widthTiles: 2, heightTiles: 2,
  walkableMask: [false, false, false, false],
  sprite: SPRITES.RACK_GRAY,
  renderWidth: 24, renderHeight: 49,
  drawOffsetX: 0, drawOffsetY: 17,
});
furniture.push({
  id: 'rack-2', type: 'appliance',
  tileX: 26, tileY: 5, widthTiles: 2, heightTiles: 2,
  walkableMask: [false, false, false, false],
  sprite: SPRITES.RACK_PINK,
  renderWidth: 24, renderHeight: 50,
  drawOffsetX: 0, drawOffsetY: 18,
});

// ── Mark furniture footprint tiles as non-walkable ──────────
for (const obj of furniture) {
  if (!obj.walkableMask) continue;
  for (let dy = 0; dy < obj.heightTiles; dy++) {
    for (let dx = 0; dx < obj.widthTiles; dx++) {
      const idx = dy * obj.widthTiles + dx;
      if (!obj.walkableMask[idx]) {
        const ty = obj.tileY + dy;
        const tx = obj.tileX + dx;
        if (ty >= 0 && ty < 24 && tx >= 0 && tx < 30) {
          tiles[ty][tx].walkable = false;
        }
      }
    }
  }
}

// ── Verify all furniture has walkableMask ────────────────────
const missing = furniture.filter(f => !f.walkableMask);
if (missing.length > 0) {
  throw new Error(`Furniture missing walkableMask: ${missing.map(f => f.id).join(', ')}`);
}

export const officeLayout: OfficeLayout = {
  width: 30, height: 24, tileSize: 16,
  tiles, furniture, seats,
};

export default officeLayout;

// Suppress unused variable warnings
void ZONES;
