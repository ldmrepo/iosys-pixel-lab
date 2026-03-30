---
phase: 02-office-layout-design
plan: "01"
subsystem: layout
tags: [office-layout, tilemap, furniture, seats, zones, canvas2d]

requires:
  - phase: 01-type-manifest-expansion
    provides: FloorZone, ZONE_INDEX, FurnitureObject, Seat, OfficeLayout types; 91 SPRITES entries; 8 new sprite sheets in asset manifest

provides:
  - 30x24 tile grid with 6 distinct FloorZone classifications (server/work/meeting/lounge/lobby/corridor)
  - Interior partition walls: server room south wall (y=10, gap at x=8) + meeting room 4-wall enclosure (gaps at x=18-19)
  - 20 agent seats across 5 desk pods (Work Zone A: pods A1/A2/A3, Work Zone B: pods B1/B2)
  - ~108 SPRITES entries (91 preserved + 17 new: sofa variants, kitchen items, paintings, plants, windows)
  - 80+ furniture objects all with explicit walkableMask
  - Export: officeLayout with width:30, height:24, tileSize:16

affects: [03-tilemap-engine, 04-objectrenderer-sprites, 05-integration-verification]

tech-stack:
  added: []
  patterns:
    - "Zone-aware tile helper: floor(zone) sets spriteIndex via ZONE_INDEX[zone]"
    - "createPod() generates 4 seats per pod with walkableMask on desks and monitors"
    - "walkableMask runtime assertion (throws if any furniture missing it)"
    - "Grid dimension assertion (throws if not 30x24)"

key-files:
  created: []
  modified:
    - src/shared/office-layout.ts

key-decisions:
  - "Server room racks use Beds1-Sheet (64x64 sprites) as visual stand-in for server hardware"
  - "Meeting room whiteboard uses MONITOR sprite as visual placeholder pending Phase 4 dedicated sprite"
  - "East utility zone (x:23-28, y:11-15) classified as corridor floor, not work zone — prevents Phase 5 seat rejection"
  - "SOFA_*_FRONT variants use sw:80, sh:48 (not 96x96) to match existing SOFA_FRONT dimensions"
  - "void ZONES used to suppress unused-variable warning since ZONES constants are referenced inline in tile logic"

patterns-established:
  - "createPod(sx, sy, prefix): self-contained pod function pushes to module-level furniture[] and seats[]"
  - "All wall-layer objects (windows, paintings) include walkableMask for runtime assertion compliance"
  - "Array(N).fill(false/true) for multi-tile furniture walkableMask"

requirements-completed: [R1.1, R1.2, R1.3, R1.4, R3.1, R3.2, R3.3, R3.4, R3.5, R3.6, R4.1, R4.2, R4.3, R4.4, R6.1, R6.2, R6.3, R6.4]

duration: 12min
completed: 2026-03-30
---

# Phase 02 Plan 01: Office Layout Design Summary

**30x24 tile grid with 6 classified zones, partition-walled server room and meeting room, 20 agent seats across 5 desk pods, and 80+ furniture objects all with explicit walkableMask**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-30T07:35:00Z
- **Completed:** 2026-03-30T07:47:39Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- Rewrote office-layout.ts from 20x15 to 30x24 with zone-aware floor() helper using ZONE_INDEX
- Implemented 6 distinct FloorZone areas with interior partition walls (server room south wall + meeting room 4-wall enclosure with doorway gaps)
- Created 5 desk pods totaling 20 agent seats (s1-s20) with fixed createPod() that includes walkableMask on all desk/monitor objects
- Placed 80+ furniture objects across all zones (server racks, meeting room, lounge, kitchenette, lobby) — every object has explicit walkableMask
- Added 17 new SPRITES entries (sofa variants at 80x48, kitchen items, paintings1 sheet, plant variants, window variants, reception desk)
- Added 8 north wall windows, 8 wall paintings, 12 zone-boundary plants
- Both runtime assertions in place: grid dimension check (throws if not 30x24) and walkableMask completeness check

## Task Commits

All three tasks were executed and verified before committing. Since all tasks modify the same single file, one atomic commit covers the complete work:

1. **Task 1: Tile grid with 6 zones and interior partition walls** - `8d1635d` (feat)
2. **Task 2: Zone-by-zone furniture placement with walkableMask and 20 seats** - `8d1635d` (feat)
3. **Task 3: Wall decorations, plants, and final validation** - `8d1635d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/shared/office-layout.ts` - Complete rewrite: 30x24 tile grid, 6 zones, 5 desk pods (20 seats), 80+ furniture objects, 108 SPRITES entries, partition walls, runtime assertions, OfficeLayout export

## Decisions Made

- Server room east racks (rack-1/rack-3) use 64x64 Beds1 sprites at tileX:5 — they extend to tileX:9 which overlaps the workA zone boundary. This is a visual-layer object on top of server-zone tiles; the engine renders furniture independently from tile zones so overlap is acceptable.
- Meeting room door (door-mtg-n) placed at y=10 (wall row) as a wall-layer object — the underlying tile is floor('corridor') per the doorway gap rule.
- No extra desk pairs in east utility zone (kitchenette x:23-28) — confirmed this would cause Phase 5 seat rejection since those tiles are classified as corridor, not work zone.

## Deviations from Plan

None - plan executed exactly as written. All 91 Phase 1 SPRITES entries preserved. All furniture coordinates match plan spec. All acceptance criteria verified.

## Issues Encountered

None - TypeScript compiled cleanly on first attempt. All SPRITES, FurnitureType values, and walkableMask counts verified correct.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `officeLayout` exports width:30, height:24, tileSize:16 — ready for Phase 3 TileMap engine to consume
- 20 seats defined with correct Seat interface (id, tileX, tileY, deskTileX, deskTileY, facing) — ready for Phase 5 seat assignment
- All furniture has walkableMask — engine pathfinder will correctly block/allow tiles
- SPRITES dictionary has all entries Phase 4 ObjectRenderer will need for furniture rendering
- Partition walls create enclosed zones with doorway gaps — Phase 3 must handle zone-boundary wall rendering

## Self-Check: PASSED

- `src/shared/office-layout.ts` — FOUND
- `.planning/phases/02-office-layout-design/02-01-SUMMARY.md` — FOUND
- Commit `8d1635d` — FOUND
- `npx tsc --noEmit` — CLEAN (no errors)
- `grep "width: 30"` — FOUND
- `grep "height: 24"` — FOUND
- `grep -c "walkableMask"` — 75 matches (all furniture covered)
- `grep -c "type: 'plant'"` — 14 matches (12 plants + 2 lobby plants from Task 2)

---
*Phase: 02-office-layout-design*
*Completed: 2026-03-30*
