# Phase 4: ObjectRenderer & Sprites - Research

**Researched:** 2026-03-30
**Domain:** Canvas 2D sprite rendering — region coordinates, scaling, drawOffsetY calibration
**Confidence:** HIGH (all findings verified against actual PNG files)

---

## Summary

Phase 4 must fix two distinct categories of bug discovered during Phase 3 human verification: (1) **wrong SPRITES region coordinates** — the majority of furniture types in `office-layout.ts` reference incorrect `sx`/`sw`/`sh` values that point to wrong cells or use wrong dimensions compared to actual MetroCity PNG files, and (2) **sprite scaling mismatch** — `ObjectRenderer.renderObject()` draws sprites at their native `sw * zoom` pixel width, but many sprites have source regions that are 2–3x wider than their tile footprint requires. Both bugs cause the visual issues seen in Phase 3.

The primary engine fix is small: add optional `renderWidth?: number` and `renderHeight?: number` fields to `FurnitureObject` in `types.ts`, then use `(obj.renderWidth ?? sw) * zoom` and `(obj.renderHeight ?? sh) * zoom` as the destination dimensions in `renderObject()`. This lets each object declare its intended display size independently from its source region, which can be the full sprite cell. `isVisible()` needs a matching update using the same resolved dimensions.

All 17 SPRITES region corrections are fully enumerated below with pixel-level evidence from direct image analysis. Zero guesswork remains — every `sx`, `sy`, `sw`, `sh` value has been verified by cropping the actual PNG file.

**Primary recommendation:** Fix SPRITES region table in `office-layout.ts`, add `renderWidth`/`renderHeight` to `FurnitureObject` type and `ObjectRenderer`, then update every `furniture.push()` call to declare its display size. The `drawOffsetY` values follow a derivable rule (`drawOffsetY = -(renderHeight - heightTiles * tileSize)`) and are documented per type.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| R5.3 | ObjectRenderer — support rendering of all new furniture types correctly | All 17 SPRITES region corrections documented; engine scaling fix designed; drawOffsetY values derived |
</phase_requirements>

---

## Standard Stack

### Core (no new dependencies)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| Canvas 2D API | browser native | `drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)` | Phase 4 uses the 9-arg form already |
| TypeScript | project version | Type-safe `FurnitureObject` extension | Add `renderWidth?` / `renderHeight?` |

No new npm packages are needed. All changes are in existing project files.

**Installation:** none required.

---

## Architecture Patterns

### How ObjectRenderer Draws Sprites

`ObjectRenderer.renderObject()` (line 78–101 of `src/engine/ObjectRenderer.ts`):

```typescript
// Source: src/engine/ObjectRenderer.ts lines 82-99
const { sx, sy, sw, sh } = obj.sprite.region;

const worldX = obj.tileX * this.tileSize;
const worldY = obj.tileY * this.tileSize - (obj.drawOffsetY ?? 0);

const screenPos = camera.worldToScreen(worldX, worldY);

const drawWidth  = sw * camera.zoom;   // <-- BUG: uses source region size, not intended display size
const drawHeight = sh * camera.zoom;

ctx.drawImage(sheet, sx, sy, sw, sh, screenPos.x, screenPos.y, drawWidth, drawHeight);
```

The destination dimensions `drawWidth`/`drawHeight` come directly from `sw`/`sh`. When a sprite cell is 96x96 source pixels but the furniture only occupies a 2x1 tile footprint (32x16 world pixels), the sprite renders 3x too wide and overlaps adjacent tiles.

### Pattern 1: renderWidth / renderHeight Override (the fix)

Add two optional fields to `FurnitureObject`:

```typescript
// In src/shared/types.ts — add to FurnitureObject interface
renderWidth?: number;   // pixel width to draw at (overrides sw for destination)
renderHeight?: number;  // pixel height to draw at (overrides sh for destination)
```

Update `ObjectRenderer.renderObject()`:

```typescript
// src/engine/ObjectRenderer.ts — renderObject fix
const { sx, sy, sw, sh } = obj.sprite.region;
const drawWidth  = (obj.renderWidth  ?? sw) * camera.zoom;
const drawHeight = (obj.renderHeight ?? sh) * camera.zoom;
// rest unchanged
```

