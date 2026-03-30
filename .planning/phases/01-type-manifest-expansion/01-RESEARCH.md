# Phase 1: Type & Manifest Expansion - Research

**Researched:** 2026-03-30
**Domain:** TypeScript type extension + MetroCity CC0 sprite sheet registration
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| R1.2 | 6개 존 구분 (서버룸, 작업존A, 작업존B, 회의실, 라운지, 로비) | FloorZone union type + TileInfo.spriteIndex numeric encoding (0-5) |
| R2.1 | 미사용 시트 8종 등록 (Beds1, DoorsHospital, TilesHospital, Chimney, Chimney1, Bathroom, Beds, BedHospital) | All 8 files confirmed present at correct public/assets paths |
| R2.2 | 각 시트의 스프라이트 region 좌표 정확히 매핑 | PNG dimensions verified; grid sizes computed and cross-checked visually |
| R2.3 | 기존 시트의 미사용 스프라이트도 활용 가능하도록 SPRITES 확장 | Current SPRITES const covers subset only; new entries needed for server rack, chimney, door variants |
</phase_requirements>

---

## Summary

Phase 1 is a pure TypeScript authoring task: no build system changes, no runtime changes, no new files outside `src/shared/`. It has two deliverables — a new `FloorZone` type in `types.ts` and eight new `furnitureSheets` entries plus expanded `SPRITES` constants in `asset-manifest.ts` / `office-layout.ts`.

The current `TileInfo.spriteIndex: number` field already acts as a zone discriminator (0=corridor, 1=work, 2=lounge). Extending this pattern to 6 zones (0-5) requires adding a `FloorZone` union type and optionally a `zone?: FloorZone` field to `TileInfo`, while keeping `spriteIndex` for backward compatibility with `TileMap.getZoneColor()`. The planner can choose either approach — both are type-safe and backward compatible.

All eight target sprite sheets are confirmed present in `public/assets/metrocity/Interior/` and their PNG dimensions have been measured directly from file headers. Sprite grid sizes and region coordinates have been derived from dimensions plus visual inspection of the actual images. The coordinates documented here are HIGH-confidence for uniform-grid sheets (Beds1, Beds, Chimney, Chimney1, BedHospital, DoorsHospital); MEDIUM-confidence for the non-uniform Bathroom sheet (items appear mixed-width); and HIGH-confidence for TilesHospital as a 16px tile grid.

**Primary recommendation:** Add `FloorZone` as a string union type, add `zone?: FloorZone` to `TileInfo` as an optional field (preserving `spriteIndex`), and register all 8 sheets in `asset-manifest.ts` with documented region coordinates in a new SPRITES block in `office-layout.ts`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^6.0.2 (project) | Type definitions | Already in use; `npm run typecheck` is the success gate |

No new libraries needed for Phase 1. This phase is pure source authoring.

**Version verification:** `tsconfig.json` has `"ignoreDeprecations": "6.0"` confirming TypeScript 6 is in use.

---

## Architecture Patterns

### How Zone Identity Currently Works

`TileInfo.spriteIndex` encodes zone as an integer:

```typescript
// src/shared/office-layout.ts (current)
const corr   = (): TileInfo => ({ type: 'floor', walkable: true, spriteIndex: 0 }); // corridor
const work   = (): TileInfo => ({ type: 'floor', walkable: true, spriteIndex: 1 }); // work zone
const lounge = (): TileInfo => ({ type: 'floor', walkable: true, spriteIndex: 2 }); // lounge
```

`TileMap.getZoneColor(spriteIndex)` switches on this integer. Phase 3 will expand this to 6 colors, but Phase 1 only needs to define the type contract.

### Pattern 1: FloorZone as String Union + Numeric Mapping

**What:** Define `FloorZone` as a `'corridor' | 'work' | 'lounge' | 'server' | 'meeting' | 'lobby'` union. Add `zone?: FloorZone` to `TileInfo`. The numeric `spriteIndex` is preserved for the engine's switch statement.

**When to use:** When downstream code (Phase 2/3) needs to query zone by name, not index.

