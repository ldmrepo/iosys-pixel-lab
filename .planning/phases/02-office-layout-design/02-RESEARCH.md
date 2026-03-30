# Phase 2: Office Layout Design - Research

**Researched:** 2026-03-30
**Domain:** office-layout.ts rewrite — 30×24 tile grid, 6-zone classification, furniture placement, walkableMask patterns
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| R1.1 | 맵 크기 20×15 → 30×24로 확장 (480×384px) | Engine auto-fits camera to any OfficeLayout.width/height — just set width:30, height:24 |
| R1.2 | 6개 존 구분 (서버룸, 작업존A, 작업존B, 회의실, 라운지, 로비) | FloorZone type + ZONE_INDEX already defined in types.ts from Phase 1 |
| R1.3 | 각 존에 고유 바닥 타일 컬러/텍스처 적용 | TileInfo.spriteIndex encodes zone; TileMap.getZoneColor() reads it — extend mapping to 6 indices |
| R1.4 | 벽 타일은 전체 외곽 + 서버룸/회의실 내벽 파티션 | wall() helper produces walkable:false, spriteIndex:3 tiles — use same pattern for interior walls |
| R3.1 | 서버룸 — Beds1 네온 서버랙 4~6개, Hospital Misc 모니터링 장비 | SERVER_RACK_* sprites verified; Beds1-Sheet is 256×320 (4×5 grid, 64×64 cells) |
| R3.2 | 작업존 A/B — 데스크 포드, 총 좌석 20~24석 | createPod() generates 4 seats per call; need 5-6 pods = 20-24 seats; zone A + B |
| R3.3 | 회의실 — 대형 테이블 + 의자 6석 + TV + 유리문 + 화이트보드 | DOOR_HOSP_DOUBLE for glass door; need meeting table approach (multi-tile desk) |
| R3.4 | 라운지 — 컬러 소파 2개 + 카펫 + 벽난로 + 커피테이블 + 조명 | CHIMNEY_* sprites (Chimney-Sheet 384×48, 8 sprites 48×48 each) — 3 tiles wide |
| R3.5 | 탕비실 — 냉장고 + 카운터 + 정수기 | kitchen sheet (1152×96 = 12 items at 96px each); WATER_COOLER already defined |
| R3.6 | 로비 — 대기 소파 + 접수 카운터 + 유리 정문 + 대형 식물 | DOOR_HOSP_DOUBLE for lobby entry; sofa from LivingRoom1 row 0 |
| R4.1 | 북벽 창문 7~9개 (Windows-Sheet, 우드/블루/퍼플 교차) | Windows-Sheet 896×64 — 14 windows at 64×64; WINDOW_WOOD and WINDOW_BLUE already mapped |
| R4.2 | 남벽 유리 이중문 (DoorsHospital) | DOOR_HOSP_DOUBLE: sx:0, sy:0, sw:80, sh:80 — fits 5×5 tile footprint |
| R4.3 | 벽면 그림 6~8점 (Paintings + Paintings1) | Paintings-Sheet 320×32 (10 paintings, 32×32 each); Paintings1-Sheet 160×32 (5 paintings) |
| R4.4 | 존 경계에 식물 10~14개 배치 | Flowers-Sheet 384×96 — 12 plants at 32×32 (row 0) and 32×64 (rows 1-2) |
| R6.1 | 식물 — 코너, 복도 끝, 문 옆에 10~14개 | Plant sprite PLANT: {sx:16, sy:0, sw:32, sh:48} — 1×1 tile footprint, walkableMask:[false] |
| R6.2 | 조명 — 라운지 2개, 서버룸 1개, 로비 2개 | Lights-Sheet 384×64 — 6 lamps at 64×64; LAMP and LAMP_BROWN already mapped |
| R6.3 | 카펫 — 회의실 전체, 라운지 중앙 | Carpet-Sheet 320×64 — 5 carpets at 64×64; layer:'wall', walkableMask all true |
| R6.4 | 소파 컬러 — LivingRoom1 11색 중 2~3색 선택 | LivingRoom1-Sheet 384×960 (11 rows × 4 views, 48px row height, 96px sprite width) |
</phase_requirements>

---

## Summary

Phase 2 rewrites `office-layout.ts` from scratch for a 30×24 grid. The existing file uses 20×15; the engine reads `OfficeLayout.width/height` dynamically so simply changing those two constants and rebuilding the tile grid is sufficient for the engine to adapt. Camera auto-fit, PathFinder grid size, and TileMap all derive their dimensions from the layout object at initialization time.

The most critical design challenge is zone boundary definition: each of the 6 zones occupies a rectangular region of the 30×24 grid and must be expressed as correct spriteIndex values on floor tiles. Zone colors (Phase 3) read this spriteIndex, so getting zone assignment right in Phase 2 is essential. Interior partition walls (server room, meeting room) require placing wall() tiles in interior rows and columns.

