---
phase: 10-sub-agents
plan: "01"
subsystem: server
tags: [sub-agents, state-machine, parser, types, lifecycle]
dependency_graph:
  requires: []
  provides: [sub-agent-spawn, sub-agent-despawn, parentId, toolCallId, activeSubAgents]
  affects: [src/shared/types.ts, src/server/parser.ts, src/server/state-machine.ts]
tech_stack:
  added: []
  patterns: [tool_use-spawn-trigger, negative-id-counter, cascade-cleanup]
key_files:
  created: []
  modified:
    - src/shared/types.ts
    - src/server/parser.ts
    - src/server/state-machine.ts
decisions:
  - "Spawn trigger is tool_use blocks (not progress records) — tool_use provides toolCallId immediately for lifecycle tracking; progress records arrive later and may be absent"
  - "Sub-agent IDs use negative counter (sub--1, sub--2) to avoid collision with positive agentCounter"
  - "tool_result despawn uses tool_use_id field from raw JSONL entry to match activeSubAgents map"
  - "Sub-agent removal cascades from removeAgent() to ensure no orphaned sub-agents on parent cleanup"
metrics:
  duration: "~3 minutes"
  completed: "2026-03-30T21:24:32Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 10 Plan 01: Sub-Agent Server Lifecycle Summary

**One-liner:** Server-side sub-agent spawn/despawn via tool_use block detection with negative IDs, toolCallId tracking, and cascade cleanup on parent removal.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Type extensions + parser sub-agent event + state machine lifecycle | 47b2cf3 | types.ts, parser.ts, state-machine.ts |
| 2 | Verify sub-agent data flow end-to-end | 47b2cf3 | (verification only — no code changes) |

## What Was Built

### src/shared/types.ts
- `AgentEvent.toolCallId?: string` — carries the tool_use block `id` for Task/Agent invocations
- `AgentState.parentId?: string` — set on sub-agents to reference the parent agent's id

### src/server/parser.ts
- `parseAssistantEntry` now sets `toolCallId: block.id` when `block.name === 'Task' || 'Agent'`
- `RawJSONLEntry.tool_use_id?: string` documented for tool_result entries used by despawn

### src/server/state-machine.ts
- `AgentTimers.activeSubAgents: Map<string, string>` — maps `toolCallId -> subAgentId`
- `subAgentCounter: number` — negative counter for sub-agent IDs (`sub--1`, `sub--2`, ...)
- `createSubAgent(parent, toolCallId, toolName)` — spawns sub-agent, emits `agent-added` with `parentId` set
- `removeSubAgent(subAgentId)` — removes sub-agent, cleans parent tracking map, emits `agent-removed`
- `processEvent` — SUB-01 spawn hook after permission timer (Tool=Task/Agent + toolCallId present)
- `processEvent` — SUB-05 despawn hook early in event processing (type=tool_result + tool_use_id lookup)
- `removeAgent` — cascade cleanup: iterates `activeSubAgents.values()` before removing parent

## Data Flow

```
JSONL tool_use block (Task/Agent)
  -> parser.ts: type='tool_use:Task', toolCallId=block.id
  -> state-machine.processEvent()
  -> createSubAgent() -> agents.set(sub--1) + activeSubAgents.set(toolCallId, 'sub--1')
  -> emit('agent-added', { ...subAgent, parentId: parentId })
  -> index.ts broadcast: { type: 'agent-added', payload: subAgent }
  -> client receives sub-agent with parentId

JSONL tool_result (matching tool_use_id)
  -> parser.ts: type='tool_result', raw.tool_use_id=toolCallId
  -> state-machine.processEvent()
  -> removeSubAgent('sub--1') -> agents.delete('sub--1') + activeSubAgents.delete(toolCallId)
  -> emit('agent-removed', { ...subAgent })
  -> index.ts broadcast: { type: 'agent-removed', payload: subAgent }
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files Exist
- [x] src/shared/types.ts — modified
- [x] src/server/parser.ts — modified
- [x] src/server/state-machine.ts — modified

### Commits Exist
- [x] 47b2cf3 — feat(10-01): sub-agent lifecycle

### Acceptance Criteria
- [x] `grep "parentId" src/shared/types.ts` — 1 match (inside AgentState interface)
- [x] `grep "toolCallId" src/shared/types.ts` — 1 match (inside AgentEvent interface)
- [x] `grep "toolCallId" src/server/parser.ts` — 1 match (assignment in parseAssistantEntry)
- [x] `grep "createSubAgent" src/server/state-machine.ts` — 2 matches (definition + call)
- [x] `grep "removeSubAgent" src/server/state-machine.ts` — 3 matches (definition + 2 calls)
- [x] `grep "activeSubAgents" src/server/state-machine.ts` — 8 matches
- [x] `grep "subAgentCounter" src/server/state-machine.ts` — 2 matches
- [x] `grep "Sub-agent spawned" src/server/state-machine.ts` — 1 match
- [x] `npx tsc --noEmit` — exits 0 (no type errors)
- [x] Server broadcasts agent-added/agent-removed (index.ts — pre-existing, no changes needed)

## Self-Check: PASSED
