---
phase: 01-type-manifest-expansion
plan: 01
subsystem: shared-types
tags: [typescript, sprite-sheets, asset-manifest, office-layout, floor-zones]

# Dependency graph
requires: []
provides:
  - FloorZone type with 6 zones (corridor, work, lounge, server, meeting, lobby)
  - ZONE_INDEX const mapping zones to numeric indices 0-5
  - Optional zone field on TileInfo interface
  - FurnitureType union extended with server-rack, fireplace, reception-desk
  - 8 new furnitureSheets registered in asset-manifest (24 total)
  - 70+ new SPRITES entries covering server racks, chimneys, hospital doors, bathroom, beds
affects:
  - 02-office-layout-design
  - 03-tilemap-engine-adaptation
  - 04-objectrenderer-sprites
  - 05-integration-verification

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sprite region pattern: sheetId + {sx, sy, sw, sh} region for all furniture sprites"
    - "FloorZone as optional TileInfo field — backwards-compatible zone tagging"
    - "ZONE_INDEX maps zone names to integers for renderer color lookup"

key-files:
  created: []
  modified:
    - src/shared/types.ts
    - src/shared/asset-manifest.ts
    - src/shared/office-layout.ts

key-decisions:
  - "zone field on TileInfo is optional to preserve backward-compatibility with engine fallback tiles"
  - "Beds1-Sheet repurposed as server racks for server room zone"
  - "TilesHospital registered in furnitureSheets but no SPRITES entries — floor tile usage belongs in Phase 3"
  - "DoorsHospital sprites registered for use as glass doors in meeting rooms and lobby"

patterns-established:
  - "Sprite sheet registration: add URL+name to furnitureSheets in asset-manifest, then add named SPRITES entries in office-layout"
  - "All SPRITES entries use exact pixel coordinates verified against actual sheet dimensions"

requirements-completed: [R1.2, R2.1, R2.2, R2.3]

# Metrics
duration: 12min
completed: 2026-03-30
---

# Phase 01 Plan 01: Type & Manifest Expansion Summary

**FloorZone type with 6 zones + ZONE_INDEX, optional TileInfo.zone, 3 new FurnitureType entries, 8 new sprite sheet registrations (24 total), and 70+ SPRITES entries covering server racks, chimneys, hospital doors, bathroom items, and beds**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-30T00:00:00Z
- **Completed:** 2026-03-30T00:12:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extended `types.ts` with FloorZone type, ZONE_INDEX const, optional zone field on TileInfo, and 3 new FurnitureType members
- Registered 8 new sprite sheets in `asset-manifest.ts` (16 → 24 furnitureSheets total)
- Added 70+ named SPRITES entries in `office-layout.ts` covering all 8 new sheets with verified pixel coordinates
- All changes pass `npm run typecheck` with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend types.ts with FloorZone, ZONE_INDEX, and new FurnitureType entries** - `7113e98` (feat)
2. **Task 2: Register 8 new sprite sheets and expand SPRITES entries** - `e183d77` (feat)

**Plan metadata:** _(created after self-check)_

## Files Created/Modified
- `src/shared/types.ts` - Added FloorZone type, ZONE_INDEX const, optional zone field on TileInfo, extended FurnitureType union
- `src/shared/asset-manifest.ts` - Registered 8 new furnitureSheets (beds1, doorsHospital, tilesHospital, chimney, chimney1, bathroom, beds, bedHospital)
- `src/shared/office-layout.ts` - Added 70+ SPRITES entries: 20 server racks, 8 modern chimneys, 8 classic chimneys, 10 hospital doors, 6 bathroom items, 2 hospital beds, 16 regular beds

## Decisions Made
- zone field on TileInfo is optional (`zone?:`) to maintain backward-compatibility with the engine fallback tile generator in `src/engine/index.ts` which builds TileInfo without zone
- TilesHospital is registered in furnitureSheets but intentionally receives no SPRITES entries — it contains floor tiles to be used in Phase 3 TileMap adaptation, not furniture objects
- DoorsHospital sprites registered for repurposing as glass doors in meeting rooms and lobby zones

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - both tasks completed on first attempt with zero typecheck errors.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FloorZone type and ZONE_INDEX are ready for use in Phase 2 (30x24 layout design)
- 8 new sprite sheet URLs are registered and ready for Phase 4 asset loading
- Server rack sprites (SERVER_RACK_PURPLE through SERVER_RACK_DARK_3) enable Phase 2 server room furniture placement
- Hospital door sprites (DOOR_HOSP_*) enable Phase 2 meeting room and lobby door placement
- All existing types and sprite registrations remain unchanged — zero regression risk

---
*Phase: 01-type-manifest-expansion*
*Completed: 2026-03-30*
