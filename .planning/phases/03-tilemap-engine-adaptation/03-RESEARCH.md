# Phase 3: TileMap Engine Adaptation - Research

**Researched:** 2026-03-30
**Domain:** Canvas 2D tile rendering, viewport camera, walkability grid
**Confidence:** HIGH — all findings derived from direct source code inspection

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| R5.1 | TileMap — 6개 존 컬러 시스템 (하드코딩 → 설정 기반) | `getZoneColor()` switch covers only 3 cases; 3 new zone indices fall to broken default. Replace switch with a lookup map. |
| R5.2 | 전체 가구에 walkableMask 적용 (현재 소파/식물/책장 등 누락) | Phase 2 already enforces all furniture has `walkableMask` via runtime throw. `cacheMovementTiles()` logic is structurally correct for 30×24. Needs verification pass, not rewrite. |
| R5.5 | Camera — 초기 뷰포트가 30×24 맵 전체를 적절히 표시 | Auto-fit formula in `initialize()` is correct and self-adapts to any world size. Only the `minZoom` floor (0.5) may need relaxing for small viewports. |
</phase_requirements>

---

## Summary

Phase 2 delivered a fully populated 30×24 `office-layout.ts` with all 6 zone floor tiles (`spriteIndex` 0–5) and 80+ furniture objects each carrying a `walkableMask`. Phase 3 must close the gap between what the layout emits and what the engine currently renders.

The single breaking defect is in `TileMap.getZoneColor()`: the switch handles indices 0, 1, 2 only — indices 3 (`server`), 4 (`meeting`), and 5 (`lobby`) collapse to the `default` case which returns `'#a0744a'` (same brown as the work zone). This makes server room, meeting room, and lobby floors visually identical to work desks, violating R5.1 and the acceptance criterion "6개 존이 시각적으로 구분됨".

The `cacheMovementTiles()` function in `index.ts` is already dimension-agnostic — it reads `this.layout.width` / `this.layout.height` and iterates accordingly. It correctly handles furniture `walkableMask` arrays using flat index `dy * widthTiles + dx`. Phase 2's compile-time guard (`throw new Error('Furniture missing walkableMask: ...')`) ensures no furniture arrives without a mask. No structural rewrite is needed for R5.2, only a verification that mask sizes match the declared `widthTiles × heightTiles`.

Camera auto-fit in `initialize()` computes `fitZoom = Math.min(zoomX, zoomY)` where `zoomX = (viewportWidth * 0.9) / worldWidth` and `zoomY = (viewportHeight * 0.9) / worldHeight`. For the 480×384 world, this produces a reasonable fit on any modern viewport — no logic change is required. The only potential issue is `minZoom = 0.5` which is a hardcoded `readonly` constant on the `Camera` class; if a very small viewport needs to zoom out further, the floor will clip the fit. This is LOW risk.

**Primary recommendation:** Change `getZoneColor()` from a `switch` to a `Record<number, string>` lookup with all 6 indices; verify walkableMask array lengths match tile footprints; confirm camera renders the full 30×24 map by running `npm run dev`.

---

## Standard Stack

### Core (no new dependencies)
| Component | Location | Purpose |
|-----------|----------|---------|
| Canvas 2D API | browser native | Tile and sprite rendering |
| TypeScript | project-wide | Type safety for zone index mapping |

No new npm packages are needed for this phase. All changes are within existing engine files.

---

## Architecture Patterns

### Recommended Project Structure
No structural changes. Modifications are within:
```
src/engine/TileMap.ts        — zone color lookup (R5.1)
src/engine/index.ts          — walkableMask verification (R5.2), camera confirm (R5.5)
src/engine/Camera.ts         — read-only reference; minZoom may need loosening
```

### Pattern 1: Zone Color Lookup Map
**What:** Replace the 3-case `switch` with a `Record<number, string>` keyed by `ZONE_INDEX` values.
**When to use:** Any time a numeric enum index needs to map to a rendering attribute — lookup maps are easier to extend than switch statements.
**Example:**
```typescript
// Source: src/engine/TileMap.ts — current broken implementation (lines 162-169)
// BAD — cases 3, 4, 5 fall through to default returning same color as case 1
private getZoneColor(spriteIndex: number): string {
  switch (spriteIndex) {
    case 0:  return '#c4a882'; // corridor
    case 1:  return '#a0744a'; // work
    case 2:  return '#b8895a'; // lounge
    default: return '#a0744a'; // BUG: server/meeting/lobby all look like work zone
  }
}

// GOOD — covers all 6 ZONE_INDEX values (0-5)
private static readonly ZONE_COLORS: Record<number, string> = {
  0: '#d4c8b0', // corridor — light beige
  1: '#a0744a', // work     — medium brown
  2: '#b8895a', // lounge   — warm mid-tone
  3: '#2a2a3a', // server   — dark navy
  4: '#3a6b4a', // meeting  — forest green
  5: '#e8e0d0', // lobby    — cream
};

private getZoneColor(spriteIndex: number): string {
  return TileMap.ZONE_COLORS[spriteIndex] ?? '#a0744a';
}
```

