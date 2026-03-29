/**
 * generate-tiles.ts
 *
 * Generates a MetroCity-style office tileset (128x64, 8 cols x 4 rows, 16x16 each).
 * Each tile is drawn pixel-by-pixel for a warm, clean pixel art aesthetic
 * matching the MetroCity character pack.
 *
 * Tile index mapping (must match asset-manifest.ts & office-layout.ts):
 *   0 = floor light       1 = floor dark
 *   2 = wall top          3 = wall side
 *   4 = desk top          5 = desk front
 *   6 = chair             7 = plant
 *   8 = bookshelf         9 = rug
 *  10 = whiteboard       11 = water cooler
 *
 * Output: public/assets/tiles/office-tiles.png
 */

import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// Constants
// ============================================================

const TILE = 16;
const SHEET_COLS = 8;
const SHEET_ROWS = 4;
const SHEET_W = TILE * SHEET_COLS; // 128
const SHEET_H = TILE * SHEET_ROWS; // 64

// ============================================================
// Color helpers
// ============================================================

type RGBA = [number, number, number, number];

function hex(color: string, alpha = 255): RGBA {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return [r, g, b, alpha];
}

function darken(c: RGBA, amount: number): RGBA {
  return [
    Math.max(0, Math.round(c[0] * (1 - amount))),
    Math.max(0, Math.round(c[1] * (1 - amount))),
    Math.max(0, Math.round(c[2] * (1 - amount))),
    c[3],
  ];
}

function lighten(c: RGBA, amount: number): RGBA {
  return [
    Math.min(255, Math.round(c[0] + (255 - c[0]) * amount)),
    Math.min(255, Math.round(c[1] + (255 - c[1]) * amount)),
    Math.min(255, Math.round(c[2] + (255 - c[2]) * amount)),
    c[3],
  ];
}

// ============================================================
// Tile buffer (16x16 RGBA)
// ============================================================

class TileBuffer {
  data: Uint8Array;
  constructor() {
    this.data = new Uint8Array(TILE * TILE * 4);
  }

  setPixel(x: number, y: number, color: RGBA): void {
    if (x < 0 || x >= TILE || y < 0 || y >= TILE) return;
    const idx = (y * TILE + x) * 4;
    this.data[idx] = color[0];
    this.data[idx + 1] = color[1];
    this.data[idx + 2] = color[2];
    this.data[idx + 3] = color[3];
  }

  fill(color: RGBA): void {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        this.setPixel(x, y, color);
      }
    }
  }

  fillRect(x0: number, y0: number, w: number, h: number, color: RGBA): void {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        this.setPixel(x, y, color);
      }
    }
  }

  /** Draw a horizontal line */
  hLine(x0: number, x1: number, y: number, color: RGBA): void {
    for (let x = x0; x <= x1; x++) {
      this.setPixel(x, y, color);
    }
  }

  /** Draw a vertical line */
  vLine(x: number, y0: number, y1: number, color: RGBA): void {
    for (let y = y0; y <= y1; y++) {
      this.setPixel(x, y, color);
    }
  }
}

// ============================================================
// Palette (MetroCity warm tones)
// ============================================================

