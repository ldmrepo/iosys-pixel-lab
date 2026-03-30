---
phase: 2
slug: office-layout-design
created: 2026-03-30
---

# Phase 2: Office Layout Design - Validation Strategy

## Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript compiler (tsc) — no dedicated unit test framework |
| Config file | tsconfig.json (root) |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck` |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| R1.1 | officeLayout.width===30 && height===24 | grep assertion | `grep -E "width: 30.*height: 24" src/shared/office-layout.ts` |
| R1.2 | 6 distinct zone values on tile grid | grep count | `grep -c "zone:" src/shared/office-layout.ts` (verify all 6 FloorZone values used) |
| R1.3 | spriteIndex 0-5 used on correct zones | grep assertion | `grep "spriteIndex:" src/shared/office-layout.ts` |
| R1.4 | wall tiles at outer border + interior partitions | grep assertion | `grep "type: 'wall'" src/shared/office-layout.ts` |
| R3.1 | server racks + monitoring equipment | grep assertion | `grep "server-rack" src/shared/office-layout.ts` + `grep "WATER_COOLER" src/shared/office-layout.ts` |
| R3.2 | seats.length in [20,24] | grep count | `grep -c "seats.push" src/shared/office-layout.ts` |
| R3.3 | meeting room has whiteboard | grep assertion | `grep "whiteboard" src/shared/office-layout.ts` |
| R5.2 | every furniture has walkableMask | typecheck + runtime assertion | `npm run typecheck` + inline assertion in office-layout.ts |
| AC | typecheck passes | automated | `npm run typecheck` |

## Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck` + visual inspection via `npm run dev`
- **Phase gate:** `npm run typecheck` + seat count + walkableMask coverage verified

## Wave 0 Gaps

- No dedicated test file exists — acceptance criteria verified by grep + typecheck
- Runtime assertion function added inline in office-layout.ts checks: grid size, seat count, walkableMask coverage