```typescript
// src/shared/types.ts — addition
export type FloorZone = 'corridor' | 'work' | 'lounge' | 'server' | 'meeting' | 'lobby';

// TileInfo extended (backward compatible — zone is optional)
export interface TileInfo {
  type: 'floor' | 'wall';
  walkable: boolean;
  spriteIndex: number;
  zone?: FloorZone;            // NEW: human-readable zone label
}

// Canonical zone → spriteIndex mapping (for TileMap.getZoneColor)
export const ZONE_INDEX: Record<FloorZone, number> = {
  corridor: 0,
  work:     1,
  lounge:   2,
  server:   3,
  meeting:  4,
  lobby:    5,
};
```

**Phase 2 usage:** tile helper functions will set both fields:
```typescript
const server = (): TileInfo => ({ type: 'floor', walkable: true, spriteIndex: 3, zone: 'server' });
```

### Pattern 2: FurnitureSpriteSheet Registration

Current pattern in `asset-manifest.ts`:
```typescript
furnitureSheets: {
  beds1: { url: '/assets/metrocity/Interior/Home/Beds1-Sheet.png', name: 'Server Racks' },
  // ...
}
```

`FurnitureSpriteSheet` type (`src/shared/types.ts` line 67-69) only holds `url` and `name` — no frame size metadata. This is intentional: the engine uses `SpriteRegion` on individual `FurnitureObject.sprite` references, not sheet-level frame dimensions. Phase 1 just registers the sheet URL.

### Pattern 3: SPRITES Constants Block

Current `SPRITES` block in `office-layout.ts` defines named sprite references as `{ sheetId, region }` objects. Phase 1 extends this block with entries for the 8 new sheets. These constants are consumed by Phase 2 (office-layout) and Phase 4 (ObjectRenderer).

```typescript
// Example new entries (Phase 1 adds to SPRITES const)
SERVER_RACK_BLUE:    { sheetId: 'beds1',         region: { sx:  0, sy:  0, sw: 64, sh: 64 } },
SERVER_RACK_CYAN:    { sheetId: 'beds1',         region: { sx:  0, sy: 64, sw: 64, sh: 64 } },
SERVER_RACK_GREEN:   { sheetId: 'beds1',         region: { sx:  0, sy:128, sw: 64, sh: 64 } },
CHIMNEY_MODERN:      { sheetId: 'chimney',       region: { sx:  0, sy:  0, sw: 48, sh: 48 } },
CHIMNEY_CLASSIC:     { sheetId: 'chimney1',      region: { sx:  0, sy:  0, sw: 32, sh: 32 } },
DOOR_HOSPITAL_DBL:   { sheetId: 'doorsHospital', region: { sx:  0, sy:  0, sw: 80, sh: 80 } },
DOOR_HOSPITAL_SGL:   { sheetId: 'doorsHospital', region: { sx:480, sy:  0, sw: 80, sh: 80 } },
```

### Recommended File Changes

```
src/shared/
├── types.ts          — ADD: FloorZone union type, ZONE_INDEX const, zone? field in TileInfo
└── asset-manifest.ts — ADD: 8 new furnitureSheets entries
src/shared/
└── office-layout.ts  — ADD: new SPRITES entries for all 8 sheets (R2.3)
```

**Note:** `office-layout.ts` is in `src/shared/` but marked as `asset-preparer` territory in CLAUDE.md. The SPRITES constants block at the top of this file is the correct place for R2.3 sprite region documentation.

### Anti-Patterns to Avoid

- **Adding frameWidth/frameHeight to FurnitureSpriteSheet:** The existing type doesn't have these fields. Frame dimensions live in `SpriteRegion.sw`/`sh` on each sprite reference. Do not change the type contract.
- **Changing spriteIndex to a string:** Engine code in `TileMap.ts` uses numeric switch. Keep `spriteIndex: number`.
- **Defining FloorZone as a numeric enum:** A string union is more readable in layout code and debuggable in the browser. The integer encoding is already handled by `ZONE_INDEX`.
- **Moving SPRITES const out of office-layout.ts:** Phase 2 will use it from the same file. Keeping co-location reduces import complexity.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Zone-to-color mapping | Custom lookup class | `ZONE_INDEX` const + TileMap switch | Already working, Phase 3 extends it |
| Sprite coordinate calculation | Runtime pixel math | Hardcoded `SpriteRegion` constants verified from image | Coordinates are static; runtime calculation adds fragility |
| Asset path construction | Dynamic URL builder | Literal string constants in furnitureSheets | Vite serves static paths; dynamic construction breaks typecheck |

**Key insight:** All sprite regions in this codebase are static constants verified against actual image files. There is no sprite atlas JSON; coordinates must be measured from images and hardcoded. The SPRITES block is the project's authoritative coordinate registry.

