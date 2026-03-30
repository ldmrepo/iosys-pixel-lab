---
phase: 04-objectrenderer-sprites
plan: 01
subsystem: rendering
tags: [sprite-rendering, office-layout, engine, canvas2d]
dependency_graph:
  requires: []
  provides: [renderWidth-renderHeight-on-FurnitureObject, corrected-SPRITES-regions, furniture-renderWidth-renderHeight]
  affects: [src/engine/ObjectRenderer.ts, src/shared/office-layout.ts, src/shared/types.ts]
tech_stack:
  added: []
  patterns: [renderWidth-renderHeight-override, positive-drawOffsetY-convention]
key_files:
  created: []
  modified:
    - src/shared/types.ts
    - src/engine/ObjectRenderer.ts
    - src/shared/office-layout.ts
decisions:
  - "renderWidth/renderHeight override on FurnitureObject is backward-compatible — objects without the fields use raw sw/sh as before"
  - "drawOffsetY convention corrected to positive values only (positive = shifts sprite UP)"
  - "SPRITES region table corrected from estimated values to verified PNG pixel coordinates"
metrics:
  duration: ~25min
  completed_date: "2026-03-30"
  tasks_completed: 2
  tasks_total: 3
  files_modified: 3
---

# Phase 4 Plan 1: ObjectRenderer Sprite Fix Summary

**One-liner:** Corrected 17 wrong SPRITES region coordinates and added renderWidth/renderHeight override to ObjectRenderer so all 72 furniture objects render at correct tile footprint size instead of raw source dimensions.

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

## Commits

| Hash | Message |
|------|---------|
| 0f16ee6 | feat(04-01): add renderWidth/renderHeight to FurnitureObject + fix ObjectRenderer |
| 8018050 | feat(04-01): fix all 17 SPRITES regions + add renderWidth/renderHeight to 72 furniture objects |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npm run typecheck` passes with zero errors after both tasks
- 17 SPRITES regions verified by grep for corrected sx values
- 72 furniture objects have renderWidth (confirmed: 72 matches)
- Zero negative drawOffsetY values (confirmed: grep "drawOffsetY: -" returns no matches)

## Pending

Task 3 (Visual Verification) is a checkpoint:human-verify — awaiting human approval of rendered output.

## Self-Check

- [x] src/shared/types.ts modified (renderWidth/renderHeight added)
- [x] src/engine/ObjectRenderer.ts modified (both renderObject and isVisible updated)
- [x] src/shared/office-layout.ts modified (17 SPRITES + 72 furniture objects)
- [x] Commits 0f16ee6 and 8018050 exist
- [x] npm run typecheck passes
