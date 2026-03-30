---
phase: 04-objectrenderer-sprites
plan: 01
subsystem: rendering
tags: [canvas2d, sprite-rendering, tilemap, typescript, office-layout]

# Dependency graph
requires:
  - phase: 03-tilemap-engine-adaptation
    provides: TileMap engine, ZONE_COLORS, walkableMask verification, camera confirmed
  - phase: 02-office-layout-design
    provides: 30x24 office grid, 6 zones, 72 furniture objects, SPRITES constant
  - phase: 01-type-manifest-expansion
    provides: FurnitureObject type, ObjectSpriteRef, asset-manifest with 8 sheets
provides:
  - ObjectRenderer uses renderWidth/renderHeight for display sizing (not raw sprite dims)
  - FurnitureObject type extended with optional renderWidth/renderHeight fields
  - All 17 SPRITES region coordinates corrected to verified PNG cell positions
  - All 72 furniture objects have explicit renderWidth/renderHeight/drawOffsetY values
  - drawOffsetY sign convention fixed: positive = shift up (engine formula honored)
affects:
  - 05-integration-verification

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "renderWidth/renderHeight override pattern: furniture objects declare intended display size, engine falls back to sprite region sw/sh"
    - "drawOffsetY = renderHeight - heightTiles * tileSize (positive shifts sprite up to align bottom with tile footprint)"
    - "SPRITES constant stores raw source cell coords; FurnitureObject stores intended world-pixel display dimensions"

key-files:
  created: []
  modified:
    - src/shared/types.ts
    - src/engine/ObjectRenderer.ts
    - src/shared/office-layout.ts

key-decisions:
  - "renderWidth/renderHeight added to FurnitureObject as optional fields — engine falls back to raw sprite dimensions if absent, preserving backward compatibility"
  - "drawOffsetY positive = shift up convention enforced across all 72 furniture objects; previous negative values were inverting the shift direction"
  - "Phase 5 tuning notes deferred: desks as white rectangles (Kitchen1 asset characteristic), meeting room carpet slight oversize, north wall decoration density, lounge TV/monitor slight oversize — low severity, not blockers"

patterns-established:
  - "Sprite display size is decoupled from sprite sheet source region — SPRITES constant stores raw cell coords; FurnitureObject stores intended world-pixel dimensions"
  - "All new furniture added to office-layout.ts must include renderWidth, renderHeight, and drawOffsetY calculated from: drawOffsetY = renderHeight - heightTiles * tileSize"

requirements-completed: [R5.3]

# Metrics
duration: ~45min
completed: 2026-03-30
---

# Phase 4 Plan 1: ObjectRenderer Sprite Fix Summary

**Corrected 17 wrong SPRITES region coordinates and added renderWidth/renderHeight override to ObjectRenderer so all 72 furniture objects render at correct tile footprint size instead of raw source dimensions — visually verified and approved.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-30T08:45:00Z
- **Completed:** 2026-03-30T09:30:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify)
- **Files modified:** 3

## Accomplishments

- Added `renderWidth?` / `renderHeight?` to `FurnitureObject` type; `ObjectRenderer.renderObject()` and `isVisible()` now use these values instead of raw sprite region `sw/sh`
- Corrected all 17 wrong SPRITES region coordinates (desks, chairs, monitor, TV, kitchen fridge/counter, reception desk, windows, lamps) to verified PNG cell positions
- Fixed drawOffsetY sign convention on all 72 furniture objects — changed all negative values to correct positive equivalents; formula: `drawOffsetY = renderHeight - heightTiles * tileSize`
- Visual verification approved: monitors as small flat screens, chairs 1-tile, server racks 4x4 flush, plants/lamps/windows correct, glass lobby door visible, 6 zone colors intact

## Task Commits

Each task was committed atomically:

1. **Task 1: Engine renderWidth/renderHeight fix** - `0f16ee6` (feat)
2. **Task 2: SPRITES corrections + furniture sizing** - `8018050` (fix)
3. **Task 3: Visual verification checkpoint** - APPROVED (no commit — checkpoint only)

## What Was Built

### Task 1: Engine type extension + ObjectRenderer fix

Added two optional fields to `FurnitureObject` in `src/shared/types.ts`:
- `renderWidth?: number` — display width in world pixels (overrides sprite region sw)
- `renderHeight?: number` — display height in world pixels (overrides sprite region sh)

Updated `src/engine/ObjectRenderer.ts`:
- `renderObject()`: uses `(obj.renderWidth ?? sw) * zoom` and `(obj.renderHeight ?? sh) * zoom` for destination size
- `isVisible()`: uses resolved `rw`/`rh` for correct bounding box culling (not raw sw/sh)

### Task 2: SPRITES region corrections + furniture data fix

**Part A — 17 SPRITES region corrections (verified against actual PNG files):**

