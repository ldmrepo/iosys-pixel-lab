---
phase: 10-sub-agents
plan: "02"
subsystem: game-engine
tags: [sub-agents, matrix-effect, canvas2d, animation, bfs, sprite-inheritance]
dependency_graph:
  requires: [10-01]
  provides: [MatrixEffect, addSubAgent, findNearestWalkable, startDespawn]
  affects: [src/engine/Character.ts, src/engine/index.ts]
tech_stack:
  added: [MatrixEffect.ts]
  patterns: [column-stagger-animation, bfs-nearest-walkable, palette-inheritance, despawn-lifecycle]
key_files:
  created:
    - src/engine/MatrixEffect.ts
  modified:
    - src/engine/Character.ts
    - src/engine/index.ts
decisions:
  - "MatrixEffect column count: clamped to 4-8 based on spriteWidth/4 for visible stagger effect"
  - "BFS safety limit: 200 visited nodes — prevents infinite loop on pathological layouts"
  - "isDespawnComplete getter: requires both isDespawning=true AND matrixEffect.isComplete to prevent false positives"
  - "Sub-agent wander radius: 5-tile Manhattan distance from parent tile position"
  - "Despawn cleanup: deferred to update loop via toRemove array — avoids Map mutation during iteration"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-03-30"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 10 Plan 02: Sub-Agent Engine Features Summary

**One-liner:** Column-stagger Matrix spawn/despawn animation with BFS nearest-walkable positioning and parent sprite palette inheritance.

## What Was Built

All 2 tasks completed. Task 2 (visual verification checkpoint) approved by user.

### MatrixEffect.ts (new)

A self-contained animation class that manages the "digital materialization" effect for sub-agent characters. The effect divides the sprite width into 4–8 columns, each assigned a random stagger offset (0–100ms), creating a left-to-right cascade reveal (spawn) or hide (despawn) over 300ms total. The `getColumnAlpha(col)` method returns a 0.0–1.0 value per column based on elapsed time, enabling the Character render loop to apply per-column `ctx.clip()` with `ctx.globalAlpha`.

### Character.ts changes

- Added `matrixEffect: MatrixEffect | null` field and `isDespawning: boolean` field
- Added `startMatrixEffect(type)`, `startDespawn()`, and `isDespawnComplete` getter
- Modified `update(dt)` to advance `this.matrixEffect`
- Modified `render(ctx, camera)` to branch on matrix effect state:
  - Active effect: per-column `ctx.save() / beginPath / rect / clip / drawFrame / restore` loop
  - Despawn complete: early return (no rendering)
  - Normal: existing drawFrame call
- Added `if (this.isDespawning) return` guard before name label and bubble rendering

### index.ts changes

- Added `export { MatrixEffect } from './MatrixEffect'` re-export
- Added `AgentStatus` and `SpriteAnimation` to type imports
- Modified `addAgent()` to detect `state.parentId` and delegate to `addSubAgent()`
- Modified `removeAgent()` to call `character.startDespawn()` for sub-agents instead of immediate deletion
- Modified `update(dt)` to collect `isDespawnComplete` characters and remove them after iteration
- Added `addSubAgent(state)`: BFS spawn position, parent sprite sheet lookup, Matrix spawn effect, restricted wander behavior
- Added `findNearestWalkable(cx, cy)`: BFS using `this.tileMap.isWalkable()` (furniture-aware walk grid)
- Added `getParentNearbyTiles(center, radius)`: Manhattan distance filter on `this.walkableTiles`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] src/engine/MatrixEffect.ts exists
- [x] src/engine/Character.ts updated with matrixEffect field and methods
- [x] src/engine/index.ts updated with addSubAgent, findNearestWalkable, getParentNearbyTiles
- [x] `npx tsc --noEmit` exits 0 (verified during task execution)
- [x] Commit 28a5e93 exists

## Self-Check: PASSED

All created files verified present. Commit 28a5e93 verified in git log. TypeScript 0 errors confirmed.

## Task 2: Visual Verification

**Status:** APPROVED

Human verified all sub-agent visualization scenarios:
- Sub-agent spawns near parent with column-by-column Matrix materializing effect
- Sub-agent inherits parent's sprite sheet (same team visual)
- Sub-agent wanders near parent desk area
- Despawn plays reverse column fade-out and character is removed
