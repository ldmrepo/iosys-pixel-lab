---
phase: 06-movement-engine
plan: 01
subsystem: sprite-animation
tags: [sprites, walk-animation, direction-tracking, character-fsm]
dependency_graph:
  requires: []
  provides: [4-direction-walk-sprites, walk-animation-selection, direction-tracking]
  affects: [src/engine/Character.ts, src/shared/types.ts, src/shared/asset-manifest.ts, public/assets/sprites]
tech_stack:
  added: []
  patterns: [direction-enum-as-status, switch-on-direction, dx-dy-direction-detection]
key_files:
  created: []
  modified:
    - scripts/composite-characters.ts
    - public/assets/sprites/claude.png
    - public/assets/sprites/codex.png
    - public/assets/sprites/gemini.png
    - src/shared/types.ts
    - src/shared/asset-manifest.ts
    - src/engine/Character.ts
    - src/engine/index.ts
    - src/client/components/AgentPanel.tsx
    - src/client/components/Tooltip.tsx
decisions:
  - "Used MetroCity native left-direction sprites (cols 8-11) instead of horizontal-flipping right sprites — drawFrameFlipped not needed"
  - "walk_* variants added directly to AgentStatus union (not a separate type) so all Record<AgentStatus,...> maps remain exhaustive"
  - "Walk animation fps=8 (same as executing) gives brisk 3-tiles/sec walk feel"
  - "UI components (AgentPanel, Tooltip) map walk_* statuses to idle color/Walking label"
metrics:
  duration: "~4 minutes"
  completed_date: "2026-03-30"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 10
---

# Phase 6 Plan 1: 4-Direction Walk Sprites + Direction Tracking Summary

4-direction walk spritesheet expansion (128x224 → 128x352) with MetroCity native directional frames, plus Character.ts direction tracking and walk animation selection replacing the old idle-during-walk fallback.

## What Was Built

### Task 1: Extend Sprite Sheets + Type System

Extended `composite-characters.ts` from 7 to 11 output rows. The 4 new rows (walk_down, walk_up, walk_right, walk_left) each contain 4 walk frames sourced directly from MetroCity's directional columns:

- Down walk: MetroCity cols 2-5
- Up walk: MetroCity cols 20-23
- Right walk: MetroCity cols 14-17
- Left walk: MetroCity cols 8-11

All 3 character sprites regenerated as 128x352 PNG files.

`AgentStatus` union extended with `walk_down | walk_up | walk_right | walk_left`. All downstream `Record<AgentStatus,...>` maps updated: `standardAnimations` (asset-manifest.ts), `DEFAULT_ANIMATIONS` (Character.ts), `FALLBACK_MANIFEST` (engine/index.ts), plus UI components.

### Task 2: Direction Tracking + Walk Animation Selection

`Character.ts` now tracks `currentDirection` ('down' | 'up' | 'left' | 'right', default 'down'). Updated in `updateMovement()` by comparing `|dx| vs |dy|` after computing the delta to the current waypoint.

`getEffectiveStatus()` replaced the old `return 'idle'` walking branch with a directional switch returning the appropriate `walk_*` status. This applies to both behavior-FSM characters (`behavior.isWalking`) and non-behavior characters moving along a path (`this.isMoving`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Fixed AgentPanel.tsx and Tooltip.tsx Record<AgentStatus,...> exhaustiveness**
- **Found during:** Task 1 — TypeScript compilation after extending AgentStatus union
- **Issue:** Both client components used `Record<AgentStatus, string>` object literals missing the 4 new walk_* variants, causing TS2739 errors
- **Fix:** Added walk_down/walk_up/walk_right/walk_left entries mapping to idle color and "Walking" label
- **Files modified:** src/client/components/AgentPanel.tsx, src/client/components/Tooltip.tsx
- **Commit:** e87986a (included in Task 1 commit)

**Note on drawFrameFlipped:** The plan's `must_haves` listed `drawFrameFlipped` in SpriteSheet.ts as a requirement, but the task description itself noted this was precautionary. Since MetroCity provides native left-direction sprites, horizontal flipping is not needed. SpriteSheet.ts was not modified. This aligns with the plan's own note: "skip implementing it."

## Verification Results

1. `npx tsc --noEmit` — passes with zero errors
2. `npx tsx scripts/composite-characters.ts` — generates 128x352 sprites successfully
3. `AgentStatus` includes walk_down, walk_up, walk_right, walk_left
4. `Character.ts getEffectiveStatus` returns direction-specific walk status (not 'idle') during movement
5. `DEFAULT_ANIMATIONS` and `standardAnimations` both include all 4 walk direction entries

## Self-Check: PASSED

- public/assets/sprites/claude.png — FOUND
- public/assets/sprites/codex.png — FOUND
- public/assets/sprites/gemini.png — FOUND
- .planning/phases/06-movement-engine/06-01-SUMMARY.md — FOUND
- commit e87986a — FOUND
- commit d42f77a — FOUND
