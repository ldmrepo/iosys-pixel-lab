# Phase 5: Integration & Verification - Research

**Researched:** 2026-03-30
**Domain:** PathFinding, seat assignment, WebSocket flow, TypeScript compilation
**Confidence:** HIGH

---

## Summary

Phase 5 verifies that all systems integrated in Phases 1–4 work end-to-end: PathFinder reaches seats, CharacterBehavior FSM operates on the expanded map, StateMachine assigns real office seats, and the WebSocket pipeline remains intact.

The good news: `npm run typecheck` passes cleanly with zero errors. The bad news for planning: three concrete defects were found during research that must be fixed in this phase.

**Defect 1 (CRITICAL):** `office-layout.ts` comment says "20 seats" but `createPod` actually generates 8 seats per pod (2 columns × 4 chairs each), yielding **40 seats total** (s1–s40). The acceptance criterion is "20–24 seats," so the implementation overshoots. The comment `// Total seat count: 12 (Zone A) + 8 (Zone B) = 20 seats` is wrong. The planner must decide: fix the pod structure to produce 4 seats per pod (to reach 20 total), or accept 40 seats (which is above the 20–24 AC range).

**Defect 2 (MEDIUM):** `state-machine.ts` calls `loadOfficeLayout()` from the `constructor` as a fire-and-forget `async` method. The `DEFAULT_SEATS` (12 seats, IDs `seat-0..seat-11`, positioned for a ~4×3 grid) remain active until the async import resolves. If a session is discovered immediately on startup (before the microtask queue clears), the first agents will be assigned `DEFAULT_SEATS` positions—placing them outside the real desk layout.

**Defect 3 (LOW):** `FALLBACK_LAYOUT` in `engine/index.ts` still uses `width: 20, height: 15`. This fallback is only reached if the dynamic `import('../shared/office-layout')` throws. It is cosmetically wrong but won't affect normal execution.

**Primary recommendation:** Fix `createPod` to produce 4 seats per pod (by removing one of the two `for c` loops per column, or by making each pod single-column), add `await`-based seat loading before `start()`, and keep the fallback correction as a secondary task.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| R5.4 | PathFinder/CharacterBehavior — 확장 맵에서 좌석 배정 정상 동작 | PathFinder is generic (no hardcoded dimensions); seat count defect must be fixed; StateMachine async race needs patch; all seat tiles are walkable (walkableMask:[true]) |
</phase_requirements>

---

## Findings by Research Area

### 1. PathFinder — 30×24 Grid Compatibility

**Confidence: HIGH** (code verified)

`PathFinder` is fully generic. It accepts `(width, height, isWalkableFn)` and has no hardcoded dimensions. It reads its bounds from `this.width` / `this.height` set in the constructor.

In `engine/index.ts`, `initialize()` calls:
```typescript
const gridSize = this.tileMap.getGridSize(); // returns {width:30, height:24} from officeLayout
this.pathFinder = new PathFinder(gridSize.width, gridSize.height, (x, y) => this.tileMap.isWalkable(x, y));
```

`TileMap.isWalkable()` delegates to `this.walkGrid[tileY][tileX]` (set via `setWalkGrid` after `cacheMovementTiles()` runs). This means PathFinder always reflects the current walkability grid.

**Special destination behaviour:** PathFinder allows stepping onto a non-walkable destination tile (line 96–99 of PathFinder.ts). Since all 40 seat tiles have `walkableMask: [true]`, seats are actually walkable — the special case is not needed for agent seating, but it provides resilience.

**Reachability concern:** The four `4×4` server racks (rack-0 at 1,1; rack-1 at 5,1; rack-2 at 1,6; rack-3 at 5,6) each have `walkableMask: Array(16).fill(false)`. They block the server room interior entirely. However, **no seat is located in the server zone** (confirmed: server zone is x=1–8, y=1–9; all seats are in work zones), so server racks do not affect seat pathfinding.

Work zone seats are accessible from corridors at y=10 (workA) and y=11–15 row borders (workB). The corridor tiles at y=10 (x=8,9–14,18,19) and y=16 (x=1–14,18,19,23–28) are all `floor('corridor')` — walkable.

### 2. Seat Count Defect

**Confidence: HIGH** (traced code execution)