const PAL = {
  // Floor
  floorLight1: hex('#E8D5B0'),
  floorLight2: hex('#DCC9A3'),
  floorLightGrain: hex('#D8C59E'),
  floorLightHighlight: hex('#F0DDB8'),

  floorDark1: hex('#D4C294'),
  floorDark2: hex('#C8B688'),
  floorDarkGrain: hex('#C0AE80'),
  floorDarkHighlight: hex('#DCCA9C'),

  // Wall
  wallTop1: hex('#8090A0'),
  wallTop2: hex('#707F8F'),
  wallTopMortar: hex('#909FAF'),
  wallTopDark: hex('#667686'),

  wallSide1: hex('#6B7B8B'),
  wallSide2: hex('#5E6E7E'),
  wallSideMortar: hex('#7B8B9B'),
  wallSideDark: hex('#4E5E6E'),

  // Desk
  deskWood1: hex('#9B7B55'),
  deskWood2: hex('#876741'),
  deskHighlight: hex('#AB8B65'),
  deskShadow: hex('#7B5B35'),
  deskEdge: hex('#6B4B25'),

  // Chair
  chairBlue1: hex('#4A7DB8'),
  chairBlue2: hex('#3D6EA5'),
  chairHighlight: hex('#5A8DC8'),
  chairShadow: hex('#2D5E95'),
  chairMetal: hex('#808080'),
  chairMetalLight: hex('#A0A0A0'),

  // Bookshelf
  shelfWood1: hex('#7B5B3B'),
  shelfWood2: hex('#6B4B2B'),
  shelfHighlight: hex('#8B6B4B'),
  shelfShadow: hex('#5B3B1B'),
  bookRed: hex('#C85050'),
  bookBlue: hex('#5070B0'),
  bookGreen: hex('#50A050'),
  bookYellow: hex('#D0B040'),

  // Rug
  rugRed1: hex('#C85050'),
  rugRed2: hex('#B84040'),
  rugPattern1: hex('#D86060'),
  rugPattern2: hex('#A03030'),
  rugFringe: hex('#D89060'),

  // Plant
  leaf1: hex('#4CAF50'),
  leaf2: hex('#388E3C'),
  leaf3: hex('#66BB6A'),
  potBrown1: hex('#8B6B4B'),
  potBrown2: hex('#7B5B3B'),
  potHighlight: hex('#9B7B5B'),
  soil: hex('#5B4B3B'),

  // Whiteboard
  boardWhite: hex('#E8E8E8'),
  boardFrame: hex('#505050'),
  boardFrameLight: hex('#686868'),
  boardText: hex('#A0A0B0'),
  boardMarker: hex('#3070B0'),

  // Water cooler
  waterBlue: hex('#B8D8E8'),
  waterBlueDark: hex('#90B8D0'),
  coolerBody: hex('#808080'),
  coolerLight: hex('#A0A0A0'),
  coolerDark: hex('#606060'),
  coolerWhite: hex('#D0D0D0'),
  coolerSpout: hex('#505050'),
};

// ============================================================
// Tile drawing functions
// ============================================================

function drawFloorLight(): TileBuffer {
  const t = new TileBuffer();
  // Base fill
  t.fill(PAL.floorLight1);

  // Wood plank pattern: horizontal grain lines
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      // Alternate planks every 4 rows
      const plank = Math.floor(y / 4);
      const inPlank = y % 4;

      if (inPlank === 0) {
        // Plank seam line (slightly darker)
        t.setPixel(x, y, PAL.floorLight2);
      } else if (inPlank === 1 && (x + plank * 3) % 7 === 0) {
        // Subtle grain highlight
        t.setPixel(x, y, PAL.floorLightHighlight);
      } else if (inPlank === 2 && (x + plank * 5) % 9 === 0) {
        // Subtle grain shadow
        t.setPixel(x, y, PAL.floorLightGrain);
      }
    }
  }

  // Plank stagger: offset joints
  // Vertical joint at x=7 on even planks, x=11 on odd planks
  for (let plank = 0; plank < 4; plank++) {
    const jointX = plank % 2 === 0 ? 7 : 11;
    const py = plank * 4;
    t.vLine(jointX, py + 1, py + 3, PAL.floorLight2);
  }

  return t;
}