### Pattern 2: WalkableMask Flat Index
**What:** The existing mask indexing formula `dy * obj.widthTiles + dx` is correct row-major order.
**When to use:** Every furniture footprint iteration in `cacheMovementTiles()`.
**Example:**
```typescript
// Source: src/engine/index.ts lines 449-463 — already correct, do not change
for (let dy = 0; dy < obj.heightTiles; dy++) {
  for (let dx = 0; dx < obj.widthTiles; dx++) {
    const maskIdx = dy * obj.widthTiles + dx;
    const isWalkable = obj.walkableMask ? obj.walkableMask[maskIdx] : false;
    // ...
  }
}
```

### Pattern 3: Camera Auto-Fit
**What:** Auto-fit zoom is computed from viewport vs world dimensions. No change needed.
**Current calculation** (src/engine/index.ts lines 344-356):
```typescript
// worldSize for 30×24 at tileSize=16: { width: 480, height: 384 }
// Example viewport 1280×720:
//   zoomX = (1280 * 0.9) / 480 = 2.4
//   zoomY = (720 * 0.9) / 384  = 1.6875
//   fitZoom = min(2.4, 1.6875)  = 1.6875  ✓ shows full map with 10% padding
const padding = 0.9;
const zoomX = (this.camera.viewportWidth * padding) / worldSize.width;
const zoomY = (this.camera.viewportHeight * padding) / worldSize.height;
const fitZoom = Math.min(zoomX, zoomY);
this.camera.setZoom(Math.max(fitZoom, this.camera.minZoom));
```
For any typical browser viewport (>540px wide, >432px tall), `fitZoom` will exceed `minZoom=0.5`, so the auto-fit path is taken and the full map is displayed.

### Anti-Patterns to Avoid
- **Modifying `Camera.minZoom` to 0` :** The readonly minZoom=0.5 is there to prevent invisible zoom. Only change it if a concrete viewport scenario fails the auto-fit — not preemptively.
- **Adding zone color to TileInfo:** The `spriteIndex` already encodes zone id (set by `ZONE_INDEX[zone]` in Phase 2). Adding a second field would duplicate data.
- **Rewriting cacheMovementTiles() for 30×24:** The current code uses `this.layout.width/height` dynamically. No rewrite needed — only add a console.assert or verification log if desired.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Zone-to-color mapping | Custom zone string comparison | `ZONE_INDEX` numeric lookup | Phase 1 already established the integer mapping; use it directly |
| Walkability grid dimensions | Hardcoded 30×24 | `this.layout.width / height` | Already parameterized; hardcoding would break FALLBACK_LAYOUT (20×15) |

---

## Common Pitfalls

### Pitfall 1: Corridor Color Mismatch Between Spec and Current Code
**What goes wrong:** The additional context specifies corridor as `#d4c8b0`. The current `case 0` in `getZoneColor()` returns `#c4a882` (a slightly different warm beige). If the planner copies the current code without updating case 0, the corridor color will not match the target spec.
**Why it happens:** Phase 1 introduced `ZONE_INDEX.corridor = 0` but `getZoneColor()` was not updated to match the desired colors for all 6 zones.
**How to avoid:** Replace ALL 6 color values when writing the new lookup, not just adding cases 3/4/5.
**Warning signs:** Corridor tiles look orange-brown instead of the specified light beige.

### Pitfall 2: WalkableMask Array Length Mismatch
**What goes wrong:** If a furniture object has `widthTiles: 4, heightTiles: 4` but `walkableMask` has fewer than 16 entries, `maskIdx` accesses `undefined` (treated as falsy — tile marked not walkable, which is safe but silent).
**Why it happens:** `Array(16).fill(false)` is correct for 4×4, but manual array literals can have wrong lengths.
**How to avoid:** The Phase 2 validation (`throw new Error('Furniture missing walkableMask: ...')`) catches absent masks but NOT wrong-length masks. Verification step should check `mask.length === widthTiles * heightTiles` for all furniture.
**Specific cases to check:**
- `rack-0..3`: `widthTiles:4, heightTiles:4` → mask length must be 16. Phase 2 uses `Array(16).fill(false)`. ✓
- `sofa-lounge-green/cyan`: `widthTiles:4, heightTiles:1` → mask length must be 4. Phase 2 uses `[false, false, false, false]`. ✓
- `fridge`: `widthTiles:2, heightTiles:3` → mask length must be 6. Phase 2 uses `Array(6).fill(false)`. ✓
- Meeting `carpet-mtg`: `widthTiles:6, heightTiles:5` → mask length must be 30. Phase 2 uses `Array(30).fill(true)`. ✓
- `fireplace`: `widthTiles:3, heightTiles:3` → mask length must be 9. Phase 2 uses `Array(9).fill(false)`. ✓

