---
phase: 08-state-detection
plan: "01"
subsystem: state-detection
tags: [parser, state-machine, timers, turn-detection, typescript]
dependency_graph:
  requires: []
  provides: [turn_duration-parsing, text-idle-timer, permission-timer-infrastructure, permissionPending-field]
  affects: [src/server/parser.ts, src/server/state-machine.ts, src/shared/types.ts]
tech_stack:
  added: []
  patterns: [per-agent-setTimeout-timers, event-driven-state-cancellation]
key_files:
  created: []
  modified:
    - src/shared/types.ts
    - src/server/parser.ts
    - src/server/state-machine.ts
decisions:
  - "AgentTimers interface holds permissionTimer + textIdleTimer + hadToolsInTurn per agent"
  - "cancelAllTimers called on every incoming event to prevent stale timer transitions"
  - "turn_end immediately sets waiting without going through deriveStatus"
  - "queue-operation and background-tool update lastUpdated but do not change status (Plan 02 handles)"
  - "PERMISSION_EXEMPT_TOOLS excludes Task/Agent/AskUserQuestion from 7s permission timer"
metrics:
  duration_minutes: 3
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 3
---

# Phase 8 Plan 1: Turn Duration Parser + Text-Idle Timer Summary

One-liner: turn_duration JSONL subtype parsed as definitive turn_end signal with per-agent 5s/7s setTimeout timers replacing polling for waiting-state transitions.

## What Was Built

### Task 1 — AgentState type extension + parser updates

**`src/shared/types.ts`:**
- Added `permissionPending: boolean` to `AgentState` — Plan 02 reads this to drive UI indicator
- Added `toolName?: string` to `AgentEvent` — passed through so state-machine can check PERMISSION_EXEMPT_TOOLS without re-parsing the event type string

**`src/server/parser.ts`:**
- Added `subtype?: string` to `RawJSONLEntry`
- `system` entries with `subtype === 'turn_duration'` now return `AgentEvent { type: 'turn_end' }` instead of being silently dropped
- `progress` entries with `subtype === 'queue-operation'` return `AgentEvent { type: 'queue-operation' }`
- Remaining `system` and `progress` subtypes are still skipped (null return)
- `tool_use` blocks now include `toolName: block.name` in the returned event
- Bash `tool_use` with `run_in_background: true` emits `type: 'background-tool'` instead of `tool_use:Bash`

### Task 2 — Per-agent timer infrastructure + state-machine handlers

**`src/server/state-machine.ts`:**
- New constants: `PERMISSION_TIMER_DELAY_MS = 7_000`, `TEXT_IDLE_DELAY_MS = 5_000`, `PERMISSION_EXEMPT_TOOLS`
- `AgentTimers` interface: `permissionTimer | null`, `textIdleTimer | null`, `hadToolsInTurn: boolean`
- `agentTimers: Map<string, AgentTimers>` on `AgentStateMachine`
- Helper methods: `getTimers`, `cancelAllTimers`, `cancelPermissionTimer`, `cancelTextIdleTimer`
- `processEvent()` fully rewritten:
  - Cancels all timers on every incoming event (any activity resets the clock)
  - Clears `permissionPending` when new data arrives
  - `turn_end` → immediately sets `status = 'waiting'`, emits, returns (bypasses deriveStatus)
  - `queue-operation` → updates `lastUpdated`, emits, returns
  - `background-tool` → updates `lastUpdated + lastAction`, emits, returns
  - Non-exempt `tool_use:*` → starts 7s permission timer
  - `assistant_text` → starts 5s text-idle timer that sets `status = 'waiting'` if no new data
  - Emits update if status changed OR `permissionPending` was just cleared
- `createAgent()`: initializes `permissionPending: false`
- `removeAgent()`: calls `cancelAllTimers` + `agentTimers.delete` before removing
- `stop()`: iterates `agentTimers` and cancels all before clearing the map

## Decisions Made

- `cancelAllTimers` is called at the TOP of every `processEvent` invocation — this ensures any new JSONL data (even a tool_result) resets all pending timers. This is more conservative than only cancelling on specific event types.
- `turn_end` uses early return and bypasses `deriveStatus` — the turn is definitively over, no need to derive a status from the event content.
- `queue-operation` and `background-tool` intentionally do NOT change `agent.status` — Plan 02 will add context-aware logic for sub-agent tracking.
- The existing 30s/60s/5m fallback polling in `checkTimeouts()` is untouched — it remains a safety net for edge cases the new timers don't cover.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: src/shared/types.ts
- FOUND: src/server/parser.ts
- FOUND: src/server/state-machine.ts
- FOUND: .planning/phases/08-state-detection/08-01-SUMMARY.md
- FOUND: commit 2537a2e (Task 1)
- FOUND: commit fe73b7e (Task 2)
