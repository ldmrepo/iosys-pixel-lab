---
phase: 13-asset-replacement
verified: 2026-03-31T00:00:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Open http://localhost:5173 and visually inspect the canvas"
    expected: "Lobby zone (top rows) shows elevator center, windows flanking, plants beside elevator, 2 sofas, 2 vending machines, 2 snack racks; middle and lower zones show 5 cubicle desk+chair pairs each (10 total); no MetroCity-style furniture visible"
    why_human: "Visual pixel alignment, sprite rendering correctness, and proper z-ordering require browser inspection — cannot verify programmatically"
  - test: "Connect a JSONL source or use existing test session and observe agent movement"
    expected: "Agents spawn and walk to cubicle seats via BFS pathfinding; characters traverse corridor tiles (y=8, y=14) without getting stuck; characters do NOT walk through desks, elevator, machines, or racks"
    why_human: "Live agent movement, walkability correctness, and BFS path resolution require runtime observation"
  - test: "Trigger a permission/waiting state on an active agent"
    expected: "Speech bubble renders correctly above the character on the new layout"
    why_human: "Speech bubble position and rendering requires a live agent state transition"
  - test: "Trigger a sub-agent spawn (Task/Agent tool call in monitored session)"
    expected: "Matrix spawn effect renders correctly on the new layout; sub-agent wanders near parent"
    why_human: "Matrix effect and sub-agent positioning requires a live sub-agent event"
  - test: "Check browser DevTools Network tab while running the app"
    expected: "No 404 errors for any MetroCity asset URLs; PixelOfficeAssets.png loads successfully"
    why_human: "Network request verification requires a live browser session"
---

# Phase 13: Asset Replacement Verification Report

**Phase Goal:** PixelOffice와 Pixel Life 에셋팩의 스프라이트 좌표를 측정·등록하고 오피스 가구를 새 에셋으로 교체하되 기존 엔진이 정상 동작함을 검증한다

**User Decision Note:** "PixelOffice only" was locked by user choice. Pixel Life was excluded. ASSET-03 is satisfied by PixelOffice lobby props (vending machines, plants, snack racks) serving as workspace supplementary props. Visual verification was approved by user during execution (commit `ba571bb` documents approval).

**Verified:** 2026-03-31
**Status:** human_needed (all automated checks pass; 5 items need human runtime confirmation)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PixelOfficeAssets.png is served at /assets/pixeloffice/PixelOfficeAssets.png | VERIFIED | File exists at `public/assets/pixeloffice/PixelOfficeAssets.png` (9,383 bytes), created in commit `6566cdb` |
| 2 | furnitureSheets contains only pixelOffice — no MetroCity sheetIds remain | VERIFIED | `asset-manifest.ts` line 60-65: single `pixelOffice` entry with correct URL; "MetroCity" appears only in a character animation comment, not in furnitureSheets |
| 3 | SPRITES constant contains all PixelOffice sprite coordinates with correct sx/sy/sw/sh | VERIFIED | `office-layout.ts` lines 46-85: 23 entries all with `sheetId: 'pixelOffice'`; grep count=23 confirmed; all MetroCity sheetId references: 0 |
| 4 | PixelOffice lobby props (vending machines, plants, racks) are registered as substitutes for Pixel Life items (ASSET-03) | VERIFIED | office-layout.ts contains: elevator (line 153), 2 window panels (163, 171), 2 plants (183, 191), 2 sofas (201, 209), 2 vending machines (219, 227), 2 snack racks (237, 244) |
| 5 | Office layout has 10 cubicle seats in 2 rows of 5 and corridors for navigation | VERIFIED | `createCubicleRow` called twice (lines 144, 147); each call produces 5 `seats.push` calls internally (total 10 seats); corridor tiles at y=8, y=14, y=21-22 verified in tile loop (lines 26-27) |

