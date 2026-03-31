---
phase: 13-asset-replacement
plan: "01"
subsystem: assets
tags: [pixel-art, sprites, asset-manifest, office-layout, pixeloffice]
dependency_graph:
  requires: []
  provides: [pixeloffice-sprite-sheet, pixeloffice-furniture-sheets, pixeloffice-sprites-constant]
  affects: [src/shared/asset-manifest.ts, src/shared/office-layout.ts, public/assets/pixeloffice/]
tech_stack:
  added: []
  patterns: [ObjectSpriteRef-region-pattern, single-furnitureSheet-registration]
key_files:
  created:
    - public/assets/pixeloffice/PixelOfficeAssets.png
  modified:
    - src/shared/asset-manifest.ts
    - src/shared/office-layout.ts
decisions:
  - "PixelOffice only: single pixelOffice furnitureSheet, all 25 MetroCity entries removed"
  - "SPRITES constant holds 23 entries covering all PixelOffice sprites with pngjs-measured coordinates"
  - "furniture[] and seats[] are empty stubs — Plan 02 will populate them"
  - "void SPRITES and void ZONES suppression kept for Plan 02 compatibility"
metrics:
  duration_minutes: 2
  completed_date: "2026-03-31"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 13 Plan 01: Asset Foundation — PixelOffice Sprite Sheet Deployment Summary

**One-liner:** Deployed PixelOfficeAssets.png, replaced 25 MetroCity furnitureSheets with single pixelOffice entry, and defined 23-sprite SPRITES constant with pngjs-measured coordinates.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Deploy PixelOffice sprite sheet and register as sole furniture sheet | 6566cdb | public/assets/pixeloffice/PixelOfficeAssets.png, src/shared/asset-manifest.ts |
| 2 | Define complete SPRITES constant with all PixelOffice sprite coordinates | 2ee5a90 | src/shared/office-layout.ts |

## What Was Built

### Task 1: Sprite Sheet Deployment + Asset Manifest Cleanup

Copied `PixelOffice/PixelOfficeAssets.png` (9.2 KB, 256x160px) to `public/assets/pixeloffice/PixelOfficeAssets.png`.

Replaced the entire `furnitureSheets` block in `asset-manifest.ts`. Removed all 25 MetroCity entries (tilesHouse, livingRoom1, livingRoom, miscHome, cupboard, kitchen1, kitchen, flowers, tv, carpet, paintings, paintings1, lights, windows, doors, miscHospital, beds1, doorsHospital, tilesHospital, chimney, chimney1, bathroom, beds, bedHospital, meetingTable). Replaced with a single `pixelOffice` entry pointing to `/assets/pixeloffice/PixelOfficeAssets.png`.

### Task 2: SPRITES Constant Replacement

Replaced the 91-entry MetroCity SPRITES constant in `office-layout.ts` with 23 PixelOffice entries, all referencing `sheetId: 'pixelOffice'`:

- **Chairs (6):** CHAIR_ORANGE, CHAIR_YELLOW, CHAIR_GREEN, CHAIR_BLUE, CHAIR_WHITE, CHAIR_GRAY — each 11x22px at y=41..62
- **Sofas (2):** SOFA_ORANGE (26x16px), SOFA_WHITE (26x20px) — decorative only
- **Cubicle desks (2):** CUBICLE_DESK_A (26x21px), CUBICLE_DESK_B (26x25px)
- **Machines (6):** MACHINE_ORANGE, MACHINE_GRAY, MACHINE_CYAN, MACHINE_GREEN, MACHINE_ORANGE2, MACHINE_PURPLE — lobby wall appliances
- **Window panel (1):** WINDOW_PANEL (79x17px, 3-pane strip)
- **Elevator (1):** ELEVATOR (92x40px assembly)
- **Snack racks (3):** RACK_GRAY, RACK_PINK, RACK_SMALL_BLUE
- **Plants (2):** PLANT_LEFT (15x38px), PLANT_RIGHT (18x40px)

Removed `createDeskRow()` helper and all old furniture.push/seats.push calls. `furniture[]` and `seats[]` are empty stubs ready for Plan 02 layout redesign.

## Verification Results

| Check | Result |
|-------|--------|
| `public/assets/pixeloffice/PixelOfficeAssets.png` exists | PASS |
| `asset-manifest.ts` has `pixelOffice:` furnitureSheet | PASS |
| `asset-manifest.ts` has zero MetroCity entries | PASS (0 matches) |
| `office-layout.ts` SPRITES has 23 `sheetId: 'pixelOffice'` entries | PASS (count=23) |
| `office-layout.ts` has zero MetroCity sheetId references | PASS (0 matches) |
| `npx tsc --noEmit` | PASS (no errors) |
| `officeLayout` exports width:30, height:24, tileSize:16 | PASS |
| `furniture[]` is empty | PASS |
| `seats[]` is empty | PASS |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `public/assets/pixeloffice/PixelOfficeAssets.png`: FOUND
- commit `6566cdb`: FOUND (feat(13-01): deploy PixelOffice sprite sheet...)
- commit `2ee5a90`: FOUND (feat(13-01): replace SPRITES constant...)
- TypeScript: clean
- MetroCity references: 0 in both modified files