function drawFloorDark(): TileBuffer {
  const t = new TileBuffer();
  t.fill(PAL.floorDark1);

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const plank = Math.floor(y / 4);
      const inPlank = y % 4;

      if (inPlank === 0) {
        t.setPixel(x, y, PAL.floorDark2);
      } else if (inPlank === 1 && (x + plank * 3) % 7 === 0) {
        t.setPixel(x, y, PAL.floorDarkHighlight);
      } else if (inPlank === 2 && (x + plank * 5) % 9 === 0) {
        t.setPixel(x, y, PAL.floorDarkGrain);
      }
    }
  }

  for (let plank = 0; plank < 4; plank++) {
    const jointX = plank % 2 === 0 ? 11 : 7;
    const py = plank * 4;
    t.vLine(jointX, py + 1, py + 3, PAL.floorDark2);
  }

  return t;
}

function drawWallTop(): TileBuffer {
  const t = new TileBuffer();
  t.fill(PAL.wallTop1);

  // Brick/block pattern: 3-4 px tall blocks with mortar lines
  // Row 0: top edge highlight
  t.hLine(0, 15, 0, PAL.wallTopMortar);

  // Block row 1 (y=1..5): 8px wide blocks
  for (let x = 0; x < TILE; x++) {
    // Mortar lines between blocks
    if (x === 7 || x === 15) {
      t.vLine(x, 1, 5, PAL.wallTopMortar);
    }
  }
  t.hLine(0, 15, 6, PAL.wallTopMortar); // horizontal mortar

  // Block row 2 (y=7..11): offset blocks by 4px
  for (let x = 0; x < TILE; x++) {
    if (x === 3 || x === 11) {
      t.vLine(x, 7, 11, PAL.wallTopMortar);
    }
  }
  t.hLine(0, 15, 12, PAL.wallTopMortar); // horizontal mortar

  // Block row 3 (y=13..15)
  for (let x = 0; x < TILE; x++) {
    if (x === 7 || x === 15) {
      t.vLine(x, 13, 15, PAL.wallTopMortar);
    }
  }

  // Add subtle shading to blocks: top-left lighter, bottom-right darker
  for (let y = 1; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const idx = (y * TILE + x) * 4;
      // Check if this is a mortar pixel (skip)
      if (t.data[idx] === PAL.wallTopMortar[0] && t.data[idx + 1] === PAL.wallTopMortar[1]) continue;

      // Determine block position
      let blockRow: number, inBlockY: number;
      if (y <= 5) { blockRow = 0; inBlockY = y - 1; }
      else if (y <= 11) { blockRow = 1; inBlockY = y - 7; }
      else { blockRow = 2; inBlockY = y - 13; }

      // Top pixel of block: slightly lighter
      if (inBlockY === 0) {
        t.setPixel(x, y, lighten(PAL.wallTop1, 0.05));
      }
      // Bottom pixel of block: slightly darker
      const blockH = blockRow === 2 ? 2 : 4;
      if (inBlockY === blockH) {
        t.setPixel(x, y, PAL.wallTopDark);
      }
    }
  }

  return t;
}