The second critical challenge is walkableMask correctness. The engine's `cacheMovementTiles()` (src/engine/index.ts:449-464) applies `obj.walkableMask[maskIdx]` to the walk grid; if walkableMask is absent, the mask defaults to `false` (blocking). Every non-carpet furniture object must have an explicit walkableMask. For chairs this is `[true]` (agent sits there). For desks, monitors, server racks, bookshelves it is all `false`. Multi-tile furniture needs a flat array of length `widthTiles * heightTiles`.

**Primary recommendation:** Define zone boundaries as named constants (ZONE_* objects), write a typed tile-builder function per zone, build the 30×24 grid with a nested loop checking zone membership, then place furniture zone by zone using the verified SPRITES coordinates already defined in the current file.

---

## Standard Stack

Phase 2 is pure TypeScript data — no new libraries or dependencies required.

### Core
| Item | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| TypeScript | 5.x (project) | Static typing for layout data | Project standard |
| `src/shared/types.ts` | Phase 1 output | OfficeLayout, TileInfo, FurnitureObject, Seat, FloorZone, ZONE_INDEX | Already defined |
| `src/shared/asset-manifest.ts` | Phase 1 output | 24 registered furnitureSheets | Already defined |

### No New Dependencies
All sprite coordinates, type definitions, and sheet registrations were established in Phase 1. Phase 2 is entirely a data-layout authoring task.

---

## Architecture Patterns

### Recommended File Structure for office-layout.ts

```
1. Imports (types only)
2. Zone boundary constants (ZONE_SERVER, ZONE_WORK_A, etc.)
3. Tile helper functions (wall, floor with zone)
4. 30×24 tile grid builder (nested loop referencing zone constants)
5. SPRITES dictionary (keep all existing entries, add any new ones needed)
6. Furniture builder functions (createPod, createMeetingRoom, etc.)
7. Furniture and seat array construction (by zone)
8. Export
```

### Pattern 1: Zone Boundary Constants

Define each zone as a rectangle. The tile builder loop checks membership.

```typescript
// Exact pixel boundaries for 30-wide × 24-tall grid
// Convention: all coordinates are inclusive [x1..x2, y1..y2]
const ZONE = {
  // Row 0 and row 23 = outer wall. Col 0 and col 29 = outer wall.
  SERVER: { x1: 1,  y1: 1,  x2: 8,  y2: 9  },  // top-left block
  WORK_A: { x1: 9,  y1: 1,  x2: 22, y2: 9  },  // top-right block
  WORK_B: { x1: 1,  y1: 10, x2: 14, y2: 15 },  // mid-left (no internal wall)
  MEETING:{ x1: 15, y1: 10, x2: 22, y2: 15 },  // mid-right block
  LOUNGE: { x1: 1,  y1: 16, x2: 14, y2: 20 },  // bottom-left
  LOBBY:  { x1: 1,  y1: 21, x2: 28, y2: 22 },  // bottom strip
  // Cols 23-28 rows 10-22 = corridor/utility strip on east side
} as const;
```

**Why rectangles:** TileMap.render() iterates every tile; a point-in-rectangle check is O(1) and produces correct spriteIndex for any tile with no extra data structure.

### Pattern 2: Floor Tile Factory with Zone

```typescript
// Source: src/shared/types.ts — TileInfo interface
const floor = (zone: FloorZone): TileInfo => ({
  type: 'floor',
  walkable: true,
  spriteIndex: ZONE_INDEX[zone],
  zone,
});
```

Using `ZONE_INDEX[zone]` ensures the spriteIndex always matches the FloorZone — no magic numbers in the tile grid.

### Pattern 3: createPod() Reuse and Extension

The existing `createPod(sx, sy, prefix)` function is well-designed and should be kept. It produces exactly 4 seats spanning `sx..sx+5, sy..sy+4` tile footprint:
- 2 top desks at `(sx, sy)` and `(sx+3, sy)` — chairs one row below
- 2 bottom desks at `(sx, sy+3)` and `(sx+3, sy+3)` — chairs one row above

**For 20-24 seats** → 5-6 pod calls needed:
- Work Zone A (x:9-22, y:1-9): 3 pods → 12 seats
- Work Zone B (x:1-14, y:10-15): 2-3 pods → 8-12 seats

Missing walkableMask on desks — the existing createPod does NOT set walkableMask on desks. This is the **critical bug** to fix in the rewrite: desks must have `walkableMask: [false, false]` (widthTiles:2, heightTiles:1).

### Pattern 4: Multi-tile Furniture walkableMask

The `walkableMask` is a flat array of length `widthTiles * heightTiles`, row-major order (left-to-right, top-to-bottom):

