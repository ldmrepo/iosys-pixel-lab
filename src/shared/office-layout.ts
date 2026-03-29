import type { OfficeLayout, TileInfo, Seat } from './types';

/**
 * Office layout: 20 columns x 15 rows, tile size 16px
 *
 * Legend (tile spriteIndex):
 *   0 = floor light, 1 = floor dark
 *   2 = wall top,    3 = wall side
 *   4 = desk top,    5 = desk front
 *   6 = chair,       7 = plant
 *   8 = bookshelf,   9 = rug
 *  10 = whiteboard, 11 = water cooler
 *
 * Layout visual (20x15):
 *   Row 0:  wall top all across
 *   Row 1:  wall side | interior | wall side
 *   ...
 *   Row 14: wall top all across (bottom wall)
 */

type TileType = TileInfo['type'];

function tile(type: TileType, walkable: boolean, spriteIndex: number): TileInfo {
  return { type, walkable, spriteIndex };
}

// Shorthand constructors
const fL = () => tile('floor', true, 0);       // floor light
const fD = () => tile('floor', true, 1);        // floor dark
const wT = () => tile('wall', false, 2);        // wall top
const wS = () => tile('wall', false, 3);        // wall side
const dT = () => tile('desk', false, 4);        // desk top
const dF = () => tile('desk', false, 5);        // desk front
const ch = () => tile('chair', true, 6);        // chair (walkable - agent sits here)
const pl = () => tile('decoration', false, 7);  // plant
const bs = () => tile('decoration', false, 8);  // bookshelf
const rg = () => tile('floor', true, 9);        // rug (walkable)
const wb = () => tile('decoration', false, 10); // whiteboard
const wc = () => tile('decoration', false, 11); // water cooler

// Build the 20x15 grid
// Using a compact builder: each row is an array of factory functions
const layoutGrid: (() => TileInfo)[][] = [
  // Row 0: top wall
  [wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT],
  // Row 1: wall edges + whiteboard + bookshelf on walls
  [wS, wb, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, wb, fL, wS],
  // Row 2: top row of workstations (seats 1-4, desks on row 2, chairs on row 3)
  [wS, fL, fD, dT, dT, fD, fL, dT, dT, fL, fD, dT, dT, fD, fL, dT, dT, fL, fD, wS],
  // Row 3: chairs for workstations 1-4
  [wS, fD, fL, ch, ch, fL, fD, ch, ch, fD, fL, ch, ch, fL, fD, ch, ch, fD, fL, wS],
  // Row 4: open floor
  [wS, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, wS],
  // Row 5: floor with rug area in the middle
  [wS, fD, fL, fD, fL, rg, rg, rg, rg, rg, rg, rg, rg, rg, rg, fL, fD, fL, fD, wS],
  // Row 6: floor with rug area
  [wS, fL, fD, fL, fD, rg, rg, rg, rg, rg, rg, rg, rg, rg, rg, fD, fL, fD, fL, wS],
  // Row 7: center row - plants/water cooler on sides
  [wS, pl, fL, fD, fL, rg, rg, rg, rg, rg, rg, rg, rg, rg, rg, fL, fD, fL, wc, wS],
  // Row 8: floor with rug area
  [wS, fD, fL, fD, fL, rg, rg, rg, rg, rg, rg, rg, rg, rg, rg, fD, fL, fD, fL, wS],
  // Row 9: floor with rug area
  [wS, fL, fD, fL, fD, rg, rg, rg, rg, rg, rg, rg, rg, rg, rg, fL, fD, fL, fD, wS],
  // Row 10: open floor
  [wS, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, wS],
  // Row 11: chairs for workstations 5-8
  [wS, fL, fD, ch, ch, fL, fD, ch, ch, fL, fD, ch, ch, fL, fD, ch, ch, fL, fD, wS],
  // Row 12: bottom row of workstations (seats 5-8, desks on row 12)
  [wS, fD, fL, dT, dT, fD, fL, dT, dT, fD, fL, dT, dT, fD, fL, dT, dT, fD, fL, wS],
  // Row 13: wall edges + bookshelves
  [wS, bs, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, fD, fL, bs, fL, wS],
  // Row 14: bottom wall
  [wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT, wT],
];

// Materialize the grid (call each factory)
const tiles: TileInfo[][] = layoutGrid.map((row) => row.map((factory) => factory()));

/**
 * Seats: 8 workstations arranged in 2 rows of 4.
 *
 * Top row (seats 1-4): chairs at row 3, desks at row 2
 *   Agent sits on chair facing UP toward the desk.
 *
 * Bottom row (seats 5-8): chairs at row 11, desks at row 12
 *   Agent sits on chair facing DOWN toward the desk.
 */
const seats: Seat[] = [
  // Top row - facing up (chair row 3, desk row 2)
  {
    id: 'seat-1',
    tileX: 3,
    tileY: 3,
    deskTileX: 3,
    deskTileY: 2,
    facing: 'up',
  },
  {
    id: 'seat-2',
    tileX: 4,
    tileY: 3,
    deskTileX: 4,
    deskTileY: 2,
    facing: 'up',
  },
  {
    id: 'seat-3',
    tileX: 7,
    tileY: 3,
    deskTileX: 7,
    deskTileY: 2,
    facing: 'up',
  },
  {
    id: 'seat-4',
    tileX: 8,
    tileY: 3,
    deskTileX: 8,
    deskTileY: 2,
    facing: 'up',
  },
  {
    id: 'seat-5',
    tileX: 11,
    tileY: 3,
    deskTileX: 11,
    deskTileY: 2,
    facing: 'up',
  },
  {
    id: 'seat-6',
    tileX: 12,
    tileY: 3,
    deskTileX: 12,
    deskTileY: 2,
    facing: 'up',
  },
  {
    id: 'seat-7',
    tileX: 15,
    tileY: 3,
    deskTileX: 15,
    deskTileY: 2,
    facing: 'up',
  },
  {
    id: 'seat-8',
    tileX: 16,
    tileY: 3,
    deskTileX: 16,
    deskTileY: 2,
    facing: 'up',
  },
  // Bottom row - facing down (chair row 11, desk row 12)
  {
    id: 'seat-9',
    tileX: 3,
    tileY: 11,
    deskTileX: 3,
    deskTileY: 12,
    facing: 'down',
  },
  {
    id: 'seat-10',
    tileX: 4,
    tileY: 11,
    deskTileX: 4,
    deskTileY: 12,
    facing: 'down',
  },
  {
    id: 'seat-11',
    tileX: 7,
    tileY: 11,
    deskTileX: 7,
    deskTileY: 12,
    facing: 'down',
  },
  {
    id: 'seat-12',
    tileX: 8,
    tileY: 11,
    deskTileX: 8,
    deskTileY: 12,
    facing: 'down',
  },
  {
    id: 'seat-13',
    tileX: 11,
    tileY: 11,
    deskTileX: 11,
    deskTileY: 12,
    facing: 'down',
  },
  {
    id: 'seat-14',
    tileX: 12,
    tileY: 11,
    deskTileX: 12,
    deskTileY: 12,
    facing: 'down',
  },
  {
    id: 'seat-15',
    tileX: 15,
    tileY: 11,
    deskTileX: 15,
    deskTileY: 12,
    facing: 'down',
  },
  {
    id: 'seat-16',
    tileX: 16,
    tileY: 11,
    deskTileX: 16,
    deskTileY: 12,
    facing: 'down',
  },
];

export const officeLayout: OfficeLayout = {
  width: 20,
  height: 15,
  tileSize: 16,
  tiles,
  seats,
};

export default officeLayout;