function drawWallSide(): TileBuffer {
  const t = new TileBuffer();
  t.fill(PAL.wallSide1);

  // Vertical brick pattern (side view of wall)
  // Left edge highlight (light hits from left)
  t.vLine(0, 0, 15, PAL.wallSideMortar);

  // Block rows with mortar
  t.hLine(0, 15, 0, PAL.wallSideMortar);
  t.hLine(0, 15, 5, PAL.wallSideMortar);
  t.hLine(0, 15, 10, PAL.wallSideMortar);
  t.hLine(0, 15, 15, PAL.wallSideMortar);

  // Vertical mortar staggered
  for (let x = 0; x < TILE; x++) {
    if (x === 7) {
      t.vLine(x, 1, 4, PAL.wallSideMortar);
      t.vLine(x, 11, 14, PAL.wallSideMortar);
    }
    if (x === 3 || x === 11) {
      t.vLine(x, 6, 9, PAL.wallSideMortar);
    }
  }

  // Subtle shading per block
  for (let y = 1; y < 5; y++) {
    for (let x = 1; x < TILE; x++) {
      const idx = (y * TILE + x) * 4;
      if (t.data[idx] === PAL.wallSideMortar[0] && t.data[idx + 1] === PAL.wallSideMortar[1]) continue;
      if (y === 1) t.setPixel(x, y, lighten(PAL.wallSide1, 0.05));
      if (y === 4) t.setPixel(x, y, PAL.wallSideDark);
    }
  }
  for (let y = 6; y < 10; y++) {
    for (let x = 1; x < TILE; x++) {
      const idx = (y * TILE + x) * 4;
      if (t.data[idx] === PAL.wallSideMortar[0] && t.data[idx + 1] === PAL.wallSideMortar[1]) continue;
      if (y === 6) t.setPixel(x, y, lighten(PAL.wallSide1, 0.05));
      if (y === 9) t.setPixel(x, y, PAL.wallSideDark);
    }
  }
  for (let y = 11; y < 15; y++) {
    for (let x = 1; x < TILE; x++) {
      const idx = (y * TILE + x) * 4;
      if (t.data[idx] === PAL.wallSideMortar[0] && t.data[idx + 1] === PAL.wallSideMortar[1]) continue;
      if (y === 11) t.setPixel(x, y, lighten(PAL.wallSide1, 0.05));
      if (y === 14) t.setPixel(x, y, PAL.wallSideDark);
    }
  }

  return t;
}

function drawDeskTop(): TileBuffer {
  const t = new TileBuffer();

  // Desk surface (top-down view of wooden desk)
  // Outer edge/frame
  t.fill(PAL.deskWood1);

  // 1px border (darker wood edge)
  t.hLine(0, 15, 0, PAL.deskEdge);
  t.hLine(0, 15, 15, PAL.deskEdge);
  t.vLine(0, 0, 15, PAL.deskEdge);
  t.vLine(15, 0, 15, PAL.deskEdge);

  // Top highlight edge (light from above)
  t.hLine(1, 14, 1, PAL.deskHighlight);

  // Wood grain: horizontal subtle lines
  for (let y = 2; y < 15; y++) {
    for (let x = 1; x < 15; x++) {
      if ((x + y * 3) % 11 === 0) {
        t.setPixel(x, y, PAL.deskWood2);
      }
      if ((x + y * 7) % 13 === 0) {
        t.setPixel(x, y, PAL.deskHighlight);
      }
    }
  }

  // Slight shadow on bottom edge interior
  t.hLine(1, 14, 14, PAL.deskShadow);

  return t;
}

function drawDeskFront(): TileBuffer {
  const t = new TileBuffer();

  // Desk front panel (viewed from front)
  t.fill(PAL.deskWood2);

  // Top edge (desk surface thickness) - lighter
  t.hLine(0, 15, 0, PAL.deskHighlight);
  t.hLine(0, 15, 1, PAL.deskWood1);

  // Frame edges
  t.vLine(0, 0, 15, PAL.deskEdge);
  t.vLine(15, 0, 15, PAL.deskEdge);
  t.hLine(0, 15, 15, PAL.deskShadow);

  // Panel detail: recessed center panel
  t.fillRect(2, 3, 12, 10, PAL.deskShadow);
  t.fillRect(3, 4, 10, 8, PAL.deskWood2);

  // Panel highlights
  t.hLine(3, 12, 4, lighten(PAL.deskWood2, 0.1));
  t.vLine(3, 4, 11, lighten(PAL.deskWood2, 0.1));

  // Drawer handle (small knob)
  t.hLine(7, 8, 8, PAL.deskEdge);

  // Wood grain lines
  for (let y = 4; y < 12; y++) {
    if (y % 3 === 0) {
      for (let x = 4; x < 12; x++) {
        if (x % 5 === 0) {
          t.setPixel(x, y, lighten(PAL.deskWood2, 0.05));
        }
      }
    }
  }

  return t;
}

