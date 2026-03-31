---
phase: 12-token-cost-tracking
plan: 02
subsystem: ui
tags: [react, typescript, css, token-display, agent-card]

# Dependency graph
requires:
  - phase: 12-token-cost-tracking plan 01
    provides: "TokenUsage type on AgentState, server-side token accumulation + pricing pipeline"
  - phase: 11-layout-dashboard-panel
    provides: "AgentPanel component with agent cards and placeholder div"
provides:
  - "Per-agent token/cost display row in dashboard agent cards"
  - "formatCost() and formatTokenCount() UI formatting helpers"
  - "CSS styling for agent-card-tokens row (monospace, green cost)"
affects: [13-asset-replacement]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Conditional render row based on data presence (costUSD > 0)", "K/M suffix formatting for token counts"]

key-files:
  created: []
  modified:
    - src/client/components/AgentPanel.tsx
    - src/client/styles/index.css

key-decisions:
  - "costUSD > 0 guard ensures clean empty state for agents with no turns yet"
  - "Display format: $X.XX middle-dot XX.XK tokens (compact, readable)"
  - "Token count = inputTokens + outputTokens (cache tokens tracked server-side but not shown in compact card)"
  - "Monospace font + green cost color for terminal data aesthetic matching pixel art theme"

patterns-established:
  - "Conditional row rendering: show data row only when meaningful data exists (no placeholder/zero states)"
  - "Token formatting: K suffix for thousands, M suffix for millions, raw number below 1000"

requirements-completed: [DASH-04]

# Metrics
duration: 8min
completed: 2026-03-30
---

# Phase 12 Plan 02: Agent Card Token/Cost Display Summary

**Per-agent USD cost and token count displayed in dashboard agent cards with conditional rendering and monospace terminal aesthetic**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T23:10:00Z
- **Completed:** 2026-03-30T23:18:00Z
- **Tasks:** 2 (1 auto + 1 checkpoint)
- **Files modified:** 2

## Accomplishments
- Replaced Phase 11 placeholder div with conditional token/cost display row
- Added formatCost() ($X.XX) and formatTokenCount() (K/M suffix) helper functions
- CSS styling: monospace font, green cost color, subtle border-top separator
- Clean empty state: row hidden when agent has no token data (costUSD === 0)
- Human visual verification approved

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace placeholder with token/cost display in AgentPanel + CSS** - `1b747ec` (feat)
2. **Task 2: Visual verification of token/cost display** - checkpoint approved, no code changes

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `src/client/components/AgentPanel.tsx` - Added formatCost/formatTokenCount helpers, replaced placeholder with conditional token/cost row
- `src/client/styles/index.css` - Replaced .agent-card-token-placeholder with .agent-card-tokens/.agent-card-cost/.agent-card-token-sep/.agent-card-token-count styles

## Decisions Made
- costUSD > 0 condition for showing the row (not just checking tokenUsage existence) -- avoids showing $0.00 for freshly spawned agents
- Token count shows input + output combined (cache tokens tracked server-side for cost calculation but omitted from compact card view)
- Green color uses var(--status-executing) CSS variable for consistency with existing theme
- Middle dot separator between cost and token count for clean visual separation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 12 complete -- full token tracking pipeline is end-to-end operational
- Server parses JSONL turn_duration usage, accumulates with dedup, computes cost, broadcasts via WebSocket
- Agent cards display real-time cost and token summary
- Phase 13 (Asset Replacement) can proceed independently

## Self-Check: PASSED

- All files verified present on disk
- Commit 1b747ec verified in git log

---
*Phase: 12-token-cost-tracking*
*Completed: 2026-03-30*
