---
phase: 4
slug: objectrenderer-sprites
created: 2026-03-30
---

# Phase 4: ObjectRenderer & Sprites - Validation Strategy

## Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript compiler (tsc) — no unit test framework |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck` |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| R5.3 (engine) | ObjectRenderer uses renderWidth/renderHeight | grep + typecheck | `grep "renderWidth" src/engine/ObjectRenderer.ts` + `npm run typecheck` |
| R5.3 (types) | FurnitureObject has renderWidth/renderHeight | grep | `grep "renderWidth" src/shared/types.ts` |
| R5.3 (sprites) | 17 SPRITES region corrections applied | grep spot-check | `grep "CHAIR_DOWN" src/shared/office-layout.ts` (verify corrected coordinates) |
| R5.3 (visual) | All furniture renders at correct size/position | visual check | `npm run dev` → zone-by-zone inspection |

## Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Phase gate:** `npm run typecheck` + `npm run dev` visual checkpoint (Task 3)

## Wave 0 Gaps

- No automated pixel-level rendering test — visual checkpoint (Task 3) covers this
- drawOffsetY values may need visual tuning after initial correction
- Server rack drawOffsetY (formula=0 vs current=-48) needs visual confirmation
