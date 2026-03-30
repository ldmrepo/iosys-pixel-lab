---
phase: 03-tilemap-engine-adaptation
plan: 01
subsystem: rendering
tags: [canvas, tilemap, zone-colors, walkableMask, camera]

# Dependency graph
requires:
  - phase: 02-office-layout-design
    provides: "30x24 tile grid with 6 floor zones (ZONE_INDEX 0-5) and furniture walkableMask arrays"
  - phase: 01-type-manifest-expansion
    provides: "FloorZone type and ZONE_INDEX record keying zones 0-5"
provides:
  - "6-entry ZONE_COLORS static lookup map in TileMap.ts replacing 3-case switch with default fallthrough"
  - "Plank line fix: light rgba overlay on dark server zone floor instead of invisible dark overlay"
  - "walkableMask length verification logging in cacheMovementTiles()"
  - "Camera auto-fit confirmed correct for 30x24 map (no code change required)"
affects:
  - "04-objectrenderer-sprites"
  - "05-integration-verification"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static readonly lookup map pattern (ZONE_COLORS) replacing switch statements for enum-keyed color data"
    - "Zone-aware render overlay: isDarkZone flag selects light vs dark plank line color"
    - "Runtime walkableMask length verification via console.warn at engine init"

key-files:
  created: []
  modified:
    - src/engine/TileMap.ts
    - src/engine/index.ts

key-decisions:
  - "ZONE_COLORS uses Record<number, string> with spriteIndex (= ZONE_INDEX value) as key, not FloorZone string — avoids TileInfo zone field lookup in hot render path"
  - "Plank line overlay uses isDarkZone === (spriteIndex === 3) check — server room is the only dark zone; meeting room green is light enough for dark overlay"
  - "Camera auto-fit for 30x24 required no code change — existing formula already correct per visual verification"

patterns-established:
  - "Static ZONE_COLORS map: future zone additions require only one new entry in TileMap.ZONE_COLORS"
  - "isDarkZone guard pattern: extend to include meeting/lounge if those zones become darker in future"

requirements-completed: [R5.1, R5.2, R5.5]

# Metrics
duration: ~45min (including human-verify checkpoint)
completed: 2026-03-30
---

# Phase 3 Plan 01: TileMap Engine Adaptation Summary

**6-entry ZONE_COLORS static lookup map in TileMap.ts gives all 6 floor zones distinct colors — dark navy server room, forest green meeting room, cream lobby — replacing a 3-case switch that fell through to brown for zones 3/4/5**

## Performance

- **Duration:** ~45 min (including human-verify checkpoint wait)
- **Started:** 2026-03-30
- **Completed:** 2026-03-30
- **Tasks:** 2 (1 auto, 1 checkpoint:human-verify)
- **Files modified:** 2

## Accomplishments

- Replaced `getZoneColor()` 3-case switch (zones 3/4/5 defaulted to brown) with 6-entry `ZONE_COLORS` static readonly map covering all ZONE_INDEX values 0-5
- Fixed invisible plank line overlay on dark server floor (`#2a2a3a`): dark zones now use `rgba(255,255,255,0.05)` instead of the invisible `rgba(0,0,0,0.07)`
- Added runtime `walkableMask` length verification in `cacheMovementTiles()` — logs a console.warn if any furniture's mask array length mismatches `widthTiles * heightTiles`
- Visual verification confirmed: all 6 zones visually distinct, full 30x24 map visible, camera auto-fit working, interior partition walls rendering, zero walkableMask mismatch warnings

## Task Commits

1. **Task 1: Replace zone color switch with 6-entry ZONE_COLORS lookup map** - `fa68b4c` (feat)
2. **Task 2: Visual verification checkpoint** - APPROVED (no commit — checkpoint only)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/engine/TileMap.ts` — Replaced `getZoneColor()` switch with `ZONE_COLORS` static map; added `isDarkZone` plank line fix
- `src/engine/index.ts` — Added walkableMask length verification loop after existing cache log

## Decisions Made

- Used `Record<number, string>` keyed by `spriteIndex` (= ZONE_INDEX value 0-5) rather than `Record<FloorZone, string>` — avoids zone string lookup in the per-tile render loop; spriteIndex is already in `TileInfo` directly
- Only `spriteIndex === 3` (server room, `#2a2a3a`) classified as dark zone for plank line fix — meeting room green (`#3a6b4a`) is mid-tone and dark overlay remains legible
- Camera auto-fit required no code change — confirmed correct for 30x24 by visual inspection

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Phase 4 Notes (Upstream Observer Report)

The following visual issues were observed during Task 2 human verification. These are **not Phase 3 blockers** — Phase 3 requirements R5.1/R5.2/R5.5 are fully met. They are deferred to Phase 4 (ObjectRenderer & Sprites) for resolution:

1. **Monitor/desk sprites oversized** — desk sprite footprint overlaps adjacent chairs; `drawOffsetY` adjustment needed
2. **`drawOffsetY` calibration needed for multiple furniture types** — generic offset does not fit all furniture heights
3. **Server rack sprites proportionally large** — 64x64 source region renders as approximately 4x4 tiles at current zoom
4. **Meeting room furniture depth sorting** — refinement needed for chair/table overlap ordering
5. **Kitchenette fridge/counter sprite size mismatch** — fridge sprite taller than counter sprite; visual gap visible
6. **Lobby reception counter position/size** — counter sprite does not align cleanly with lobby floor zone boundary

These items are within the Phase 4 scope (ObjectRenderer & Sprites, requirement R5.3) and are already anticipated by the ROADMAP Task 6 ("drawOffsetY 값 각 가구 타입별 보정").

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 3 complete: TileMap renders 6 distinct floor zones, walkableMask verification active
- Phase 4 can begin immediately: ObjectRenderer & Sprites (R5.3)
- Phase 4 should prioritize the 6 visual issues listed above in "Phase 4 Notes"
- No blockers

---
*Phase: 03-tilemap-engine-adaptation*
*Completed: 2026-03-30*