Update `ObjectRenderer.isVisible()` to use resolved dimensions:

```typescript
// src/engine/ObjectRenderer.ts — isVisible fix
const rw = obj.renderWidth  ?? obj.sprite.region.sw;
const rh = obj.renderHeight ?? obj.sprite.region.sh;
const objRight  = objLeft + rw;
const objBottom = objTop  + rh;
```

This is backward-compatible: existing objects without `renderWidth`/`renderHeight` continue to work exactly as before.

### Pattern 2: drawOffsetY Derivation Rule

`drawOffsetY` is stored as a **positive number** but applied as subtraction:

```
worldY = tileY * tileSize - (obj.drawOffsetY ?? 0)
```

So positive `drawOffsetY` shifts the sprite **upward**. The goal for most objects is that the sprite's visual bottom edge aligns with the bottom of the tile footprint:

```
sprite_bottom = worldY + renderHeight
             = tileY * tileSize - drawOffsetY + renderHeight

For sprite_bottom = (tileY + heightTiles) * tileSize:
  drawOffsetY = renderHeight - heightTiles * tileSize
```

This gives the canonical value. Values above zero extend the sprite up above the footprint top; values below zero would sink the sprite below the footprint (not useful for furniture).

### Anti-Patterns to Avoid

- **Using sw for both source and destination:** The 9-arg `drawImage` destination size is separate from the source size — always distinguish them.
- **Hardcoding dest pixels in renderObject:** The `renderWidth`/`renderHeight` override belongs on the data object, not in the renderer code. The renderer stays generic.
- **Changing widthTiles/heightTiles to match sprite size:** These drive walkability and depth sort, not rendering size. They must stay semantically correct.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sprite atlas packing | Custom atlas generator | Existing MetroCity PNGs | All assets already exist |
| Pixel-perfect scaling | Custom bilinear filter | `ctx.imageSmoothingEnabled = false` (already set in engine) | Browser canvas handles this |
| Per-type render dispatch | Type-switch in renderer | `renderWidth`/`renderHeight` on data | Generic renderer stays simple |

---

## Common Pitfalls

### Pitfall 1: sx/sw Confusion with Stride

**What goes wrong:** Kitchen1-Sheet has 96px-wide cells. If `CHAIR_DOWN` is defined as `sx:32, sw:16`, it extracts a 16px strip starting 32px into cell 0 — showing part of a chair back, not the front-facing chair in cell 1 (sx=96).

**Why it happens:** The original SPRITES constants were written assuming the old tile-sheet convention (small uniform stride), not the actual MetroCity cell grid.

**How to avoid:** For every sprite, determine the cell index first (`col = cell number`), then `sx = col * cellWidth`. Verify by extracting the cell as an image.

**Warning signs:** Desk showing a chair back-view; monitor showing the side of a TV box; chair showing an empty area.

### Pitfall 2: Sheet Height Mismatch (Windows, Lights)

**What goes wrong:** `WINDOW_WOOD` was defined with `sh:48` but the Windows-Sheet is 64px tall. Canvas clips the source rectangle at the sheet boundary, but if `sh:48 < 64` it silently truncates the bottom of the sprite.

**Why it happens:** The SPRITES table was written from visual estimates, not from measured file dimensions.

**How to avoid:** Always read actual PNG dimensions (`Image.open(path).size` or similar) before writing `sw`/`sh`.

### Pitfall 3: drawOffsetY Sign Convention

**What goes wrong:** A developer writes `drawOffsetY: 8` thinking it shifts up, but in the current engine `worldY = tileY * tileSize - drawOffsetY`, so positive values shift up. Negative values would shift down — which is rarely useful.

**How to avoid:** Document: positive `drawOffsetY` = visual offset upward from tile origin. Use the derivation formula: `drawOffsetY = renderHeight - heightTiles * tileSize`.

### Pitfall 4: isVisible Uses Old sw/sh