```typescript
// 2×1 desk — both tiles blocked
{ widthTiles: 2, heightTiles: 1, walkableMask: [false, false] }

// 4×1 sofa — all blocked
{ widthTiles: 4, heightTiles: 1, walkableMask: [false, false, false, false] }

// 4×4 carpet — all walkable (layer:'wall')
{ widthTiles: 4, heightTiles: 4, walkableMask: Array(16).fill(true) }

// 3×1 chimney/fireplace — all blocked
{ widthTiles: 3, heightTiles: 1, walkableMask: [false, false, false] }
```

Source: `src/engine/index.ts:449-464` — `maskIdx = dy * obj.widthTiles + dx`.

### Pattern 5: Interior Partition Walls

Server room and meeting room have partial walls. These are wall() tiles inserted at specific coordinates in the tile grid loop, not via furniture objects:

```typescript
// Server room south wall (partial): y=10, x=1..8 (leaves a 1-tile gap for door)
if (y === 10 && x >= 1 && x <= 7) row.push(wall());
else if (y === 10 && x === 8) row.push(floor('corridor')); // doorway
```

Interior walls must create a closed room boundary; a 1-tile doorway gap allows PathFinder to route through.

### Pattern 6: Wall-Layer Decorations

Carpets and paintings must use `layer: 'wall'` to render below characters. Do NOT omit layer for carpets:

```typescript
// Correct — carpet renders beneath characters
{ id: 'carpet-meeting', type: 'carpet', layer: 'wall',
  walkableMask: Array(widthTiles * heightTiles).fill(true), ... }
```

### Anti-Patterns to Avoid

- **Missing walkableMask:** Any furniture without walkableMask blocks pathing by default (engine line 458 — mask defaults to false). Every non-carpet furniture needs explicit walkableMask.
- **Hard-coding spriteIndex numbers in the grid loop:** Use `ZONE_INDEX[zone]` always, never literal numbers like `spriteIndex: 3`.
- **Placing furniture outside its zone:** A sofa placed at tile (1,1) instead of the lounge zone blocks server room pathfinding.
- **Overlapping furniture footprints:** Two objects sharing a tile causes visual glitches and double-blocking.
- **Tile coordinates out of bounds:** All furniture tileX must be in `[1..28]`, tileY in `[1..22]` (interior only). Wall-layer objects like windows may use tileY=0 or tileY=23.
- **Incorrect seatId linkage:** The `Seat.id` must exactly match the `seatId` field on the corresponding chair FurnitureObject.

---

## Sprite Coordinate Reference (Verified Against Actual Images)

All dimensions verified by reading PNG headers from actual files in `/public/assets/metrocity/`.

### Sheet Dimensions Summary

| Sheet Key | File | Actual Size | Grid |
|-----------|------|-------------|------|
| beds1 | Beds1-Sheet.png | 256×320 | 4×5 @ 64×64 |
| chimney | Chimney-Sheet.png | 384×48 | 8×1 @ 48×48 |
| chimney1 | Chimney1-Sheet.png | 256×32 | 8×1 @ 32×32 |
| livingRoom1 | LivingRoom1-Sheet.png | 384×960 | varies — 96px wide sprites, 48px row height but rows often span 2 rows = 96px total |
| livingRoom | LivingRoom-Sheet.png | 192×96 | 2 objects @ 96×96 |
| kitchen1 | Kitchen1-Sheet.png | 576×96 | 6 items, left 4 = chairs 16×32 each |
| kitchen | Kitchen-Sheet.png | 1152×96 | 12 items @ 96×96 |
| flowers | Flowers-Sheet.png | 384×96 | 12 plants @ 32×32 (top row) |
| carpet | Carpet-Sheet.png | 320×64 | 5 carpets @ 64×64 |
| windows | Windows-Sheet.png | 896×64 | 14 windows @ 64×64 |
| doorsHospital | DoorsHospital-Sheet.png | 800×80 | 10 doors @ 80×80 |
| miscHospital | Miscellaneous-Sheet.png | 3072×64 | many items @ 64×64 |
| tv | TV-Sheet.png | 256×96 | varies |
| lights | Lights-Sheet.png | 384×64 | 6 lamps @ 64×64 |
| paintings | Paintings-Sheet.png | 320×32 | 10 paintings @ 32×32 |
| paintings1 | Paintings1-Sheet.png | 160×32 | 5 paintings @ 32×32 |
| bathroom | Bathroom-Sheet.png | 576×96 | 6 items @ 96×96 |

### LivingRoom1 Sofa Layout (384×960)

LivingRoom1 has 11 sofa colors (rows), each with 4 views (front/single/side/back). Each sprite view is 96px wide × ~96px tall (two 48px sub-rows). Row pitch = 96px vertically.

```
Color index 0 (Light Blue):  sy=0
Color index 1 (Brown):        sy=96
Color index 2 (Blue):         sy=192
Color index 3 (Green):        sy=288
Color index 6 (Cyan):         sy=576
```