`createPod(sx, sy, prefix)` loops `i = 0..1` (two desk columns). Inside each `i` iteration:
- Top desk: `for c = 0..1` → 2 seats pushed
- Bottom desk: `for c = 0..1` → 2 seats pushed
- Total per column: 4 seats

Two columns per pod = **8 seats per pod**.

Five pods (A1, A2, A3, B1, B2) = **40 seats total**, IDs `s1`–`s40`.

The comment `// Total seat count: 12 (Zone A) + 8 (Zone B) = 20 seats` (line 352) is incorrect.

**Acceptance Criteria:** "에이전트가 20~24석에 정상 배정됨"

40 seats exceeds the 20–24 range. The planner must choose a fix:

**Option A (recommended):** Reduce each pod to one column only (remove the `for i=0..1` outer loop, use a single column at `sx`). That gives 4 seats per pod × 5 pods = 20 seats. Achieves exactly 20.

**Option B:** Accept 40 seats. The AC says "20~24석" which could be interpreted as "at least 20 and at most 24." 40 violates the upper bound. However, 40 seats simply means more capacity — functionally harmless if agents only number 1–20 in practice.

**Option C:** Keep 2 columns but make desks face the same direction (remove one of the two chair loops). This gives 2 chairs per column × 2 columns = 4 per pod × 5 pods = 20.

The planner should decide based on visual layout intent. Option A (single column per pod) simplifies the pod footprint to 3 tiles wide × 3 tiles tall.

### 3. StateMachine Seat Loading Race Condition

**Confidence: HIGH** (code verified)

`AgentStateMachine` constructor calls `this.loadOfficeLayout()` (fire-and-forget `async`). `loadOfficeLayout` uses dynamic `import('../shared/office-layout.js')` which resolves asynchronously.

`DEFAULT_SEATS` (12 seats, `seat-0..seat-11`) is the initial value of `this.seats`. If `onSessionAdded` fires before the import resolves, `assignSeat()` uses `DEFAULT_SEATS`:
- Seat ID format: `seat-0` not `s1`
- Positions: `tileX = 2 + (i%4)*3`, `tileY = 2 + floor(i/4)*3` — matches old 20×15 layout, not the new one

**Fix:** Make `start()` await the layout load before beginning discovery. Or restructure `loadOfficeLayout` to be called and awaited by the server before starting discovery.

Current server startup in `src/server/index.ts`:
```typescript
const stateMachine = new AgentStateMachine(); // starts async load, not awaited
// ...
server.listen(PORT, () => {
  discovery.start();   // may emit session-added immediately
  stateMachine.start();
});
```

The `server.listen` callback fires after `bind()`, which is synchronous. The microtask queue (where the `import()` resolves) may or may not have processed before `discovery.start()` scans existing session files.

**Fix pattern:**
```typescript
// In AgentStateMachine:
async waitForLayout(): Promise<void> {
  await this.layoutLoadPromise;
}

// In server/index.ts:
await stateMachine.waitForLayout();
discovery.start();
stateMachine.start();
```

Or simpler: store the promise in `loadOfficeLayout` and expose it:
```typescript
private layoutReady: Promise<void>;
constructor() {
  super();
  this.layoutReady = this.loadOfficeLayout();
}
async waitForLayout(): Promise<void> { await this.layoutReady; }
```

### 4. CharacterBehavior — Expanded Map Compatibility

**Confidence: HIGH** (code verified)

`CharacterBehavior` has no hardcoded coordinates. It receives:
- `workSeat: { x, y }` — set from `state.position.x/y` at agent creation (line 238 of `engine/index.ts`)
- `breakTiles` — derived from `cacheMovementTiles()` on the real 30×24 layout
- `walkableTiles` — same source

`cacheMovementTiles()` builds `walkableTiles` and `breakTiles` dynamically from the layout's tile grid and furniture masks. It correctly loops `y = 0..height-1`, `x = 0..width-1` using `this.layout.width/height`.

Break tiles are walkable tiles NOT within Manhattan distance ≤2 of any desk. With the expanded layout, corridor tiles at y=10, y=16, lounge tiles (y=17–22), and lobby tiles (y=17–22) will populate `breakTiles`. This is correct — agents on break can wander freely.