**What goes wrong:** After adding `renderWidth`/`renderHeight` to `renderObject`, `isVisible()` still uses the raw `sw`/`sh` for the bounding box test. A lamp with `sw:64` but `renderWidth:16` would still cull correctly, but a sofa with `sw:80` and `renderWidth:64` would use wrong culling bounds.

**How to avoid:** Update `isVisible()` at the same time as `renderObject()`.

### Pitfall 5: Monitor sortY Annotation

**What goes wrong:** Monitors are placed at the same tile as desks (`sortY: -1`), so they sort before the desk. After fixing coordinates, if `sortY: -1` is still in world-pixel terms, it would always sort to the very beginning of the render list.

**Note from office-layout.ts:** `sortY: -1` is stored as a tile-row index, but `getSortY()` multiplies it: `return (row + 1) * this.tileSize`. With `row = -1`, `getSortY = 0` which sorts the monitor before everything. This is the intended behavior (monitor behind desk). Do not change it.

---

## Code Examples

### Corrected renderObject (engine change)

```typescript
// src/engine/ObjectRenderer.ts
renderObject(ctx: CanvasRenderingContext2D, camera: Camera, obj: FurnitureObject): void {
  const sheet = this.sheets.get(obj.sprite.sheetId);
  if (!sheet) return;

  const { sx, sy, sw, sh } = obj.sprite.region;

  const worldX = obj.tileX * this.tileSize;
  const worldY = obj.tileY * this.tileSize - (obj.drawOffsetY ?? 0);

  const screenPos = camera.worldToScreen(worldX, worldY);

  // Use explicit render dimensions when provided; fall back to source region size
  const drawWidth  = (obj.renderWidth  ?? sw) * camera.zoom;
  const drawHeight = (obj.renderHeight ?? sh) * camera.zoom;

  ctx.drawImage(sheet, sx, sy, sw, sh, screenPos.x, screenPos.y, drawWidth, drawHeight);
}
```

### Corrected isVisible

```typescript
// src/engine/ObjectRenderer.ts
private isVisible(obj: FurnitureObject, camera: Camera): boolean {
  const rw = obj.renderWidth  ?? obj.sprite.region.sw;
  const rh = obj.renderHeight ?? obj.sprite.region.sh;

  const objLeft   = obj.tileX * this.tileSize;
  const objTop    = obj.tileY * this.tileSize - (obj.drawOffsetY ?? 0);
  const objRight  = objLeft + rw;
  const objBottom = objTop  + rh;

  const visible = camera.getVisibleRect();
  return (
    objRight  > visible.left &&
    objLeft   < visible.right &&
    objBottom > visible.top &&
    objTop    < visible.bottom
  );
}
```

### Example furniture object with renderWidth/renderHeight

```typescript
// src/shared/office-layout.ts — desk example
furniture.push({
  id: 'desk-A1-top-0', type: 'desk',
  tileX: 10, tileY: 2, widthTiles: 2, heightTiles: 1,
  walkableMask: [false, false],
  sprite: SPRITES.DESK_TOP,
  renderWidth: 32, renderHeight: 32,  // NEW
  drawOffsetY: 16,                     // renderHeight(32) - heightTiles(1)*tileSize(16) = 16
});
```

---

## Sprite Sheet Verified Dimensions

All dimensions measured from actual PNG files on 2026-03-30.