For a 4-tile-wide sofa front view:
```typescript
SOFA_GREEN_FRONT:  { sheetId: 'livingRoom1', region: { sx: 0, sy: 288, sw: 96, sh: 96 } },
SOFA_CYAN_FRONT:   { sheetId: 'livingRoom1', region: { sx: 0, sy: 576, sw: 96, sh: 96 } },
SOFA_BLUE_FRONT:   { sheetId: 'livingRoom1', region: { sx: 0, sy: 0,   sw: 96, sh: 96 } },
```

Note: The existing SOFA_FRONT uses `sw:80, sh:48` — this may clip the sprite. The actual per-row sprite height is 96px. This needs validation in Phase 4, but for Phase 2 use `sw:96, sh:96`.

### Kitchen Sheet — Kitchenette Items (1152×96)

Items are 96px wide, spaced horizontally. Confirmed items (approximate order):
```
sx=0:   Cabinet/counter top
sx=96:  Refrigerator
sx=192: Oven/stove
sx=288: Counter sink
sx=384: Shelf unit
sx=480: Cabinet closed
sx=576: Counter variant
...
```
For the kitchenette zone: use `sx=96` (refrigerator), `sx=0` or `sx=288` (counter).

### Additional SPRITES Needed in Phase 2

The following sprites are referenced in Phase 2 requirements but not yet in the SPRITES const block:

```typescript
// Sofa color variants (LivingRoom1-Sheet 384×960)
SOFA_GREEN_FRONT:  { sheetId: 'livingRoom1', region: { sx: 0, sy: 288, sw: 96, sh: 96 } },
SOFA_CYAN_FRONT:   { sheetId: 'livingRoom1', region: { sx: 0, sy: 576, sw: 96, sh: 96 } },

// Kitchen items (Kitchen-Sheet 1152×96)
KITCHEN_FRIDGE:    { sheetId: 'kitchen', region: { sx: 96,  sy: 0, sw: 96, sh: 96 } },
KITCHEN_COUNTER:   { sheetId: 'kitchen', region: { sx: 0,   sy: 0, sw: 96, sh: 96 } },
KITCHEN_SINK:      { sheetId: 'kitchen', region: { sx: 288, sy: 0, sw: 96, sh: 96 } },

// Large TV for meeting room (TV-Sheet 256×96)
TV_LARGE:          { sheetId: 'tv', region: { sx: 128, sy: 0, sw: 128, sh: 96 } },

// Additional paintings for 6-8 total
PAINTING_3: { sheetId: 'paintings',  region: { sx: 128, sy: 0, sw: 32, sh: 32 } },
PAINTING_4: { sheetId: 'paintings',  region: { sx: 192, sy: 0, sw: 32, sh: 32 } },
PAINTING_5: { sheetId: 'paintings1', region: { sx: 0,   sy: 0, sw: 32, sh: 32 } },
PAINTING_6: { sheetId: 'paintings1', region: { sx: 32,  sy: 0, sw: 32, sh: 32 } },

// Additional plants from Flowers-Sheet (384×96)
PLANT_SMALL: { sheetId: 'flowers', region: { sx: 0,   sy: 0, sw: 32, sh: 48 } },
PLANT_LARGE: { sheetId: 'flowers', region: { sx: 48,  sy: 0, sw: 32, sh: 48 } },
PLANT_POT:   { sheetId: 'flowers', region: { sx: 80,  sy: 0, sw: 32, sh: 48 } },

// Window variants (Windows-Sheet 896×64)
WINDOW_PURPLE: { sheetId: 'windows', region: { sx: 192, sy: 0, sw: 64, sh: 64 } },
WINDOW_WHITE:  { sheetId: 'windows', region: { sx: 288, sy: 0, sw: 64, sh: 64 } },

// Lobby/reception desk
RECEPTION_DESK: { sheetId: 'miscHome', region: { sx: 160, sy: 0, sw: 64, sh: 64 } },
// NOTE: miscHome is Miscellaneous-Sheet (home) 640×64 — verify exact position in Phase 4
```

**Confidence on kitchen/TV/reception positions: MEDIUM** — pixel coordinates derived from sheet dimensions and assumed uniform spacing. Must be cross-checked visually in Phase 4.

---

## 30×24 Zone Layout Design

### Zone Coordinate Plan