### Pitfall 3: Wall Tile Furniture Walkability Double-Application
**What goes wrong:** Several furniture items are placed on outer wall tiles (e.g., windows at `tileY:0`, paintings at `tileX:3, tileY:1` which is a floor tile — fine). The `walkableMask` sets those tiles to `false`, but they are already `walkable:false` from the tile grid. This is safe (false AND false = false) but produces a redundant write into `walkGrid`.
**Why it happens:** Windows use `layer:'wall'` and sit on `y=0` outer wall tiles. Their `walkableMask:[false,false]` tries to set `walkGrid[0][tileX]` to false — already false.
**How to avoid:** No action needed. The behavior is correct. Do not add special-case logic.

### Pitfall 4: Camera minZoom vs Small Viewport
**What goes wrong:** If the canvas is rendered inside a panel narrower than ~267px or taller aspect ratio than 4:3, `fitZoom` may drop below `minZoom=0.5`, causing `Math.max(fitZoom, 0.5)` to clip at 0.5 and show a partial map.
**Why it happens:** `Camera.minZoom` is `readonly 0.5`, set in the class definition. `setZoom()` clamps to this floor.
**How to avoid:** At 480×384 world size, `minZoom=0.5` allows viewport down to 240×192px before clipping. This is safe for any realistic browser panel. If the canvas is smaller than 240px wide in production, set `minZoom` to a lower value (0.25) via a constructor parameter.
**Warning signs:** Map is partially off-screen on initial load with no way to zoom out further.

### Pitfall 5: Furniture on Corridor Row y=10 / y=16 Edge Tiles
**What goes wrong:** `plant-3` is at `tileX:9, tileY:10` (a corridor floor tile). Its `walkableMask:[false]` correctly blocks that tile. `plant-4` is at `tileX:14, tileY:10` — also corridor floor, also correctly blocked. No problem here.
**Why it happens:** Edge corridor rows contain plants, which must be walkable:false.
**How to avoid:** Already handled. Verify visually that plants appear on the correct tiles after rendering.

---

## Code Examples

### R5.1 Complete Replacement for getZoneColor()
```typescript
// Source: direct analysis of src/engine/TileMap.ts + src/shared/types.ts ZONE_INDEX
// Replace lines 159-169 in TileMap.ts

/**
 * Zone floor colors keyed by spriteIndex (= ZONE_INDEX[zone] from types.ts).
 *   0 = corridor  (#d4c8b0 — light beige)
 *   1 = work      (#a0744a — medium brown)
 *   2 = lounge    (#b8895a — warm mid-tone)
 *   3 = server    (#2a2a3a — dark navy)
 *   4 = meeting   (#3a6b4a — forest green)
 *   5 = lobby     (#e8e0d0 — cream)
 */
private static readonly ZONE_COLORS: Record<number, string> = {
  0: '#d4c8b0',
  1: '#a0744a',
  2: '#b8895a',
  3: '#2a2a3a',
  4: '#3a6b4a',
  5: '#e8e0d0',
};

private getZoneColor(spriteIndex: number): string {
  return TileMap.ZONE_COLORS[spriteIndex] ?? '#a0744a';
}
```

### R5.2 Verification Log Addition (optional, non-breaking)
```typescript
// Add at end of cacheMovementTiles() in src/engine/index.ts
// after the existing console.log on line 505

// Optional: verify all furniture mask lengths match footprint
if (furniture) {
  for (const obj of furniture) {
    const expected = obj.widthTiles * obj.heightTiles;
    if (obj.walkableMask && obj.walkableMask.length !== expected) {
      console.warn(
        `[Engine] walkableMask length mismatch on "${obj.id}": ` +
        `expected ${expected}, got ${obj.walkableMask.length}`
      );
    }
  }
}
```