**Potential issue:** `goToWander()` picks a random tile from all `walkableTiles` including work zone tiles. Characters could wander to another agent's desk tile. This is existing behaviour, not a regression.

### 5. Fallback Layout (engine/index.ts)

**Confidence: HIGH** (code verified)

Lines 76–85 of `engine/index.ts`:
```typescript
const FALLBACK_TILES = generateFallbackTiles(20, 15);
const FALLBACK_LAYOUT: OfficeLayout = {
  width: 20, height: 15, tileSize: 16,
  tiles: FALLBACK_TILES, furniture: [], seats: FALLBACK_SEATS,
};
```

This fallback activates only when `import('../shared/office-layout')` throws. Since the module exists and compiles cleanly, normal execution never reaches this code. It is safe but misleading. Updating it to 30×24 removes confusion and protects against future `console.warn` noise.

`FALLBACK_SEATS` (5 seats) would also be wrong for a 30×24 map but is only relevant if the real layout fails to load.

### 6. WebSocket / StateMachine E2E Flow

**Confidence: HIGH** (code verified)

The pipeline is: `SessionDiscovery` → `JSONLWatcher` → `AgentStateMachine` → `EventEmitter` → `broadcast()` → WebSocket clients → `PixelOfficeEngine`.

Nothing in this flow depends on map dimensions. The `AgentState.position` field is just `{x, y}` integers — no dimension check. The engine's `updateAgent()` receives position and calls `pathFinder.findPath()` which uses the current 30×24 grid.

The only WebSocket concern is the initial state snapshot sent on connection:
```typescript
const agents = stateMachine.getAgents();
const initMessage: WSMessage = { type: 'agent-update', payload: agents };
ws.send(JSON.stringify(initMessage));
```
If agents were assigned `DEFAULT_SEATS` positions (the race condition), those positions would be sent to the engine, which would then try to path to those wrong coordinates. With the real layout loaded, positions are valid.

### 7. TypeScript Compilation

**Confidence: HIGH** (verified by running `npm run typecheck`)

`npm run typecheck` exits with code 0 — **zero errors**. The `renderWidth?`/`renderHeight?` additions from Phase 4, the `FloorZone`/`ZONE_INDEX` additions from Phase 1, and all office-layout edits compile cleanly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Seat count verification | Custom test script | Trace code manually + fix source |
| Async load ordering | Complex lock mechanism | Single promise stored on instance |
| Walkability grid | New grid computation | Existing `cacheMovementTiles()` already correct |

---

## Common Pitfalls

### Pitfall 1: Fixing seat count by changing AC expectations
**What goes wrong:** Planner writes "40 seats meets AC because 40 > 20."
**Why it happens:** Misreading "20~24석" as a floor rather than a range.
**How to avoid:** The AC says "20~24석에 정상 배정됨" — the range has an upper bound. Fix the pod structure to yield exactly 20 seats (or up to 24 maximum).

### Pitfall 2: Patching DEFAULT_SEATS without fixing the async race
**What goes wrong:** DEFAULT_SEATS are updated to match new layout, but the race condition persists — first agents still get DEFAULT_SEATS positions briefly before the real layout loads.
**Why it happens:** Developer fixes the wrong symptom.
**How to avoid:** The real fix is making layout load awaitable. DEFAULT_SEATS correction is cosmetic.

### Pitfall 3: Forgetting to verify PathFinder reachability after seat reduction
**What goes wrong:** After reducing pods to fewer seats, a seat tile is placed adjacent to a wall or on a non-walkable tile.
**Why it happens:** Pod restructuring changes tile coordinates.
**How to avoid:** After any seat layout change, log `cacheMovementTiles()` output and confirm seat tiles appear in `walkableTiles` list.

### Pitfall 4: Breaking the `sortY: -1` monitor rendering
**What goes wrong:** Engine sorts renderables by `sortY`; monitors have `sortY: -1` relative offset. Touching furniture objects without understanding this causes monitors to render behind desks.
**Why it happens:** `sortY` property on FurnitureObject is a relative offset used in `ObjectRenderer.getSortY()`, not an absolute world Y.
**How to avoid:** Do not touch furniture object definitions in this phase unless fixing the seat count.

---

## Architecture Patterns

### Seat Count Fix Pattern (Option A — recommended)