| Sheet ID | File | Actual Size | Cell Grid | Cell Size |
|----------|------|-------------|-----------|-----------|
| kitchen1 | Kitchen1-Sheet.png | 576x96 | 6x1 | 96x96 |
| tv | TV-Sheet.png | 256x96 | 4x1 | 64x96 |
| livingRoom1 | LivingRoom1-Sheet.png | 384x960 | 4x10 | 96x96 |
| beds1 | Beds1-Sheet.png | 256x320 | 4x5 | 64x64 |
| chimney | Chimney-Sheet.png | 384x48 | 8x1 | 48x48 |
| chimney1 | Chimney1-Sheet.png | 256x32 | 8x1 | 32x32 |
| doorsHospital | DoorsHospital-Sheet.png | 800x80 | 10x1 | 80x80 |
| kitchen | Kitchen-Sheet.png | 1152x96 | 12x1 | 96x96 |
| flowers | Flowers-Sheet.png | 384x96 | 12x1 | 32x96 |
| miscHospital | Miscellaneous-Sheet.png | 3072x64 | ~96x1 | 32x64 |
| bathroom | Bathroom-Sheet.png | 576x96 | 6x1 | 96x96 |
| windows | Windows-Sheet.png | 896x64 | 14x1 | 64x64 |
| lights | Lights-Sheet.png | 384x64 | 6x1 | 64x64 |
| doors | Doors-Sheet.png | 1344x128 | 14x1 | 96x128 |
| carpet | Carpet-Sheet.png | 320x64 | 5x1 | 64x64 |
| paintings | Paintings-Sheet.png | 320x32 | 10x1 | 32x32 |
| paintings1 | Paintings1-Sheet.png | 160x32 | 5x1 | 32x32 |
| cupboard | Cupboard-Sheet.png | 576x96 | 6x1 | 96x96 |

---

## SPRITES Region Corrections Table

17 corrections verified against actual PNG crops. Each entry shows the current (broken) value and the correct value.

### Category A: Wrong Cell (sx points to wrong sprite)

| Sprite | Sheet | Old sx | Old sw | Correct sx | Correct sw | Correct sh | Evidence |
|--------|-------|--------|--------|------------|------------|------------|---------|
| CHAIR_DOWN | kitchen1 | 32 | 16 | 96 | 96 | 96 | col1=front-facing chair (was 32px into col0) |
| CHAIR_LEFT | kitchen1 | 16 | 16 | 192 | 96 | 96 | col2=left-facing (was 16px into col0) |
| CHAIR_RIGHT | kitchen1 | 48 | 16 | 288 | 96 | 96 | col3=right-facing (was 48px into col0) |
| CHAIR_UP | kitchen1 | 0 | 16 | 0 | 96 | 96 | col0=back-facing chair — sx correct, sw wrong |
| DESK_TOP | kitchen1 | 256 | 80 | 384 | 96 | 96 | col4=desk with legs (sx:256 was col2=chair!) |
| DESK_BOT | kitchen1 | 336 | 80 | 480 | 96 | 96 | col5=plain desk top |
| MONITOR | tv | 16 | 32 | 128 | 64 | 96 | col2=flat screen (sx:16 was inside tall-TV col0) |
| TV_LARGE | tv | 128 | 128 | 128 | 64 | 96 | col2=flat screen; sw:128 spanned 2 cells |
| KITCHEN_FRIDGE | kitchen | 96 | 96 | 672 | 96 | 96 | col7=tall fridge unit (sx:96 was counter col1) |
| KITCHEN_COUNTER | kitchen | 0 | 96 | 96 | 96 | 96 | col1=counter-with-drawers (sx:0 was shelf) |
| RECEPTION_DESK | kitchen | 576 | 96 | 768 | 96 | 96 | col8=cabinet-counter (sx:576 was stove) |

### Category B: Wrong Dimensions (sx approximately right, sw/sh incorrect)

| Sprite | Sheet | Old sw | Old sh | Correct sw | Correct sh | Evidence |
|--------|-------|--------|--------|------------|------------|---------|
| WINDOW_WOOD | windows | 48 | 48 | 64 | 64 | Sheet is 64px tall; cells are 64x64 |
| WINDOW_BLUE | windows | 48 | 48 | 64 | 64 | Also sx:96 -> sx:256 (col4 = blue modern) |
| WINDOW_PURPLE | windows | 64 | 64 | 64 | 64 | Also sx:192 -> sx:576 (col9 = dark 4-pane) |
| WINDOW_WHITE | windows | 64 | 64 | 64 | 64 | Also sx:288 -> sx:384 (col6 = white/clean) |
| LAMP | lights | 32 | 32 | 64 | 64 | Cell is 64x64; sw:32 clips lamp off-center |
| LAMP_BROWN | lights | 32 | 32 | 64 | 64 | Same; lamp content at cell x=24-40 |

### Category C: Correct Region, No Engine Fix Needed

These sprites have correct source regions and render acceptably at native size:

| Sprite | Sheet | Note |
|--------|-------|------|
| SERVER_RACK_* | beds1 | 64x64 cells exactly match 4x4-tile footprint (64px) |
| SOFA_* variants | livingRoom1 | 96x96 cell; sprite content ~48px; slight bleed is acceptable for sofas |
| CARPET | carpet | 64x64 cell for 4x4-tile use — exact match. For 6x5-tile meeting room carpet needs renderWidth=96, renderHeight=80 |
| CHIMNEY_* | chimney | 48x48 cells match 3x3-tile footprint exactly |
| CHIMNEY1_* | chimney1 | 32x32 cells — small size, any scaling acceptable |
| PAINTING_* | paintings | 32x32 cells — exact 1x1-tile fit |
| PLANT_* | flowers | 32-wide cells but content is ~10-15px; renderWidth=16 recommended |
| WATER_COOLER | miscHospital | sx:816 verified — content present at that offset |
| DOOR_HOSP_DOUBLE | doorsHospital | 80x80 cell; used as wall-layer door |

---

## renderWidth / renderHeight Per Object Type

These are the display pixel sizes each furniture type should use. Derived from: `renderWidth = widthTiles * tileSize` for width-fitting; height is either footprint-exact or chosen for visual appeal.

| Type | renderWidth | renderHeight | drawOffsetY | Rule |
|------|------------|-------------|-------------|------|
| CHAIR (all) | 16 | 24 | 8 | 24-16=8 above tile bottom |
| DESK_TOP/BOT | 32 | 32 | 16 | 32-16=16 above tile bottom |
| MONITOR (flat) | 32 | 16 | 0 | flat, sits at tile bottom |
| SERVER_RACK | 64 | 64 | 0 | exact fit; no change from current |
| SOFA_FRONT/BACK | 64 | 32 | 16 | 32-16=16 above bottom |
| PLANT (1-tile) | 16 | 32 | 16 | tall plant extends above tile |
| LAMP | 16 | 24 | 8 | lamp extends above tile |
| KITCHEN_FRIDGE | 32 | 48 | 0 | exactly 3 tiles tall (3*16=48) |
| KITCHEN_COUNTER | 32 | 32 | 16 | 2 tile wide, 2 tile visual height |
| RECEPTION_DESK | 32 | 32 | 16 | same as counter |
| WATER_COOLER | 16 | 32 | 0 | exactly 2 tiles tall |
| CARPET (6x5) | 96 | 80 | 0 | scale to fill meeting room area |
| CARPET (4x4) | 64 | 64 | 0 | exact fit, no change |
| WINDOW | 64 | 48 | 0 | wall-layer; rendered on wall tile |
| DOOR (regular) | 64 | 80 | 64 | tall door frame |
| DOOR_HOSP | 80 | 80 | 64 | full 80x80 cell |
| CHIMNEY | 48 | 48 | 0 | exact 3x3 tile fit |
| PAINTING | 32 | 32 | 0 | exact 1x1 tile fit |
| BOOKSHELF | 32 | 48 | 16 | extends above 1-tile row |
| FIREPLACE | 48 | 48 | 0 | 3x3 tile chimney sprite |

**Note on drawOffsetY sign convention:** Stored as positive value, applied as `worldY -= drawOffsetY`. Positive = moves sprite up. Current code is correct; values in the table above are positive.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| sw/sh directly as dest size | renderWidth/renderHeight override | Phase 4 | Fixes oversized rendering |
| Guessed sprite coordinates | Measured from PNG crops | Phase 4 | Correct cell selection |
| Single drawOffsetY per object | Per-object, formula-derived | Phase 4 | Correct vertical alignment |

---

## Open Questions

1. **DOOR_HOSP_DOUBLE actual cell content**
   - What we know: DoorsHospital col0 (sx=0) has content 65x49px within 80x80 cell; visually shows a double-glass door frame
   - What's unclear: The glass window panels start at cell y=31 (content top=31), so the lower 49px is the door. Should `drawOffsetY` place this flush with the wall tile row or extend above?
   - Recommendation: Use `drawOffsetY: 64` (current value) and verify visually. The door frame should visually "stand on" the wall tile row.