### R5.5 Camera Calculation Verification (no code change required)
```
World size:  480 × 384 px  (30 tiles × 16 + 24 tiles × 16)
Viewport example: 1280 × 720 (HD)
  zoomX = (1280 × 0.9) / 480 = 2.40
  zoomY = (720  × 0.9) / 384 = 1.688
  fitZoom = min(2.40, 1.688) = 1.688   → full map visible, 10% padding

Viewport example: 800 × 600 (small)
  zoomX = (800 × 0.9) / 480 = 1.50
  zoomY = (600 × 0.9) / 384 = 1.406
  fitZoom = 1.406  → full map still visible

Minimum viewport before minZoom clipping:
  fitZoom < 0.5 when viewportWidth < 267px OR viewportHeight < 214px
  → Safe for all realistic browser viewports
```

---

## State of the Art

| Aspect | Current State | After Phase 3 | Notes |
|--------|--------------|---------------|-------|
| Zone color rendering | 3 cases (0/1/2), indices 3/4/5 broken | 6 cases via lookup map | Only TileMap.ts change |
| walkableMask coverage | All furniture has mask (Phase 2 enforced) | Verified correct | No code change needed |
| Camera viewport | Correct auto-fit formula already in place | Confirmed working | No code change needed |
| Interior partition walls | Render as wall tiles — correct | No change | office-layout.ts uses wall() |

---

## Open Questions

1. **Plank line rendering on dark server floor**
   - What we know: The server floor color `#2a2a3a` is very dark. The plank line overlay `rgba(0,0,0,0.07)` will be invisible.
   - What's unclear: Whether the design intent for the server room is a distinct texture pattern vs just a dark flat color.
   - Recommendation: Either skip plank lines for `spriteIndex === 3` (server) or use a lighter overlay `rgba(255,255,255,0.05)` for dark zones. The planner should decide and include in the task.

2. **Corridor color change from `#c4a882` to `#d4c8b0`**
   - What we know: The additional context specifies `corridor=#d4c8b0`. The current case 0 is `#c4a882`.
   - What's unclear: Whether `#c4a882` was intentional from an earlier design pass or is just a placeholder.
   - Recommendation: Use the spec color `#d4c8b0` when rewriting the zone color map. The visual difference is subtle (both are warm beige).

3. **Camera minZoom adjustment**
   - What we know: `minZoom = 0.5` is `readonly` and is the floor for all zoom operations including auto-fit.
   - What's unclear: Whether the production canvas will ever be narrower than ~270px.
   - Recommendation: No change needed. If Phase 5 reveals zoom issues, change `readonly minZoom = 0.5` to `0.25` in Camera.ts.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files found |
| Config file | none — Wave 0 gap |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck && npm run dev` (visual) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R5.1 | 6 zone colors render distinctly | visual / smoke | `npm run typecheck` (type safety) + visual in browser | ❌ Wave 0 |
| R5.2 | All furniture walkableMask applied correctly | unit | `npm run typecheck` (mask coverage via throw in office-layout.ts) | ✅ (runtime assertion) |
| R5.5 | Camera shows full 30×24 map on start | visual | `npm run dev` + visual inspection | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck` + visual smoke test via `npm run dev`
- **Phase gate:** `npm run typecheck` clean before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No automated test for zone color correctness — manual visual check via `npm run dev` is the gate
- [ ] No automated test for camera viewport — manual visual check
- [ ] `npm run typecheck` passes trivially for color values (strings) — type system cannot enforce hex correctness

*(Existing `office-layout.ts` runtime assertion covers R5.2's walkableMask presence. Mask length correctness is manual-verify.)*

---

## Sources

### Primary (HIGH confidence)
- `src/engine/TileMap.ts` — complete file read; `getZoneColor()` switch at lines 162-169
- `src/engine/index.ts` — complete file read; `cacheMovementTiles()` at lines 436-505; camera auto-fit at lines 344-356
- `src/engine/Camera.ts` — complete file read; `minZoom` at line 22; `setZoom()` clamp at lines 53-56
- `src/shared/types.ts` — `ZONE_INDEX` mapping at lines 30-37; `TileInfo.spriteIndex` usage confirmed
- `src/shared/office-layout.ts` — complete read; all 6 zone floor assignments; walkableMask coverage confirmed; furniture count 80+

### Secondary (MEDIUM confidence)
- None required — all findings from direct code inspection

---

## Metadata

**Confidence breakdown:**
- R5.1 zone color bug: HIGH — exact lines identified, root cause confirmed (switch missing cases 3/4/5)
- R5.2 walkableMask: HIGH — current code is structurally correct; Phase 2 enforcement verified
- R5.5 camera: HIGH — formula traced through, arithmetic verified for 30×24 world
- Open question (plank lines on dark floor): LOW — aesthetic decision, not a code defect

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable codebase; no external dependencies)