Reduce `createPod` to one column instead of two:
```typescript
function createPod(sx: number, sy: number, prefix: string) {
  // Single column: remove outer i=0..1 loop, use sx directly
  const dx = sx;
  // top desk chairs (2 seats)
  for (let c = 0; c < 2; c++) { /* ... */ seats.push({ ... tileX: dx + c, tileY: sy + 1, ... }) }
  // bottom desk chairs (2 seats)
  for (let c = 0; c < 2; c++) { /* ... */ seats.push({ ... tileX: dx + c, tileY: sy + 2, ... }) }
  // 4 seats per pod × 5 pods = 20 seats total
}
```

Then update pod calls to space them appropriately (3 tiles per pod footprint instead of 6).

### StateMachine Layout Load Fix Pattern

```typescript
// state-machine.ts
private layoutReady: Promise<void>;

constructor() {
  super();
  this.layoutReady = this.loadOfficeLayout();
}

async waitForLayout(): Promise<void> {
  await this.layoutReady;
}

// server/index.ts — make server startup async
server.listen(PORT, async () => {
  await stateMachine.waitForLayout();
  discovery.start();
  stateMachine.start();
});
```

---

## Verification Checklist (for Planner to Include as Task)

After implementing fixes:
1. `npm run typecheck` → 0 errors
2. Log output from `[StateMachine] Loaded N seats` → confirm N = 20 (or target count)
3. Log output from `[Engine] Cached W walkable tiles, B break tiles` → W > 200, B > 50
4. Add 1–5 test agents via WebSocket and confirm positions fall within work zone bounds (x=9–28 or x=1–14)
5. Visually verify characters walk to seats and animate (typing/idle)

---

## State of the Art

| Old State | New State | Phase | Impact |
|-----------|-----------|-------|--------|
| 20×15 fallback layout | 30×24 with 6 zones | P2 | Fallback still says 20×15 — cosmetic fix needed |
| 12 DEFAULT_SEATS hardcoded | 40 real seats from office-layout | P2 | Async race condition introduced |
| Seat count comment "20 seats" | Actual: 40 seats | P2 | Comment wrong, AC violated |
| `renderWidth`/`renderHeight` absent | Added as optional | P4 | Furniture renders correctly |

---

## Open Questions

1. **Seat count design intent:** Is 40 seats intentional (capacity for up to 40 simultaneous Claude Code instances) or was it meant to be 20? Resolution: Check with R3.2 which says "총 좌석 20~24석." This confirms the intent is 20–24. Fix is needed.

2. **Pod spacing after seat reduction:** If single-column pods are used, Zone A (x=9–28, 20 tiles wide) can fit 5 single-column pods at x=10,13,17,20,24 with spacing. Zone B (x=1–14, 14 tiles wide) can fit 3 pods. Total = 8 pods × 4 seats = 32 still exceeds 24. The planner must determine the exact pod count and placement.

3. **`npm run dev` visual smoke test:** The research phase cannot run a browser. The plan should include a manual visual verification task as the final gate.

---

## Sources

### Primary (HIGH confidence)
- `src/engine/PathFinder.ts` — verified generic, no hardcoded dimensions
- `src/engine/index.ts` — verified `PathFinder` init, `cacheMovementTiles`, FALLBACK_LAYOUT
- `src/engine/CharacterBehavior.ts` — verified no hardcoded coordinates
- `src/engine/Character.ts` — verified path-following and behavior integration
- `src/server/state-machine.ts` — verified async race condition, DEFAULT_SEATS
- `src/shared/office-layout.ts` — verified seat count via code tracing
- `src/shared/types.ts` — verified type contracts
- `npm run typecheck` output — 0 errors confirmed

### Tertiary (LOW confidence — not researched)
- Visual rendering of characters in the expanded map — not verifiable without browser run

---

## Metadata

**Confidence breakdown:**
- PathFinder compatibility: HIGH — code is generic, verified
- Seat count defect: HIGH — traced execution, confirmed 40 seats
- Async race condition: HIGH — constructor pattern clearly creates race
- CharacterBehavior compatibility: HIGH — no hardcoded values found
- WebSocket E2E flow: HIGH — no dimension-dependent logic
- TypeScript: HIGH — typecheck passes, verified

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable codebase)