function drawChair(): TileBuffer {
  const t = new TileBuffer();

  // Top-down view of an office chair
  // Transparent background first (for placed on floor)
  t.fill([0, 0, 0, 0]);

  // Chair base (metal cross - 5 legs)
  // Center post
  t.setPixel(7, 7, PAL.chairMetal);
  t.setPixel(8, 7, PAL.chairMetal);
  t.setPixel(7, 8, PAL.chairMetal);
  t.setPixel(8, 8, PAL.chairMetal);

  // 5 legs radiating out
  t.setPixel(7, 3, PAL.chairMetalLight);  // top
  t.setPixel(8, 3, PAL.chairMetalLight);
  t.setPixel(7, 4, PAL.chairMetal);
  t.setPixel(8, 4, PAL.chairMetal);

  t.setPixel(3, 6, PAL.chairMetalLight);  // left
  t.setPixel(4, 7, PAL.chairMetal);
  t.setPixel(5, 7, PAL.chairMetal);

  t.setPixel(12, 6, PAL.chairMetalLight); // right
  t.setPixel(11, 7, PAL.chairMetal);
  t.setPixel(10, 7, PAL.chairMetal);

  t.setPixel(4, 11, PAL.chairMetalLight); // bottom-left
  t.setPixel(5, 10, PAL.chairMetal);
  t.setPixel(6, 9, PAL.chairMetal);

  t.setPixel(11, 11, PAL.chairMetalLight); // bottom-right
  t.setPixel(10, 10, PAL.chairMetal);
  t.setPixel(9, 9, PAL.chairMetal);

  // Seat cushion (blue, rounded rectangle)
  t.fillRect(4, 4, 8, 8, PAL.chairBlue1);

  // Seat edge highlight (top/left)
  t.hLine(5, 10, 4, PAL.chairHighlight);
  t.vLine(4, 5, 10, PAL.chairHighlight);

  // Seat edge shadow (bottom/right)
  t.hLine(5, 10, 11, PAL.chairShadow);
  t.vLine(11, 5, 10, PAL.chairShadow);

  // Seat cushion interior detail
  t.fillRect(5, 5, 6, 6, PAL.chairBlue2);
  t.fillRect(6, 6, 4, 4, PAL.chairBlue1);

  // Backrest (top part, slightly darker, 2px thick)
  t.fillRect(4, 1, 8, 2, PAL.chairBlue2);
  t.hLine(5, 10, 1, PAL.chairHighlight);
  t.hLine(4, 11, 2, PAL.chairShadow);

  // Caster wheels (small dots at leg tips)
  t.setPixel(7, 2, PAL.chairMetal);
  t.setPixel(8, 2, PAL.chairMetal);
  t.setPixel(3, 5, PAL.chairMetal);
  t.setPixel(12, 5, PAL.chairMetal);

  return t;
}

function drawPlant(): TileBuffer {
  const t = new TileBuffer();
  t.fill([0, 0, 0, 0]);

  // Pot (trapezoidal from top-down/slight angle)
  t.fillRect(4, 10, 8, 5, PAL.potBrown1);
  // Pot rim highlight
  t.hLine(4, 11, 10, PAL.potHighlight);
  // Pot shadow
  t.hLine(5, 10, 14, PAL.potBrown2);
  t.vLine(11, 10, 14, PAL.potBrown2);
  // Pot base (slightly narrower)
  t.fillRect(5, 14, 6, 1, PAL.potBrown2);
  // Pot left highlight
  t.vLine(4, 11, 13, PAL.potHighlight);

  // Soil visible at top of pot
  t.fillRect(5, 10, 6, 1, PAL.soil);

  // Leaves (3 clusters)
  // Center leaf cluster
  t.fillRect(6, 5, 4, 5, PAL.leaf1);
  t.setPixel(7, 4, PAL.leaf1);
  t.setPixel(8, 4, PAL.leaf1);
  t.setPixel(7, 3, PAL.leaf3);  // highlight on top

  // Left leaf
  t.setPixel(4, 6, PAL.leaf2);
  t.setPixel(5, 5, PAL.leaf2);
  t.setPixel(5, 6, PAL.leaf1);
  t.setPixel(4, 7, PAL.leaf1);
  t.setPixel(3, 7, PAL.leaf3);

  // Right leaf
  t.setPixel(11, 6, PAL.leaf2);
  t.setPixel(10, 5, PAL.leaf2);
  t.setPixel(10, 6, PAL.leaf1);
  t.setPixel(11, 7, PAL.leaf1);
  t.setPixel(12, 7, PAL.leaf3);

  // Leaf highlights (lighter green spots)
  t.setPixel(7, 5, PAL.leaf3);
  t.setPixel(9, 6, PAL.leaf3);
  t.setPixel(6, 7, PAL.leaf3);

  // Leaf shadows (darker spots)
  t.setPixel(8, 8, PAL.leaf2);
  t.setPixel(6, 9, PAL.leaf2);
  t.setPixel(9, 9, PAL.leaf2);

  // Stem
  t.setPixel(7, 9, hex('#5D8B3D'));
  t.setPixel(8, 9, hex('#5D8B3D'));

  return t;
}