```
 Col: 0         9          23   28 29
      |         |           |    |  |
Row 0 ██████████████████████████████  outer north wall
Row 1 █[SERVER ROOM 1-8   ][WORK A 9-22     ]█  y=1
...   █[  server zone      ][  work zone A   ]█
Row 9 █[SERVER ROOM 1-8   ][WORK A 9-22     ]█  y=9
Row10 ██████████[partition ]█████████████████  server/meeting south wall
Row10 █[WORK B  1-14][MEETING 15-22][UTIL 23-28]█  y=10
...   █[work zone B ][meeting room ][           ]█
Row15 █[WORK B  1-14][MEETING 15-22][           ]█  y=15
Row16 █[  LOUNGE  1-14     ][UTIL 15-28         ]█  y=16
...   █[  lounge zone       ]                    █
Row20 █[  LOUNGE  1-14     ]                    █  y=20
Row21 █[         LOBBY  1-28                    ]█  y=21
Row22 █[         LOBBY  1-28                    ]█  y=22
Row23 ██████████████████████████████  outer south wall
```

### Proposed Zone Boundaries (in tiles, interior only)

| Zone | x1 | y1 | x2 | y2 | Tiles | Notes |
|------|----|----|----|-----|-------|-------|
| server | 1 | 1 | 8 | 9 | 8×9=72 | top-left; internal south wall at y=10 |
| work (A) | 9 | 1 | 28 | 9 | 20×9=180 | top-right; no internal walls |
| work (B) | 1 | 10 | 14 | 15 | 14×6=84 | mid-left |
| meeting | 15 | 10 | 22 | 15 | 8×6=48 | mid-right; internal walls all 4 sides |
| lounge | 1 | 16 | 14 | 22 | 14×7=98 | lower-left |
| lobby | 15 | 16 | 28 | 22 | 14×7=98 | lower-right + south entry |
| (east util) | 23 | 10 | 28 | 15 | 6×6=36 | corridor/kitchenette — use 'corridor' |

**Interior partition walls:**
- Server room south wall: `y=10, x=1..8` (wall tiles), gap at `x=8` for door
- Meeting room border: `y=10 and y=16, x=15..22`; `x=15 and x=22, y=10..15`
  - North door gap: `x=18..19, y=10`
  - South door gap: `x=18..19, y=16`

### Zone Color Assignments (for Phase 3 TileMap)

| spriteIndex | Zone | Color Name | Hex |
|-------------|------|-----------|-----|
| 0 | corridor / lobby | light oak | `#c4a882` |
| 1 | work | medium brown | `#a0744a` |
| 2 | lounge | warm mid-tone | `#b8895a` |
| 3 | server | dark navy tile | `#1a2540` |
| 4 | meeting | soft green | `#4a6a4a` |
| 5 | (kitchenette) | light beige | `#d4c0a0` |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Walkability grid from furniture | Custom boolean[][] builder | Engine's `cacheMovementTiles()` in index.ts | Already handles furniture mask application; just supply correct walkableMask per object |
| Zone color lookup | Hard-coded color arrays | ZONE_INDEX + TileInfo.spriteIndex + TileMap.getZoneColor() | Already wired; Phase 3 extends the switch statement |
| Path routing | Custom A* or flood fill | PathFinder.findPath() (BFS) | Already handles 30×24; no changes needed for Phase 2 |
| Sprite sheet loading | Manual Image() loading | ObjectRenderer.loadSheets() | Already handles all 24 sheets; just register furniture correctly |
| Camera fitting | Manual zoom calculation | Engine's auto-fit in initialize() (index.ts:350-355) | Reads worldSize from layout; will auto-fit 30×24 |

---

## Common Pitfalls

### Pitfall 1: Missing walkableMask Blocks All Pathing
**What goes wrong:** If walkableMask is absent on a furniture object, `cacheMovementTiles()` applies `false` to every tile in the object's footprint. A 2×1 desk without walkableMask blocks 2 tiles permanently, making chairs unreachable.
**Why it happens:** The engine defaults missing mask to `false` (line 458: `const isWalkable = obj.walkableMask ? obj.walkableMask[maskIdx] : false`).
**How to avoid:** Every furniture push must include `walkableMask`. Required values:
  - Chair: `[true]` — agent sits on this tile
  - Desk (2×1): `[false, false]`
  - Monitor on desk: `[false, false]`
  - Server rack (2×4): `Array(8).fill(false)`
  - Sofa (4×1 or 6×1): all false
  - Carpet: all true
  - Plant (1×1): `[false]`
  - Window/door (wall layer): walkableMask optional (wall tiles already non-walkable)
**Warning signs:** Agents spawn then immediately report "No path found" in console.

### Pitfall 2: Furniture Tile Coordinates Outside Zone Boundaries
**What goes wrong:** A piece of furniture placed at tileX:8, tileY:3 (server room zone) overlaps a work zone seat, or a desk at tileX:22 blocks the meeting room doorway.
**How to avoid:** For each furniture object, verify `tileX >= zone.x1 && tileX + widthTiles - 1 <= zone.x2` and same for Y. Leave at least 1 tile clearance around door gaps.

