---
phase: 3
slug: tilemap-engine-adaptation
created: 2026-03-30
---

# Phase 3: TileMap Engine Adaptation - Validation Strategy

## Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript compiler (tsc) — no unit test framework |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck` |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| R5.1 | 6 zone colors in TileMap | grep + typecheck | `grep "ZONE_COLORS" src/engine/TileMap.ts` + `npm run typecheck` |
| R5.2 | walkableMask caching correct for 30×24 | typecheck + runtime | `npm run typecheck` (structure correct; Phase 2 runtime assertion guards masks) |
| R5.5 | Camera auto-fit shows full 30×24 map | visual check | `npm run dev` → verify all 6 zones visible on load |

## Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Phase gate:** `npm run typecheck` + `npm run dev` visual inspection (6 zone colors distinct, full map visible)

## Wave 0 Gaps

- No automated test for zone color rendering (requires visual inspection via `npm run dev`)
- No automated test for camera viewport coverage (requires visual inspection)
- `npm run typecheck` is the only automated gate; visual checkpoint in Task 2 covers rendering