function drawBookshelf(): TileBuffer {
  const t = new TileBuffer();

  // Bookshelf (front view, wall-mounted)
  // Outer frame
  t.fill(PAL.shelfWood1);

  // Frame edges
  t.hLine(0, 15, 0, PAL.shelfHighlight);
  t.hLine(0, 15, 15, PAL.shelfShadow);
  t.vLine(0, 0, 15, PAL.shelfHighlight);
  t.vLine(15, 0, 15, PAL.shelfShadow);

  // Interior back panel
  t.fillRect(1, 1, 14, 14, PAL.shelfWood2);

  // Shelves (3 horizontal shelves)
  t.hLine(1, 14, 5, PAL.shelfWood1);
  t.hLine(1, 14, 10, PAL.shelfWood1);

  // Shelf edge highlights
  t.hLine(1, 14, 4, PAL.shelfHighlight);
  t.hLine(1, 14, 9, PAL.shelfHighlight);

  // Top shelf books (y=1..4)
  // Book 1 (red)
  t.fillRect(2, 1, 2, 3, PAL.bookRed);
  t.vLine(2, 1, 3, lighten(PAL.bookRed, 0.2));
  // Book 2 (blue)
  t.fillRect(5, 1, 2, 3, PAL.bookBlue);
  t.vLine(5, 1, 3, lighten(PAL.bookBlue, 0.2));
  // Book 3 (green)
  t.fillRect(8, 2, 2, 2, PAL.bookGreen);
  t.vLine(8, 2, 3, lighten(PAL.bookGreen, 0.2));
  // Book 4 (yellow)
  t.fillRect(11, 1, 2, 3, PAL.bookYellow);
  t.vLine(11, 1, 3, lighten(PAL.bookYellow, 0.2));

  // Middle shelf books (y=6..9)
  // Book 5 (blue)
  t.fillRect(2, 6, 3, 3, PAL.bookBlue);
  t.vLine(2, 6, 8, lighten(PAL.bookBlue, 0.2));
  // Book 6 (yellow)
  t.fillRect(6, 6, 2, 3, PAL.bookYellow);
  t.vLine(6, 6, 8, lighten(PAL.bookYellow, 0.2));
  // Book 7 (red)
  t.fillRect(9, 7, 2, 2, PAL.bookRed);
  t.vLine(9, 7, 8, lighten(PAL.bookRed, 0.2));
  // Book 8 (green)
  t.fillRect(12, 6, 2, 3, PAL.bookGreen);
  t.vLine(12, 6, 8, lighten(PAL.bookGreen, 0.2));

  // Bottom shelf (y=11..14) - fewer books, some space
  // Book 9 (red)
  t.fillRect(2, 11, 2, 3, PAL.bookRed);
  t.vLine(2, 11, 13, lighten(PAL.bookRed, 0.2));
  // Book 10 (green)
  t.fillRect(5, 11, 3, 3, PAL.bookGreen);
  t.vLine(5, 11, 13, lighten(PAL.bookGreen, 0.2));
  // Gap... then another
  t.fillRect(11, 12, 2, 2, PAL.bookBlue);
  t.vLine(11, 12, 13, lighten(PAL.bookBlue, 0.2));

  return t;
}