---

## Common Pitfalls

### Pitfall 1: Off-by-One on Chimney1 Sprite Size

**What goes wrong:** Chimney1-Sheet is 256x32. If coded as 8 sprites at 32x32 each (32*8=256), the last sprite sits at sx=224, sy=0 — correct. But if a developer mistakes the sheet height (32px) for the sprite height being smaller, e.g. 16px, 16 sprites are generated and most are empty rows.

**Why it happens:** The sheet height equals one sprite height exactly; the grid is 8 columns × 1 row.

**How to avoid:** Always verify: `cols = width / spriteWidth`, `rows = height / spriteHeight`. For Chimney1: 256/32=8 cols, 32/32=1 row.

**Warning signs:** `spriteIndex` values > 7 on Chimney1 produce blank/garbage renders.

### Pitfall 2: Chimney-Sheet Sprite Size Confusion

**What goes wrong:** Chimney-Sheet is 384x48 with 8 sprites at 48x48. A developer might use 64x64 (standard for Beds1) and get 6 sprites cut wrong.

**Why it happens:** Unlike most sheets that use 64px, Chimney uses 48px grid.

**How to avoid:** Each sheet has its own grid size — verify independently. Chimney: 384/8=48px wide, 48/1=48px tall.

### Pitfall 3: Treating TilesHospital as a Furniture Sheet

**What goes wrong:** TilesHospital.png (320x256) contains floor tile patterns, not furniture objects. If registered and used as furniture sprites, tiles will appear floating in the object layer at wrong scales.

**Why it happens:** The sheet is registered in `furnitureSheets` for accessibility but its contents are floor tile textures.

**How to avoid:** Phase 2/3 should use TilesHospital tiles as `spriteIndex`-based floor tile references, not `FurnitureObject.sprite` references. Phase 1 registration is correct; the usage restriction belongs in Phase 3 docs.

### Pitfall 4: TypeScript strict mode with optional zone field

**What goes wrong:** Code in `TileMap.ts` line 136 reads `tile.spriteIndex` directly. If `zone` field is added as a required (not optional) field, the engine's fallback tile construction at `src/engine/index.ts:94-97` will fail typecheck because it only sets `{ type, walkable, spriteIndex }`.

**Why it happens:** Engine fallback code constructs TileInfo inline without the new field.

**How to avoid:** Declare `zone?: FloorZone` (optional). The existing engine fallback code at `src/engine/index.ts:94-97` must remain valid under `strict: true`.

**Warning signs:** `npm run typecheck` fails with "Property 'zone' is missing" after adding the field.

### Pitfall 5: DoorsHospital Scale Mismatch

**What goes wrong:** DoorsHospital sprites are 80×80px, but current door sprites (Doors-Sheet) in use are 64×80px. If a developer copies the existing door SPRITE definition and uses 64×80 for DoorsHospital, the sprite will be clipped wrong.

**Why it happens:** Two different door sheets use different widths: `Doors-Sheet` sprites appear at 64px wide, DoorsHospital uses a 80px grid.

**How to avoid:** Use `sw: 80, sh: 80` for all DoorsHospital entries.

---

## Code Examples

Verified patterns from actual source files:

### Extending types.ts with FloorZone

```typescript
// src/shared/types.ts — additions after existing TileInfo block

export type FloorZone = 'corridor' | 'work' | 'lounge' | 'server' | 'meeting' | 'lobby';

/** Maps zone name to numeric spriteIndex used by TileMap.getZoneColor() */
export const ZONE_INDEX: Record<FloorZone, number> = {
  corridor: 0,
  work:     1,
  lounge:   2,
  server:   3,
  meeting:  4,
  lobby:    5,
};

// Modified TileInfo — zone is optional for backward compatibility
export interface TileInfo {
  type: 'floor' | 'wall';
  walkable: boolean;
  spriteIndex: number;
  zone?: FloorZone;   // added in Phase 1
}
```

### Registering 8 new sheets in asset-manifest.ts