Category A (wrong cell — sx pointed to wrong sprite):
- DESK_TOP: `sx:256, sw:80` → `sx:384, sw:96, sh:96` (col4 of Kitchen1-Sheet)
- DESK_BOT: `sx:336, sw:80` → `sx:480, sw:96, sh:96` (col5 of Kitchen1-Sheet)
- CHAIR_UP: `sw:16, sh:32` → `sw:96, sh:96` (col0 correct, dimensions wrong)
- CHAIR_LEFT: `sx:16, sw:16` → `sx:192, sw:96, sh:96` (col2)
- CHAIR_DOWN: `sx:32, sw:16` → `sx:96, sw:96, sh:96` (col1)
- CHAIR_RIGHT: `sx:48, sw:16` → `sx:288, sw:96, sh:96` (col3)
- MONITOR: `sx:16, sw:32, sh:32` → `sx:128, sw:64, sh:96` (col2 of TV-Sheet)
- TV_LARGE: `sw:128` → `sw:64` (was spanning 2 cells)
- KITCHEN_FRIDGE: `sx:96` → `sx:672` (col7 = tall fridge)
- KITCHEN_COUNTER: `sx:0` → `sx:96` (col1 = counter-with-drawers)
- RECEPTION_DESK: `sx:576` → `sx:768` (col8 = cabinet-counter)

Category B (wrong dimensions):
- WINDOW_WOOD: `sw:48, sh:48` → `sw:64, sh:64`
- WINDOW_BLUE: `sx:96, sw:48, sh:48` → `sx:256, sw:64, sh:64`
- WINDOW_PURPLE: `sx:192` → `sx:576`
- WINDOW_WHITE: `sx:288` → `sx:384`
- LAMP: `sw:32, sh:32` → `sw:64, sh:64`
- LAMP_BROWN: `sw:32, sh:32` → `sw:64, sh:64`

**Part B — 72 furniture objects updated:**
- Added `renderWidth` and `renderHeight` to every furniture.push() call
- All `drawOffsetY` values corrected from negative (wrong) to positive using formula: `drawOffsetY = renderHeight - heightTiles * tileSize`
- Zero negative drawOffsetY values remain

### Task 3: Visual verification — APPROVED

Human verification confirmed (2026-03-30):
- Monitors now render as small flat screens (no longer oversized)
- Chairs proper 1-tile size
- Server racks 4x4 flush
- Plants, lamps, windows all correctly sized
- Glass lobby door clearly visible
- 6 zone colors intact

## Files Created/Modified

- `src/shared/types.ts` — Added `renderWidth?: number` and `renderHeight?: number` to `FurnitureObject` interface
- `src/engine/ObjectRenderer.ts` — `renderObject()` and `isVisible()` use `obj.renderWidth ?? sw` / `obj.renderHeight ?? sh`
- `src/shared/office-layout.ts` — 17 SPRITES region corrections; all 72 furniture objects updated with renderWidth/renderHeight/drawOffsetY

## Decisions Made

- `renderWidth/renderHeight` are optional fields with engine fallback to raw sprite dims — existing furniture not requiring overrides is unaffected
- drawOffsetY positive-up convention enforced; the engine formula `worldY = tileY * tileSize - (drawOffsetY ?? 0)` means positive values shift the sprite upward to prevent it from dropping below its tile footprint
- Low-severity visual notes from human verification deferred to Phase 5 tuning

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All sprite region corrections and drawOffsetY values matched the research document. TypeCheck passed after both task commits.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Phase 5 (Integration & Verification) is unblocked.**

Core rendering is correct. The following low-severity visual items were noted during Phase 4 verification and are candidates for Phase 5 tuning:

| Item | Severity | Notes |
|------|----------|-------|
| Desks render as white rectangles | Low | Kitchen1 asset characteristic — the sprite cell contains a mostly-white counter surface. Not a rendering bug. |
| Meeting room carpet slightly large | Low | renderWidth/renderHeight may need 1-2px trim for tight fit |
| North wall decorations dense spacing | Low | Painting positions in office-layout.ts may need x-offset adjustment |
| Lounge TV/monitor slightly oversized | Low | MONITOR renderWidth may need reduction from 32 to 24px |

All blockers from Phase 3 human verification (oversized monitors, displaced server racks, wrong kitchen sprites, misaligned windows) are resolved.

## Self-Check

- [x] src/shared/types.ts modified (renderWidth/renderHeight added)
- [x] src/engine/ObjectRenderer.ts modified (both renderObject and isVisible updated)
- [x] src/shared/office-layout.ts modified (17 SPRITES + 72 furniture objects)
- [x] Commits 0f16ee6 and 8018050 exist
- [x] npm run typecheck passes
- [x] Task 3 visual checkpoint: APPROVED by human

## Self-Check: PASSED

---
*Phase: 04-objectrenderer-sprites*
*Completed: 2026-03-30*