### Pitfall 3: Tile Grid Dimensions Must Be Exactly 30×24
**What goes wrong:** The engine reads `layout.width` and `layout.height` for all bounds checks (PathFinder, TileMap culling, camera fit). If the grid array has wrong length (e.g., 20 rows or 15 columns), PathFinder returns empty paths.
**How to avoid:** The outer loop must be `for (let y = 0; y < 24; y++)` and inner `for (let x = 0; x < 30; x++)`. After construction: `tiles.length === 24` and `tiles[0].length === 30`.

### Pitfall 4: seatId Mismatch Between Seat and Chair
**What goes wrong:** If a chair's `seatId: 's5'` does not match any `Seat.id`, the engine's `CharacterBehavior` cannot assign agents to that seat. The agent wanders but never settles.
**How to avoid:** Use the `seatId` counter pattern from existing `createPod`. The `Seat.id` and chair's `seatId` must be the same string. Do not reuse IDs.

### Pitfall 5: Partitions Without Door Gaps Isolate Zones
**What goes wrong:** A continuous wall row across the server room's south boundary makes all server zone tiles unreachable from the rest of the map. PathFinder returns [] for any cross-zone path.
**How to avoid:** Every enclosed zone must have at least one 1-tile gap in every wall segment that borders another zone. The gap tile must be `floor()`, not `wall()`.

### Pitfall 6: Chimney Sprite Is 3 Tiles Wide (48px = 3 tiles at 16px/tile)
**What goes wrong:** Placing a Chimney sprite with `widthTiles:1` clips the sprite visually and causes incorrect walkableMask coverage.
**Why it happens:** Chimney-Sheet sprites are 48×48px; at 16px/tile that is exactly 3 tiles wide and 3 tiles tall.
**How to avoid:** `widthTiles: 3, heightTiles: 3, walkableMask: Array(9).fill(false)`.

### Pitfall 7: DoorsHospital Sprites Are 5×5 Tiles
**What goes wrong:** DOOR_HOSP_DOUBLE is 80×80px = 5×5 tiles at 16px/tile. Placing it as `widthTiles:2` either clips it or it overlaps adjacent tiles unexpectedly.
**How to avoid:** Use `widthTiles: 5, heightTiles: 5, layer: 'wall'`. The door's tile in the wall row must have a 5-tile wide gap.

### Pitfall 8: Server Racks Are 4×4 Tiles (64px at 16px/tile)
**What goes wrong:** Server racks from Beds1-Sheet are 64×64px = 4×4 tiles. A server room 8 tiles wide (x:1-8) can fit exactly 2 server racks side by side with no leftover space.
**How to avoid:** Place server racks at `widthTiles:4, heightTiles:4`, stagger them with 1-tile walkable aisle between rows. With 8-wide × 9-tall server room: 2 racks per row × 2 rows = 4 racks with 1-tile aisle.

---

## Code Examples

### Zone Boundary Definitions
```typescript
// Source: derived from 30×24 grid design above
const ZONES = {
  server:  { x1: 1,  y1: 1,  x2: 8,  y2: 9  },
  workA:   { x1: 9,  y1: 1,  x2: 28, y2: 9  },
  workB:   { x1: 1,  y1: 10, x2: 14, y2: 15 },
  meeting: { x1: 15, y1: 10, x2: 22, y2: 15 },
  lounge:  { x1: 1,  y1: 16, x2: 14, y2: 22 },
  lobby:   { x1: 15, y1: 16, x2: 28, y2: 22 },
} as const;
```

### Tile Grid Construction Pattern
```typescript
// Source: extension of existing pattern in office-layout.ts
import { ZONE_INDEX } from './types';

for (let y = 0; y < 24; y++) {
  const row: TileInfo[] = [];
  for (let x = 0; x < 30; x++) {
    // Outer walls
    if (y === 0 || y === 23 || x === 0 || x === 29) {
      row.push(wall());
    }
    // Server room south partition wall (gap at x=7 for doorway)
    else if (y === 10 && x >= 1 && x <= 6) {
      row.push(wall());
    }
    // Meeting room walls (gaps for doors)
    else if ((y === 10 || y === 16) && x >= 15 && x <= 22 && !(x >= 18 && x <= 19)) {
      row.push(wall());
    }
    else if ((x === 15 || x === 22) && y >= 10 && y <= 16) {
      row.push(wall());
    }
    // Floor zones
    else if (x >= ZONES.server.x1 && x <= ZONES.server.x2 && y >= ZONES.server.y1 && y <= ZONES.server.y2) {
      row.push({ type: 'floor', walkable: true, spriteIndex: ZONE_INDEX.server, zone: 'server' });
    }
    // ... etc for each zone
    else {
      row.push({ type: 'floor', walkable: true, spriteIndex: ZONE_INDEX.corridor, zone: 'corridor' });
    }
  }
  tiles.push(row);
}
```