```typescript
// src/shared/asset-manifest.ts — add to furnitureSheets object
beds1:          { url: '/assets/metrocity/Interior/Home/Beds1-Sheet.png',             name: 'Server Racks' },
doorsHospital:  { url: '/assets/metrocity/Interior/Hospital/DoorsHospital-Sheet.png', name: 'Hospital Doors' },
tilesHospital:  { url: '/assets/metrocity/Interior/Hospital/TilesHospital.png',       name: 'Hospital Tiles' },
chimney:        { url: '/assets/metrocity/Interior/Home/Chimney-Sheet.png',           name: 'Modern Chimneys' },
chimney1:       { url: '/assets/metrocity/Interior/Home/Chimney1-Sheet.png',          name: 'Classic Chimneys' },
bathroom:       { url: '/assets/metrocity/Interior/Home/Bathroom-Sheet.png',          name: 'Bathroom' },
beds:           { url: '/assets/metrocity/Interior/Home/Beds-Sheet.png',              name: 'Beds' },
bedHospital:    { url: '/assets/metrocity/Interior/Hospital/BedHospital-Sheet.png',   name: 'Hospital Beds' },
```

### SPRITES expansion for R2.3

```typescript
// src/shared/office-layout.ts — additions to SPRITES const

// ── Server Racks (Beds1-Sheet 256×320, 4×5 grid at 64×64) ──
// Row 0: purple-dark rack, blue rack, cyan rack, red-dark rack
// Row 1: blue-neon variants
// Row 2: green-neon variants
// Row 3: cyan+multi variants
// Row 4: dark/stealth variants
SERVER_RACK_PURPLE: { sheetId: 'beds1', region: { sx:   0, sy:   0, sw: 64, sh: 64 } },
SERVER_RACK_BLUE:   { sheetId: 'beds1', region: { sx:  64, sy:   0, sw: 64, sh: 64 } },
SERVER_RACK_CYAN:   { sheetId: 'beds1', region: { sx: 128, sy:   0, sw: 64, sh: 64 } },
SERVER_RACK_RED:    { sheetId: 'beds1', region: { sx: 192, sy:   0, sw: 64, sh: 64 } },
SERVER_RACK_GREEN:  { sheetId: 'beds1', region: { sx:   0, sy: 128, sw: 64, sh: 64 } },

// ── Chimneys (Chimney-Sheet 384×48, 8 sprites at 48×48) ──
CHIMNEY_GREY_0:  { sheetId: 'chimney', region: { sx:   0, sy: 0, sw: 48, sh: 48 } },
CHIMNEY_GREY_1:  { sheetId: 'chimney', region: { sx:  48, sy: 0, sw: 48, sh: 48 } },
CHIMNEY_GREY_2:  { sheetId: 'chimney', region: { sx:  96, sy: 0, sw: 48, sh: 48 } },
CHIMNEY_GREY_3:  { sheetId: 'chimney', region: { sx: 144, sy: 0, sw: 48, sh: 48 } },
// (add _4 through _7 for full coverage)

// ── Classic Chimneys (Chimney1-Sheet 256×32, 8 sprites at 32×32) ──
CHIMNEY1_BROWN_0: { sheetId: 'chimney1', region: { sx:   0, sy: 0, sw: 32, sh: 32 } },
CHIMNEY1_BROWN_1: { sheetId: 'chimney1', region: { sx:  32, sy: 0, sw: 32, sh: 32 } },
// (add _2 through _7 for full coverage)

// ── Hospital Doors (DoorsHospital-Sheet 800×80, 10 sprites at 80×80) ──
// col 0: amber double-door (glass window)
// col 1-2: metal frames open
// col 3-4: slim frames/handles
// col 5: frame+handle open
// col 6-7: single amber door with window
// col 8: small amber door
// col 9: empty/frame
DOOR_HOSP_DOUBLE:  { sheetId: 'doorsHospital', region: { sx:   0, sy: 0, sw: 80, sh: 80 } },
DOOR_HOSP_FRAME_L: { sheetId: 'doorsHospital', region: { sx:  80, sy: 0, sw: 80, sh: 80 } },
DOOR_HOSP_FRAME_R: { sheetId: 'doorsHospital', region: { sx: 160, sy: 0, sw: 80, sh: 80 } },
DOOR_HOSP_SINGLE:  { sheetId: 'doorsHospital', region: { sx: 480, sy: 0, sw: 80, sh: 80 } },
DOOR_HOSP_SGL_SML: { sheetId: 'doorsHospital', region: { sx: 640, sy: 0, sw: 80, sh: 80 } },

// ── Bathroom (Bathroom-Sheet 576×96, 6 items at ~96×96) ──
// NOTE: Item widths may not be uniform — verify visually in Phase 4
BATHROOM_SINK:    { sheetId: 'bathroom', region: { sx:   0, sy: 0, sw: 96, sh: 96 } },
BATHROOM_DISPENS: { sheetId: 'bathroom', region: { sx:  96, sy: 0, sw: 96, sh: 96 } },
BATHROOM_BATHTUB: { sheetId: 'bathroom', region: { sx: 192, sy: 0, sw: 96, sh: 96 } },
BATHROOM_CABINET: { sheetId: 'bathroom', region: { sx: 288, sy: 0, sw: 96, sh: 96 } },
BATHROOM_MAT:     { sheetId: 'bathroom', region: { sx: 384, sy: 0, sw: 96, sh: 96 } },
BATHROOM_SHELF:   { sheetId: 'bathroom', region: { sx: 480, sy: 0, sw: 96, sh: 96 } },

// ── Hospital Beds (BedHospital-Sheet 128×64, 2 sprites at 64×64) ──
BED_HOSPITAL_0: { sheetId: 'bedHospital', region: { sx:  0, sy: 0, sw: 64, sh: 64 } },
BED_HOSPITAL_1: { sheetId: 'bedHospital', region: { sx: 64, sy: 0, sw: 64, sh: 64 } },

// ── Beds (Beds-Sheet 256×256, 4×4 grid at 64×64) ──
BED_0_0: { sheetId: 'beds', region: { sx:   0, sy:   0, sw: 64, sh: 64 } },
BED_0_1: { sheetId: 'beds', region: { sx:  64, sy:   0, sw: 64, sh: 64 } },
// (add remaining 14 as needed)
```