function drawRug(): TileBuffer {
  const t = new TileBuffer();

  // Rug with diamond/geometric pattern
  t.fill(PAL.rugRed1);

  // Diamond pattern using alternating colors
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      // Create a repeating diamond grid
      const dx = (x + 8) % 8;
      const dy = (y + 8) % 8;
      const dist = Math.abs(dx - 3.5) + Math.abs(dy - 3.5);

      if (dist < 2) {
        t.setPixel(x, y, PAL.rugPattern1);
      } else if (dist >= 3 && dist < 4) {
        t.setPixel(x, y, PAL.rugPattern2);
      }
    }
  }

  // Border (1px fringe)
  t.hLine(0, 15, 0, PAL.rugFringe);
  t.hLine(0, 15, 15, PAL.rugFringe);
  t.vLine(0, 0, 15, PAL.rugFringe);
  t.vLine(15, 0, 15, PAL.rugFringe);

  // Inner border
  t.hLine(1, 14, 1, PAL.rugRed2);
  t.hLine(1, 14, 14, PAL.rugRed2);
  t.vLine(1, 1, 14, PAL.rugRed2);
  t.vLine(14, 1, 14, PAL.rugRed2);

  return t;
}

function drawWhiteboard(): TileBuffer {
  const t = new TileBuffer();
  t.fill([0, 0, 0, 0]);

  // Frame
  t.fillRect(1, 1, 14, 14, PAL.boardFrame);

  // Frame highlight (top/left)
  t.hLine(1, 14, 1, PAL.boardFrameLight);
  t.vLine(1, 1, 14, PAL.boardFrameLight);

  // White surface
  t.fillRect(2, 2, 12, 12, PAL.boardWhite);

  // Subtle text/writing lines (light blue-gray)
  t.hLine(3, 10, 4, PAL.boardText);
  t.hLine(3, 12, 6, PAL.boardText);
  t.hLine(3, 8, 8, PAL.boardText);
  t.hLine(3, 11, 10, PAL.boardText);

  // Marker scribble (blue)
  t.hLine(4, 7, 5, PAL.boardMarker);
  t.setPixel(5, 7, PAL.boardMarker);
  t.setPixel(6, 9, PAL.boardMarker);
  t.setPixel(7, 9, PAL.boardMarker);

  // Marker tray at bottom
  t.fillRect(4, 13, 8, 1, PAL.boardFrame);
  // Marker on tray
  t.fillRect(5, 13, 3, 1, PAL.bookRed);
  t.fillRect(9, 13, 2, 1, PAL.boardMarker);

  return t;
}

