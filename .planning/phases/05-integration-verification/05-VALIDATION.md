---
phase: 5
slug: integration-verification
created: 2026-03-30
---

# Phase 5: Integration & Verification - Validation Strategy

## Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript compiler (tsc) — no unit test framework |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck` + `npm run dev` visual |

## Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| R5.4 (seats) | 20 seats, createPod 4 seats/pod | grep count | `grep -c "seats.push" src/shared/office-layout.ts` → 20 |
| R5.4 (async) | StateMachine awaits layout before discovery | grep | `grep "waitForLayout" src/server/index.ts` |
| R5.4 (fallback) | FALLBACK_LAYOUT width:30 height:24 | grep | `grep "width: 30" src/engine/index.ts` |
| R5.4 (e2e) | Agent assigned to seat, path found | visual | `npm run dev` → agent walks to seat |
| AC (typecheck) | Zero errors | automated | `npm run typecheck` |

## Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Phase gate:** `npm run typecheck` + `npm run dev` + server log seat count

## Wave 0 Gaps

- No automated E2E test for WebSocket → seat assignment → pathfinding flow
- Visual checkpoint (Task 3) covers the integration verification