---

## Verified Sprite Sheet Dimensions

All dimensions measured directly from PNG file headers (IHDR chunk). Confidence: HIGH.

| Sheet Key | File | Dimensions | Grid | Sprite Size | Count |
|-----------|------|-----------|------|-------------|-------|
| beds1 | Beds1-Sheet.png | 256×320 | 4×5 | 64×64 | 20 |
| beds | Beds-Sheet.png | 256×256 | 4×4 | 64×64 | 16 |
| chimney | Chimney-Sheet.png | 384×48 | 8×1 | 48×48 | 8 |
| chimney1 | Chimney1-Sheet.png | 256×32 | 8×1 | 32×32 | 8 |
| bathroom | Bathroom-Sheet.png | 576×96 | ~6×1 | ~96×96 | 6 (variable width, verify in Ph4) |
| doorsHospital | DoorsHospital-Sheet.png | 800×80 | 10×1 | 80×80 | 10 |
| tilesHospital | TilesHospital.png | 320×256 | 20×16 | 16×16 | 320 tiles |
| bedHospital | BedHospital-Sheet.png | 128×64 | 2×1 | 64×64 | 2 |

**Visual content confirmed:**
- `Beds1-Sheet`: 5 rows of 4 neon-lit server rack variants (purple, blue, cyan, red per column; green, mixed, dark variants per row)
- `Chimney-Sheet`: 8 identical modern grey fireplaces with lit fire in a single row
- `Chimney1-Sheet`: 8 traditional brown/brick fireplaces in a single row
- `DoorsHospital-Sheet`: 10 hospital/office door variants including double-door amber, metal frames, single doors
- `TilesHospital`: White/grey/blue floor tiles (top half) + wood/dark-wood floors and staircase (bottom half), 16px grid
- `BedHospital-Sheet`: 2 hospital beds (wheelchair-style and gurney)
- `Bathroom-Sheet`: Sink, towel dispenser, bathtub, cabinet, bath mat, shelf — 6 distinct items
- `Beds-Sheet`: 4×4 grid of wooden beds with 16 color/style variants

---

## State of the Art

| Old Pattern | Current Pattern | Relevant to Phase 1 |
|-------------|-----------------|---------------------|
| spriteIndex 0-2 (3 zones) | spriteIndex 0-5 (6 zones, after Phase 1) | FloorZone type defines the 6 zone names |
| 16 furnitureSheets registered | 24 furnitureSheets (16 + 8 new) | Phase 1 adds 8 entries |
| SPRITES covers ~18 items | SPRITES expanded to ~40+ items | Phase 1 adds server rack, chimney, hospital door, bath entries |

---

## Open Questions

