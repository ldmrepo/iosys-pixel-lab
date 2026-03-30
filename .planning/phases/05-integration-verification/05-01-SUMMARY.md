---
phase: 05-integration-verification
plan: 01
subsystem: game-engine
tags: [canvas2d, pathfinder, seat-assignment, websocket, typescript]

requires:
  - phase: 04-objectrenderer-sprites
    provides: renderWidth/renderHeight furniture fields, ObjectRenderer depth sorting
  - phase: 02-office-layout-design
    provides: 30x24 office layout, 6 zones, createPod seat generation, walkableMask furniture

provides:
  - createPod fixed to produce exactly 4 seats per pod (20 total across 5 pods)
  - StateMachine.waitForLayout() for awaitable layout loading
  - FALLBACK_LAYOUT updated to 30x24 dimensions
  - Server startup awaits real seat data before session discovery
  - v1.0 milestone visual verification (pending human checkpoint)

affects: [state-machine, server-startup, seat-assignment, pathfinder]

tech-stack:
  added: []
  patterns:
    - "Stored async promise pattern: assign loadOfficeLayout() return to private field for external await"
    - "Async server.listen callback pattern for sequential async startup steps"
    - "Single-column pod layout: 2w x 5t footprint producing 4 seats per pod"

key-files:
  created: []
  modified:
    - src/shared/office-layout.ts
    - src/server/state-machine.ts
    - src/server/index.ts
    - src/engine/index.ts

key-decisions:
  - "createPod single-column: removed outer for-i loop so each pod is 2 tiles wide instead of 6, producing 4 seats (not 8)"
  - "Pod positions adjusted: A1@10, A2@15, A3@20, B1@3, B2@9 for proper spacing in narrower footprint"
  - "layoutReady promise stored on StateMachine instance — minimal change, no new infrastructure"
  - "FALLBACK_LAYOUT updated to 30x24 to match real office dimensions (only activates if dynamic import throws)"

patterns-established:
  - "Store async init promise on class instance; expose as public await method (waitForLayout pattern)"

requirements-completed: [R5.4]

duration: 3min (Tasks 1-2; Task 3 pending human verification)
completed: 2026-03-30
---

# Phase 05 Plan 01: Integration & Verification Summary

**Fixed 3 defects blocking v1.0: createPod now produces 20 seats (not 40), StateMachine awaits layout before session discovery, FALLBACK_LAYOUT updated to 30x24**

## Performance

- **Duration:** ~3 min (Tasks 1-2 automated; Task 3 awaiting human visual verification)
- **Started:** 2026-03-30T09:21:07Z
- **Completed:** 2026-03-30T09:23:33Z (Tasks 1-2)
- **Tasks:** 2/3 complete (Task 3 is checkpoint:human-verify)
- **Files modified:** 4

## Accomplishments

- Removed outer `for (let i = 0; i < 2)` loop from `createPod` — each pod now produces exactly 4 seats (2 top + 2 bottom desk chairs), 5 pods x 4 = 20 total seats (s1-s20)
- Added `private layoutReady: Promise<void>` to `AgentStateMachine` and public `waitForLayout()` method — eliminates async race where agents could receive DEFAULT_SEATS positions on fast startup
- Made `server.listen` callback `async` and added `await stateMachine.waitForLayout()` before `discovery.start()` — guarantees real office-layout seats are active before any session file is discovered
- Updated `FALLBACK_LAYOUT` from 20x15 to 30x24 to match actual office dimensions (cosmetic but prevents confusion if fallback ever activates)
- `npm run typecheck` passes with zero errors after both fixes
- walkableMask count in office-layout.ts: 75 occurrences (requirement: >= 60)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix seat count bug and update FALLBACK_LAYOUT** - `380ccac` (fix)
2. **Task 2: Fix StateMachine async race condition** - `8377bf8` (fix)
3. **Task 3: Visual integration verification** - PENDING (checkpoint:human-verify)

## Files Created/Modified

- `src/shared/office-layout.ts` - createPod rewritten to single column (4 seats/pod), pod positions adjusted
- `src/server/state-machine.ts` - layoutReady field + waitForLayout() method added
- `src/server/index.ts` - server.listen callback made async, awaits waitForLayout() before discovery.start()
- `src/engine/index.ts` - FALLBACK_LAYOUT dimensions updated from 20x15 to 30x24

## Decisions Made

- Single-column pods (2 tiles wide x 5 tiles tall) selected over Option B (accept 40 seats) or Option C (reduce chairs per column) — cleanest structural fix that exactly satisfies AC "20~24석"
- Pod X positions chosen to fit within zone bounds while maintaining visual spacing: A1@10, A2@15, A3@20 within workA (x=9..28); B1@3, B2@9 within workB (x=1..14)
- `waitForLayout()` added as thin wrapper over stored promise — no new infrastructure, minimal surface area

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All three fixes applied cleanly, TypeScript typecheck passes after each task.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Tasks 1-2 complete with commits 380ccac and 8377bf8
- Task 3 (visual verification) is the final v1.0 milestone gate — requires human to run `npm run dev`, open http://localhost:5173, and confirm:
  - Server log: `[StateMachine] Loaded 20 seats from office-layout`
  - Engine log: `[Engine] Cached N walkable tiles, M break tiles` (N > 200)
  - 6 zone colors visible, furniture rendered, agents at desks if sessions active
  - No runtime errors (walkableMask assertion passes at module load)

---
*Phase: 05-integration-verification*
*Completed: 2026-03-30*

## Self-Check

### Files exist:
- src/shared/office-layout.ts: modified (verified via Edit tool)
- src/server/state-machine.ts: modified (verified via Edit tool)
- src/server/index.ts: modified (verified via Edit tool)
- src/engine/index.ts: modified (verified via Edit tool)

### Commits exist:
- 380ccac: fix(05-01): fix seat count bug and update FALLBACK_LAYOUT
- 8377bf8: fix(05-01): fix StateMachine async race condition

## Self-Check: PASSED
