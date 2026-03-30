---
phase: 12-token-cost-tracking
plan: "01"
subsystem: server
tags: [token-tracking, pricing, websocket, jsonl, typescript]

requires:
  - phase: 11-layout-dashboard-panel
    provides: AgentPanel with .agent-card-token-placeholder div awaiting token data

provides:
  - TokenUsage interface in types.ts (inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens, costUSD)
  - AgentEvent.usage optional field for per-turn token data from JSONL
  - AgentState.tokenUsage optional field — accumulated cost broadcast via WebSocket
  - src/server/pricing.ts with MODEL_PRICING table and computeCost() for Claude 4 + 3.5 models
  - Parser extracts usage from turn_duration JSONL entries
  - State-machine accumulates tokens per agent with Set-based message.id deduplication

affects: [12-02-client-display, 13-asset-replacement]

tech-stack:
  added: []
  patterns:
    - "Token pipeline: JSONL turn_duration -> parser AgentEvent.usage -> state-machine accumulation -> WebSocket agent-update"
    - "Deduplication via per-agent Set<string> of seen message.id values (never reset — session-lifetime tracking)"
    - "Pricing via hardcoded MODEL_PRICING table with DEFAULT_PRICING fallback (sonnet rates for unknown models)"

key-files:
  created:
    - src/server/pricing.ts
  modified:
    - src/shared/types.ts
    - src/server/parser.ts
    - src/server/state-machine.ts

key-decisions:
  - "computeCost uses DEFAULT_PRICING (sonnet rates) for unknown model strings — better than returning 0"
  - "console.log diagnostics left in parser.ts turn_duration handler to confirm raw.usage path at runtime"
  - "seenMessageIds lives on AgentTimers (cleaned up on removeAgent) — not reset per turn to ensure session-lifetime dedup"

patterns-established:
  - "AgentTimers extended with seenMessageIds: dedup pattern for any future per-session idempotency needs"
  - "pricing.ts: model alias map pattern — short names map to full pricing entries"

requirements-completed: [TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04]

duration: 3min
completed: "2026-03-30"
---

# Phase 12 Plan 01: Token Cost Tracking — Server Pipeline Summary

**Token pipeline from JSONL turn_duration through pricing.ts cost computation to WebSocket AgentState broadcast, with Set-based message.id deduplication**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-30T15:09:32Z
- **Completed:** 2026-03-30T15:12:08Z
- **Tasks:** 2 completed
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- TokenUsage interface defined and wired into AgentEvent and AgentState in types.ts
- pricing.ts created with Claude 4 (sonnet/opus/haiku) and Claude 3.5 model rates, plus short-name aliases
- parser.ts extracts usage+model+message_id from system/turn_duration JSONL entries into AgentEvent.usage
- state-machine.ts accumulates per-agent tokenUsage with message.id Set deduplication and broadcasts via existing agent-update WebSocket path

## Task Commits

Each task was committed atomically:

1. **Task 1: Define TokenUsage type + pricing module + extend AgentEvent/AgentState** - `a4d779c` (feat)
2. **Task 2: Extract usage from turn_duration in parser + accumulate in state-machine with dedup** - `f974a31` (feat)

**Plan metadata:** (pending — created in final commit)

## Files Created/Modified

- `src/shared/types.ts` - Added TokenUsage interface, AgentEvent.usage optional field, AgentState.tokenUsage optional field
- `src/server/pricing.ts` - New file: MODEL_PRICING table for Claude models, computeCost() function
- `src/server/parser.ts` - Extended RawJSONLEntry with usage/model/durationMs fields; turn_duration handler now populates AgentEvent.usage
- `src/server/state-machine.ts` - Added seenMessageIds to AgentTimers, imports computeCost, accumulates tokenUsage in turn_end handler with dedup

## Decisions Made

- Used DEFAULT_PRICING (sonnet rates) as fallback for unknown model strings rather than returning 0 — avoids silently dropping costs for models not yet in the table
- Left console.log diagnostics in parser.ts turn_duration handler per plan instructions — confirms raw.usage path at runtime, can be removed once confirmed
- seenMessageIds is cleaned up via agentTimers.delete(agentId) in removeAgent() — lives for the agent's full session lifetime so deduplication is session-scoped

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Server-side pipeline is complete: tokenUsage is now included in every agent-update WebSocket broadcast
- Phase 12-02 can read agent.tokenUsage from the existing WebSocket state and render it in AgentPanel
- Console.log lines in parser.ts should be reviewed/removed after confirming raw.usage path works correctly in production

---
*Phase: 12-token-cost-tracking*
*Completed: 2026-03-30*