1. **Bathroom sprite widths**
   - What we know: Sheet is 576×96, 6 visible items
   - What's unclear: The bathtub appears wider than the sink in the visual. Items may not be 96px uniform. The 96px assumption fits 576/6=96, but visual proportions suggest bathtub is at least 2× the sink width.
   - Recommendation: Register at 96×96 uniform for Phase 1; Phase 4 (ObjectRenderer verification) will correct coordinates against actual rendering. Flag with `// TODO: verify bathtub width in Phase 4` comment.

2. **TilesHospital usage context**
   - What we know: Contains floor tiles at 16px grid, registered as furnitureSheet
   - What's unclear: Phase 3 may want to use these as actual tile textures via SpriteSheet.drawFrame, not via FurnitureObject.sprite. The engine's TileMap currently uses solid color fills, not sprite-based tiles.
   - Recommendation: Register the sheet in Phase 1 for completeness (R2.1). Phase 3 decides whether to integrate tile-based rendering.

3. **FurnitureType enum for server rack**
   - What we know: `FurnitureType` in types.ts currently has no 'server-rack' entry
   - What's unclear: Phase 2 will need to place server racks. Should Phase 1 add 'server-rack' to the FurnitureType union?
   - Recommendation: Add `'server-rack'` to `FurnitureType` in Phase 1 so Phase 2 can use it immediately. This is within Phase 1's scope (types.ts changes). Optionally also add `'fireplace'` and `'reception-desk'`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — project has no test runner installed |
| Config file | None (no jest.config.*, vitest.config.*, etc.) |
| Quick run command | `npm run typecheck` (tsc --noEmit) |
| Full suite command | `npm run typecheck` |

No test files exist in the project. The only automated validation available for Phase 1 is TypeScript compilation.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R1.2 | FloorZone type compiles, 6 zone names valid | TypeScript compile | `npm run typecheck` | N/A (type-only) |
| R2.1 | 8 sheet keys present in assetManifest.furnitureSheets | TypeScript compile | `npm run typecheck` | N/A (const-only) |
| R2.2 | SpriteRegion coordinates are valid numbers | TypeScript compile | `npm run typecheck` | N/A (const-only) |
| R2.3 | SPRITES entries reference valid sheetIds | manual-only | Visual check in Phase 4 | N/A |

All Phase 1 requirements are type/constant definitions. TypeScript strict mode (`"strict": true` in tsconfig.json) catches type errors. No unit tests can validate that sprite pixel coordinates are visually correct — that validation belongs in Phase 4.

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck`
- **Phase gate:** `npm run typecheck` passes with zero errors

### Wave 0 Gaps
No test framework installation needed for Phase 1. TypeScript compilation via `npm run typecheck` is sufficient and already configured.

---

## Sources

### Primary (HIGH confidence)
- Direct PNG header inspection — all 8 sheet dimensions measured from actual files at `public/assets/metrocity/Interior/`
- Visual inspection of PNG images — content confirmed via Read tool image rendering
- `src/shared/types.ts` — current type contracts (read directly)
- `src/shared/asset-manifest.ts` — current sheet registration pattern (read directly)
- `src/shared/office-layout.ts` — current SPRITES pattern and TileInfo usage (read directly)
- `src/engine/TileMap.ts` — spriteIndex zone encoding usage (read directly)
- `tsconfig.json` — TypeScript config, strict mode, compiler options (read directly)

### Secondary (MEDIUM confidence)
- Grid size derivation from `width / spriteWidth` arithmetic — cross-checked against visual content for all sheets
- Bathroom sheet item widths — assumed 96px uniform based on 576/6; visually plausible but not measured at pixel level

### Tertiary (LOW confidence)
- Bathroom individual item region coordinates (sx=0,96,192...) — derived from uniform 96px assumption; flag for Phase 4 verification
- TilesHospital specific tile coordinates — top-left region estimates; full tile catalog would require pixel-by-pixel inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, TypeScript 6 already configured
- Architecture: HIGH — direct source file inspection, existing patterns are clear
- Sprite dimensions: HIGH for 7 of 8 sheets (uniform grids confirmed); MEDIUM for Bathroom (variable-width items)
- Sprite visual content: HIGH — all images visually inspected directly
- Pitfalls: HIGH — based on actual code analysis of engine and type usage

**Research date:** 2026-03-30
**Valid until:** 2026-06-30 (stable — MetroCity CC0 assets and TypeScript patterns do not change)