function drawWaterCooler(): TileBuffer {
  const t = new TileBuffer();
  t.fill([0, 0, 0, 0]);

  // Water bottle on top (inverted jug)
  // Bottle body (rounded)
  t.fillRect(5, 0, 6, 6, PAL.waterBlue);
  t.setPixel(5, 0, [0, 0, 0, 0]);
  t.setPixel(10, 0, [0, 0, 0, 0]);
  t.setPixel(5, 5, [0, 0, 0, 0]);
  t.setPixel(10, 5, [0, 0, 0, 0]);

  // Bottle highlight (light reflection)
  t.vLine(6, 1, 4, lighten(PAL.waterBlue, 0.3));
  t.setPixel(7, 1, lighten(PAL.waterBlue, 0.2));

  // Water level line
  t.hLine(6, 9, 3, PAL.waterBlueDark);

  // Bottle neck (narrower)
  t.fillRect(6, 5, 4, 2, PAL.waterBlueDark);

  // Cooler body (gray box)
  t.fillRect(4, 7, 8, 6, PAL.coolerBody);

  // Body highlight
  t.vLine(4, 7, 12, PAL.coolerLight);
  t.hLine(4, 11, 7, PAL.coolerLight);

  // Body shadow
  t.vLine(11, 7, 12, PAL.coolerDark);
  t.hLine(4, 11, 12, PAL.coolerDark);

  // Front panel (lighter)
  t.fillRect(5, 8, 6, 4, PAL.coolerWhite);

  // Spout/tap
  t.fillRect(6, 9, 1, 2, PAL.coolerSpout);
  t.fillRect(9, 9, 1, 2, PAL.coolerSpout);

  // Drip tray
  t.fillRect(5, 11, 6, 1, PAL.coolerDark);

  // Base/legs
  t.fillRect(4, 13, 2, 2, PAL.coolerDark);
  t.fillRect(10, 13, 2, 2, PAL.coolerDark);

  // Labels on body
  t.setPixel(7, 9, hex('#5070B0')); // cold indicator
  t.setPixel(8, 9, hex('#C85050')); // hot indicator

  return t;
}

// ============================================================
// Main: compose all tiles into a sheet
// ============================================================

function main(): void {
  const projectRoot = path.resolve(__dirname, '..');
  const outDir = path.join(projectRoot, 'public', 'assets', 'tiles');
  const outPath = path.join(outDir, 'office-tiles.png');

  fs.mkdirSync(outDir, { recursive: true });

  // Generate all tiles
  const tiles: TileBuffer[] = [
    drawFloorLight(),    // 0
    drawFloorDark(),     // 1
    drawWallTop(),       // 2
    drawWallSide(),      // 3
    drawDeskTop(),       // 4
    drawDeskFront(),     // 5
    drawChair(),         // 6
    drawPlant(),         // 7
    drawBookshelf(),     // 8
    drawRug(),           // 9
    drawWhiteboard(),    // 10
    drawWaterCooler(),   // 11
  ];

  // Create output PNG
  const png = new PNG({ width: SHEET_W, height: SHEET_H });
  // Initialize fully transparent
  png.data.fill(0);

  // Place each tile into the sheet
  for (let i = 0; i < tiles.length; i++) {
    const col = i % SHEET_COLS;
    const row = Math.floor(i / SHEET_COLS);
    const tile = tiles[i];
    const baseX = col * TILE;
    const baseY = row * TILE;

    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const srcIdx = (y * TILE + x) * 4;
        const dstIdx = ((baseY + y) * SHEET_W + (baseX + x)) * 4;
        png.data[dstIdx] = tile.data[srcIdx];
        png.data[dstIdx + 1] = tile.data[srcIdx + 1];
        png.data[dstIdx + 2] = tile.data[srcIdx + 2];
        png.data[dstIdx + 3] = tile.data[srcIdx + 3];
      }
    }
  }

  // Write output
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outPath, buffer);

  console.log(`[generate-tiles] Written ${outPath}`);
  console.log(`[generate-tiles] Sheet: ${SHEET_W}x${SHEET_H} (${SHEET_COLS}x${SHEET_ROWS} tiles, ${TILE}x${TILE} each)`);
  console.log(`[generate-tiles] Tiles generated: ${tiles.length} / ${SHEET_COLS * SHEET_ROWS} slots`);
  console.log('[generate-tiles] Tile indices:');
  const names = [
    'floor light', 'floor dark', 'wall top', 'wall side',
    'desk top', 'desk front', 'chair', 'plant',
    'bookshelf', 'rug', 'whiteboard', 'water cooler',
  ];
  for (let i = 0; i < names.length; i++) {
    console.log(`  [${i}] ${names[i]}`);
  }
}

main();