**Score:** 5/5 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `public/assets/pixeloffice/PixelOfficeAssets.png` | PixelOffice sprite sheet file | VERIFIED | 9,383 bytes, exists since commit `6566cdb` |
| `src/shared/asset-manifest.ts` | Single pixelOffice furnitureSheet registration, contains "pixelOffice" | VERIFIED | Lines 60-65: exactly one furnitureSheet entry; URL `/assets/pixeloffice/PixelOfficeAssets.png` |
| `src/shared/office-layout.ts` | Complete office layout with zones/furniture/seats/walkableMask; contains "createCubicleRow"; min 150 lines | VERIFIED | 284 lines; contains `createCubicleRow` function (line 105); `officeLayout` export with width:30, height:24, tileSize:16 (line 277) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/shared/asset-manifest.ts` | `public/assets/pixeloffice/PixelOfficeAssets.png` | `furnitureSheets.pixelOffice.url` | WIRED | Line 62: `url: '/assets/pixeloffice/PixelOfficeAssets.png'` exactly matches file path |
| `src/shared/office-layout.ts` | `src/shared/asset-manifest.ts` | SPRITES sheetId references | WIRED | 23 entries in SPRITES all use `sheetId: 'pixelOffice'` which matches the manifest key |
| `src/shared/office-layout.ts` | `src/engine/ObjectRenderer.ts` | furniture array consumed by `setFurniture()` | WIRED | `engine/index.ts` line 415: `this.objectRenderer.setFurniture(this.layout.furniture)` — layout imported dynamically (line 449-457), furniture wired to renderer |
| `src/shared/office-layout.ts` | BFS pathfinding | seats array with tileX/tileY coordinates | WIRED | `seats.push` in `createCubicleRow` (line 135-139); engine `index.ts` line 263-268 reads `this.layout.seats` for seat assignment; PathFinder reads walkability via `TileMap.isWalkable` |
| `src/shared/office-layout.ts` | TileMap zone rendering | tiles grid with zone-tagged floor tiles | WIRED | `floor('lobby')` line 25, `floor('work')` lines 29/31, `floor('corridor')` lines 27/33; ZONE_INDEX imported and applied in `floor()` helper (line 14) |
| `src/shared/asset-manifest.ts` | `src/engine/ObjectRenderer.ts` | `loadSheets(manifest.furnitureSheets)` | WIRED | `engine/index.ts` lines 411-413: `if (this.manifest.furnitureSheets) { await this.objectRenderer.loadSheets(this.manifest.furnitureSheets); }` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ASSET-01 | 13-01 | PixelOffice 에셋팩의 스프라이트 좌표가 측정되어 asset-manifest.ts에 등록된다 | SATISFIED | `asset-manifest.ts` has single `pixelOffice` furnitureSheet; `office-layout.ts` SPRITES has 23 entries with pngjs-measured coordinates (all sheetId: 'pixelOffice') |
| ASSET-02 | 13-02 | 기존 MetroCity 가구가 PixelOffice 오피스 가구로 교체된다 (데스크, 의자, 소파 등) | SATISFIED | `office-layout.ts` furniture array contains cubicle desks, chairs (6 colors), sofas, elevator, windows, plants, vending machines, snack racks — all PixelOffice sprites; 0 MetroCity sheetId references |
| ASSET-03 | 13-01 | Pixel Life 소품이 회의실/작업공간에 보조 배치된다 (화이트보드, 차트 등) | SATISFIED (by substitution) | User decision locked "PixelOffice only". Lobby props serve as workspace supplementary items: MACHINE_ORANGE/MACHINE_GRAY (vending machines), PLANT_LEFT/PLANT_RIGHT (plants), RACK_GRAY/RACK_PINK (snack racks). Visual verification approved by user. |
| ASSET-04 | 13-02 | office-layout.ts가 새 에셋에 맞게 재설계된다 | SATISFIED | 30x24 layout with 3 zones (lobby y=1-7, workA y=9-13, workB y=15-20), `createCubicleRow` factory, walkableMask loop, full tile grid (284 lines) |
| ASSET-05 | 13-02 | 교체 후 기존 엔진(FSM/BFS/말풍선/서브에이전트)이 정상 동작한다 | SATISFIED (automated) / NEEDS HUMAN (runtime) | TypeScript compiles clean; engine wiring verified: `setFurniture`, `loadSheets`, BFS PathFinder, seat assignment, MatrixEffect, CharacterBehavior all unchanged in engine code; user approved visual verification in commit `ba571bb` |

No orphaned requirements: REQUIREMENTS.md maps ASSET-01 through ASSET-05 to Phase 13; all five are claimed in the plans.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/shared/asset-manifest.ts` | 4 | Comment: "MetroCity CC0 composited" in sprite layout description | Info | Describes character sprite sheet row layout — not a MetroCity furniture reference. No functional impact. |

No blockers or warnings found. The "MetroCity" reference is purely documentary (character animation row comment header), not a furniture sheet entry.

---

## Human Verification Required

### 1. Visual rendering of PixelOffice layout

**Test:** Start dev server (`npm run dev`), open `http://localhost:5173`, inspect the canvas.

**Expected:** Lobby zone (top, y=1-7) displays: elevator centered, window panels flanking, plants beside elevator, 2 sofas, 2 vending machines on left wall, 2 snack racks on right. Middle zone (y=9-13) shows 5 cubicle desk+chair pairs. Lower zone (y=15-20) shows 5 more cubicle desk+chair pairs. No MetroCity-style furniture is visible.

**Why human:** Pixel alignment, sprite clipping, z-order correctness, and visual accuracy require browser inspection.

### 2. BFS pathfinding and walkability on new layout

**Test:** Connect a JSONL source or use an existing session. Observe agents moving to seats.

**Expected:** Agents navigate from spawn position through corridor tiles (y=8, y=14) to cubicle seats without collision with desks, elevator, machines, or racks.

**Why human:** Live agent movement and walkability correctness require runtime observation.

### 3. Speech bubble rendering on new layout

**Test:** Trigger a permission or waiting state on an active agent.

**Expected:** Speech bubble appears and positions correctly above the agent sprite on the new layout.

**Why human:** Requires a live agent state transition event.

### 4. Sub-agent Matrix effect on new layout

**Test:** Trigger a sub-agent spawn via a Task/Agent tool call in a monitored session.

**Expected:** Matrix spawn effect renders correctly; sub-agent wanders near parent within 5-tile radius.

**Why human:** Requires a live sub-agent event to observe the MatrixEffect behavior.

### 5. No 404 errors for MetroCity assets

**Test:** Open DevTools Network tab while running the app.

**Expected:** No 404 responses for any MetroCity asset URLs. PixelOfficeAssets.png loads with HTTP 200.

**Why human:** Network requests require a live browser session.

---

## Gaps Summary

No automated gaps. All five must-have truths are verified in the codebase:

- PixelOfficeAssets.png is deployed and at the correct URL
- asset-manifest.ts has exactly one furnitureSheet (pixelOffice)
- office-layout.ts SPRITES has 23 entries, all sheetId 'pixelOffice', no MetroCity references
- Lobby has all required decorative items (elevator, windows, plants, sofas, machines, racks)
- 10 cubicle seats in 2 rows of 5 with corridor walkways

The only remaining items are runtime behaviors that require human observation. The user already approved visual verification during Phase 13 execution (documented in commit `ba571bb`). The five human_verification items above are confirmatory checks for a complete sign-off record.

---

_Verified: 2026-03-31_
_Verifier: Claude (gsd-verifier)_