2. **SOFA side views (LivingRoom1 col2/3)**
   - What we know: Side-view sofa sprites (sx=192, sx=288) are 15x46px content in 96x96 cells; they show a sofa from the side
   - What's unclear: The current layout only uses front/back sofas, not side views. If side-view sofas are ever needed, their renderWidth would be ~8 (side profile at 1 tile)
   - Recommendation: Not needed for Phase 4; current layout uses front/back variants only.

3. **Meeting room carpet scaling**
   - What we know: The meeting room carpet is defined as 6x5 tiles (96x80px footprint) but CARPET sprite is 64x64
   - What's unclear: Whether to (a) scale one 64x64 sprite to cover 96x80, (b) tile the carpet sprite, or (c) use a different larger carpet from the sheet
   - Recommendation: Use `renderWidth:96, renderHeight:80` on that specific carpet object to stretch the single sprite. Carpet-col2 is ornate and will look fine stretched slightly. Alternative: split into two 3x5 carpets using two separate objects.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | TypeScript compiler (`npm run typecheck`) |
| Config file | `tsconfig.json` |
| Quick run command | `npm run typecheck` |
| Full suite command | `npm run typecheck` |

No automated test suite exists for rendering output. Visual verification is the gate. The engine is a browser Canvas 2D app; unit tests for rendering are not feasible without a headless canvas. `npm run typecheck` validates all type contracts.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R5.3 | FurnitureObject accepts renderWidth/renderHeight | type-check | `npm run typecheck` | ✅ |
| R5.3 | ObjectRenderer uses renderWidth/renderHeight when present | visual | `npm run dev` then inspect | ❌ Wave 0 |
| R5.3 | All furniture sprites render at correct size (no overflow) | visual | `npm run dev` then inspect | ❌ Wave 0 |
| R5.3 | drawOffsetY places sprites correctly (no floating/sinking) | visual | `npm run dev` then inspect | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck` + visual verification checkpoint
- **Phase gate:** Full typecheck passes + visual verification approves all 6 Phase 3 issues resolved

### Wave 0 Gaps
- [ ] Visual verification checkpoint task — covers all R5.3 rendering requirements
- [ ] `npm run typecheck` must pass after types.ts edit

*(No test files to create — visual verification is the only feasible validation for Canvas 2D rendering.)*

---

## Sources

### Primary (HIGH confidence)
- Direct PNG file analysis (Python PIL) — all sprite sheet dimensions verified: `Kitchen1-Sheet.png (576x96)`, `TV-Sheet.png (256x96)`, `LivingRoom1-Sheet.png (384x960)`, `Beds1-Sheet.png (256x320)`, `Kitchen-Sheet.png (1152x96)`, `Windows-Sheet.png (896x64)`, `Lights-Sheet.png (384x64)`, `Doors-Sheet.png (1344x128)`, `Flowers-Sheet.png (384x96)`, `Bathroom-Sheet.png (576x96)`, `DoorsHospital-Sheet.png (800x80)`, `Carpet-Sheet.png (320x64)`, `Paintings-Sheet.png (320x32)`
- `src/engine/ObjectRenderer.ts` — read in full, rendering pipeline confirmed
- `src/shared/types.ts` — FurnitureObject interface confirmed (no renderWidth/renderHeight yet)
- `src/shared/office-layout.ts` — all SPRITES entries read, all furniture.push() calls read
- `src/engine/index.ts` — initialization and render pipeline read in full
- Phase 3 SUMMARY — visual issues documented by upstream observer

### Secondary (MEDIUM confidence)
- Visual inspection of exported PNG crops for cell identification (chairs, desks, TV, kitchen appliances)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; existing Canvas 2D API
- Sprite region corrections: HIGH — verified by direct PIL pixel analysis and visual crop inspection
- renderWidth/renderHeight engine design: HIGH — straightforward backward-compatible extension
- drawOffsetY values: MEDIUM — derived by formula; exact values need visual tuning per object (documented as starting points)
- Architecture patterns: HIGH — code read directly

**Research date:** 2026-03-30
**Valid until:** Stable for this project (MetroCity assets won't change)