### Extended createPod with walkableMask Fix
```typescript
// Key fix: add walkableMask to desk and monitor objects
function createPod(sx: number, sy: number, prefix: string) {
  for (let i = 0; i < 2; i++) {
    const dx = sx + i * 3;
    // Top desk
    furniture.push({
      id: `desk-${prefix}-top-${i}`, type: 'desk',
      tileX: dx, tileY: sy, widthTiles: 2, heightTiles: 1,
      walkableMask: [false, false],          // ← REQUIRED FIX
      sprite: SPRITES.DESK_TOP, drawOffsetY: -16
    });
    // ... rest unchanged
  }
}
```

### Server Rack Placement
```typescript
// Server room: x1=1, y1=1, rack at cols 1-4 and 5-8
// Row 1: 2 racks (y=1, widthTiles:4, heightTiles:4)
furniture.push({
  id: 'rack-0', type: 'server-rack',
  tileX: 1, tileY: 1, widthTiles: 4, heightTiles: 4,
  walkableMask: Array(16).fill(false),
  sprite: SPRITES.SERVER_RACK_PURPLE, drawOffsetY: -48
});
furniture.push({
  id: 'rack-1', type: 'server-rack',
  tileX: 5, tileY: 1, widthTiles: 4, heightTiles: 4,
  walkableMask: Array(16).fill(false),
  sprite: SPRITES.SERVER_RACK_BLUE, drawOffsetY: -48
});
// Aisle at y=5 (walkable). Row 2 racks at y=6:
furniture.push({ id: 'rack-2', type: 'server-rack', tileX: 1, tileY: 6, ... });
furniture.push({ id: 'rack-3', type: 'server-rack', tileX: 5, tileY: 6, ... });
```

### Chimney (3×3 tile footprint)
```typescript
furniture.push({
  id: 'fireplace-1', type: 'fireplace',
  tileX: 11, tileY: 16, widthTiles: 3, heightTiles: 3,
  walkableMask: Array(9).fill(false),
  sprite: SPRITES.CHIMNEY_0, drawOffsetY: -16
});
```

---

## Engine Compatibility Analysis

### Camera (no changes needed in Phase 2)
The engine's `initialize()` auto-fits camera zoom to the world size:
```typescript
// src/engine/index.ts:350-355
const zoomX = (this.camera.viewportWidth * padding) / worldSize.width;
const zoomY = (this.camera.viewportHeight * padding) / worldSize.height;
```
`worldSize` = `{width: 30*16=480, height: 24*16=384}`. At a typical 800×600 viewport, zoomX≈1.5 and zoomY≈1.4 → fitZoom≈1.4. The entire map fits in viewport without scrolling. No camera changes required in Phase 2.

### PathFinder (no changes needed)
PathFinder takes `width` and `height` from `tileMap.getGridSize()`, which reads from `layout.width/height`. Increasing to 30×24 = 720 cells; BFS on 720 cells is O(720) — negligible. No changes.

### TileMap (Phase 3 concern, document here)
TileMap.getZoneColor() currently handles only spriteIndex 0, 1, 2. With 6 zones, indices 0-5 are needed. Phase 2 can safely write spriteIndex:3, 4, 5 into tile data — the TileMap default case (`default: return '#a0744a'`) handles unknown indices gracefully. Phase 3 extends the switch statement.

### walkableMask Critical Path
Phase 2 owns the `walkableMask` for every furniture object. Phase 3 does NOT change walkableMask. If any furniture is missing walkableMask in Phase 2, Phase 5 will report seat assignment failures. This is the highest-risk item in Phase 2.

---

## Seat Count Math

Target: 20-24 seats. `createPod()` produces 4 seats per call.

| Configuration | Pods | Seats |
|---------------|------|-------|
| 5 pods (3 Zone A + 2 Zone B) | 5 | 20 |
| 6 pods (3 Zone A + 3 Zone B) | 6 | 24 |

**Recommended: 6 pods = 24 seats** (upper bound of target range).

Zone A (x:9-28, y:1-9 = 20×9 interior space):
- Pod A1 at (10, 2), Pod A2 at (16, 2), Pod A3 at (22, 2) — 3 pods fitting within x:9-28

Zone B (x:1-14, y:10-15 = 14×6 interior space):
- Pod B1 at (2, 11), Pod B2 at (8, 11) — 2 pods
- Or 3 pods if space permits: B3 at (2, 15) — but y:15 may conflict with meeting room wall

**With 5 pods = 20 seats**, verify no pod footprint (5×4 tiles) overlaps internal partition walls.

---

## Open Questions

1. **LivingRoom1 exact sprite layout for colored sofas**
   - What we know: Sheet is 384×960, 11 color rows × 4 views (96px wide per view, 96px tall per row)
   - What's unclear: Exact column offsets for front/side/back views; whether front view is sx=0 or different
   - Recommendation: Use front view (sx=0) for all sofa placements; Phase 4 will validate and correct offsets

