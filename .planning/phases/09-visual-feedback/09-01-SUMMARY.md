---
phase: "09"
plan: "01"
subsystem: game-engine
tags: [visual-feedback, speech-bubble, canvas2d, pixel-art, click-dismiss]
dependency_graph:
  requires: []
  provides: [speech-bubble-renderer, bubble-hit-test, bubble-dismiss]
  affects: [src/engine/Character.ts, src/engine/index.ts]
tech_stack:
  added: []
  patterns: [pixel-art-bubble, fade-out-timer, hit-test-priority]
key_files:
  modified:
    - src/engine/Character.ts
    - src/engine/index.ts
decisions:
  - "permissionPending bubble uses bounce animation; waiting bubble is static so fade-out is visually clean"
  - "bubbleHitTest uses non-bounced position for click area to avoid jitter on hit detection"
  - "agentClickCallbacks.length early-return moved after bubble check so bubbles dismiss even with no callbacks registered"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-03-30"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 09 Plan 01: Pixel-Art Speech Bubble System Summary

Pixel-art speech bubble system for permission-pending (amber "...") and turn-end waiting (green checkmark with 2s fade-out) states, with click-dismiss via engine hit-test priority.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Pixel-art speech bubble renderer | fb260aa | src/engine/Character.ts |
| 2 | Bubble click-dismiss via onClick handler | d67d7d8 | src/engine/index.ts |

## What Was Built

### Task 1 — Character.ts

Added four new private fields:
- `bubbleDismissed: boolean` — tracks whether user dismissed the bubble via click
- `bubbleFadeStart: number` — globalTime timestamp when fade-out begins for waiting bubble
- `bubbleFadeAlpha: number` — current opacity for fade rendering
- `lastBubbleType: 'permission' | 'waiting' | null` — detects bubble type changes to auto-reset state

Modified `updateState()` to compare old vs new bubble type and reset all bubble fields when the type changes (e.g. permissionPending clears, or status changes from waiting).

Replaced `renderStatusBubble()` with full pixel-art bubble system:
- **Permission bubble**: amber `#D97706` background, `#92400E` border, animated bounce at 3Hz, three white dots (1.5px radius each, spaced 3px)
- **Waiting bubble**: green `#16A34A` background, `#14532D` border, static position, white checkmark strokes, 2s total display (last 0.5s fade via `ctx.globalAlpha`)
- Both have 1px border drawn as outer rect, 11x10px body at 1x scale, 3px downward pointer triangle with border stroke

Added two public methods:
- `bubbleHitTest(screenX, screenY, camera)` — returns true when bubble is visible and point falls within the 11x(10+3)px bubble+pointer area
- `dismissBubble()` — sets `bubbleDismissed = true`

### Task 2 — index.ts

Modified `onClick` handler to check `bubbleHitTest` before `hitTest`:
1. Bubble hit-test loop runs first — if any character's bubble is hit, `dismissBubble()` is called and handler returns without firing agent callbacks
2. `agentClickCallbacks.length === 0` guard moved to second block so bubble dismissal works even when no agent click listeners are registered
3. Character body hit-test loop unchanged

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

```
npx tsc --noEmit          → 0 errors
grep -c bubbleHitTest     → Character.ts: 1, index.ts: 1
grep -c dismissBubble     → Character.ts: 1, index.ts: 1
grep -c permissionPending → Character.ts: 5
grep D97706|16A34A        → both colors present in Character.ts
```

## Self-Check: PASSED

Files exist:
- FOUND: src/engine/Character.ts
- FOUND: src/engine/index.ts

Commits exist:
- FOUND: fb260aa (feat(09-01): pixel-art speech bubble renderer)
- FOUND: d67d7d8 (feat(09-01): bubble click-dismiss via engine onClick handler)