2. **Meeting room table — no multi-tile conference table sprite exists in current sheets**
   - What we know: Kitchen1-Sheet has 2-tile wide desks; no 4+ tile conference table exists in any registered sheet
   - What's unclear: Should we use multiple 2-tile desks in a row to simulate a conference table, or use a different approach?
   - Recommendation: Use 3 × DESK_TOP placed contiguously (x, x+2, x+4) to create a 6-tile-wide meeting table appearance; mark the whole row with walkableMask all false

3. **Reception desk exact sprite coordinates in Miscellaneous-Sheet (Home)**
   - What we know: Miscellaneous-Sheet (home) is 640×64 — approximately 10 items at 64px each
   - What's unclear: Which item is the reception counter vs toy/table
   - Recommendation: In Phase 2, use a KITCHEN_COUNTER (Kitchen-Sheet sx=0) as reception desk placeholder; Phase 4 investigates Miscellaneous-Sheet layout visually

4. **Kitchen (kitchenette) zone not in Requirements**
   - What we know: R3.5 mentions 탕비실 (kitchenette: fridge + counter + water cooler); no zone boundary was defined for it
   - What's unclear: Whether kitchenette is a sub-area within an existing zone or needs its own zone
   - Recommendation: Place kitchenette items in the east utility strip (x:23-28, y:10-15), classify as 'corridor' zone; no separate FloorZone needed

---

## Validation Architecture

> `workflow.nyquist_validation` not set in config.json — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript compiler (tsc) — no dedicated unit test framework detected |
| Config file | tsconfig.json (root) |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck` |

No test files were found in the repository. The acceptance criteria for Phase 2 is entirely structural/data:
- Tile grid dimensions are exactly 30×24
- Total seats count is 20-24
- All furniture objects have walkableMask defined
- TypeScript compiles without errors

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R1.1 | officeLayout.width===30 && height===24 | manual assertion | `npm run typecheck` then inspect export | Wave 0 |
| R1.2 | 6 distinct zone values on tile grid | manual assertion | inspect tile array | Wave 0 |
| R1.3 | spriteIndex 0-5 used on correct zones | manual assertion | inspect tiles | Wave 0 |
| R1.4 | wall tiles at outer border + server/meeting partitions | manual assertion | inspect tiles | Wave 0 |
| R3.2 | seats.length in [20,24] | manual assertion | log seats.length at runtime | Wave 0 |
| R5.2 | every furniture has walkableMask | manual assertion | `officeLayout.furniture.every(f => f.walkableMask !== undefined)` | Wave 0 |
| AC | typecheck passes | automated | `npm run typecheck` | exists |

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck` + visual inspection via `npm run dev`
- **Phase gate:** `npm run typecheck` passes + all seats count verified before proceeding to Phase 3

### Wave 0 Gaps
- [ ] No dedicated test file exists — acceptance criteria are verified manually at runtime via browser console
- [ ] Consider adding a runtime assertion function in office-layout.ts (or a scripts/ file) that checks: grid size, seat count, walkableMask coverage

---

## Sources

### Primary (HIGH confidence)
- `src/engine/index.ts` — engine initialization, cacheMovementTiles(), camera auto-fit
- `src/engine/TileMap.ts` — zone color mapping, tile rendering
- `src/engine/ObjectRenderer.ts` — walkableMask application, sprite drawing
- `src/engine/PathFinder.ts` — BFS grid size handling
- `src/shared/types.ts` — OfficeLayout, TileInfo, FurnitureObject, FloorZone, ZONE_INDEX
- `src/shared/office-layout.ts` — createPod(), SPRITES, existing layout patterns
- PNG header bytes — actual sprite sheet dimensions (256×320, 384×960, 800×80, etc.)

### Secondary (MEDIUM confidence)
- `.planning/research/ASSET-INVENTORY.md` — sofa color palette, server rack palette
- `.planning/phases/01-type-manifest-expansion/01-01-SUMMARY.md` — Phase 1 deliverables

### Tertiary (LOW confidence)
- Kitchen-Sheet item positions (approximate, not visually verified — Phase 4 must validate)
- LivingRoom1 sofa view column positions (assumed 96px per view — Phase 4 must validate)
- Reception desk sprite position in Miscellaneous-Sheet (estimated)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all types, manifests, and sprite coordinates read from actual code files
- Zone layout: HIGH — derived from 30×24 grid math with clear zone rectangles
- Sprite dimensions: HIGH — all verified via PNG header byte-reading
- Furniture placement coordinates: MEDIUM — zone boundaries are correct; specific tileX/tileY values within zones require care to avoid overlaps
- Kitchen/sofa sprite offsets: LOW — approximate; Phase 4 visual validation required

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable, no external dependencies)
