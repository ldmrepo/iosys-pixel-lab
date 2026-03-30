# Stack Research

**Domain:** Dashboard UI, Token Tracking, Pixel Art Asset Replacement for existing React/Canvas app
**Researched:** 2026-03-30
**Confidence:** HIGH

> This is an additive research file. Existing validated stack (React 19, TypeScript, Vite, Express 5,
> ws, chokidar, Canvas 2D, Web Audio API) is NOT re-evaluated here. Only net-new library
> requirements for v1.2 features are documented.

---

## Feature Summary

| Feature | What it needs | New dependency? |
|---------|--------------|-----------------|
| Dashboard side panel | Layout + CSS expand/collapse | NO — pure CSS only |
| Token/cost display | Data source from JSONL `usage` + statusline JSON | NO — parser extension |
| Asset replacement (PixelOffice/PixelLife) | PNG loading + tile mapping | NO — existing pngjs |

**Net result: zero new runtime dependencies required.**

---

## Recommended Stack (Additions)

### Core Technologies

No new runtime packages are needed. The three v1.2 features are implementable entirely with the
existing stack:

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| (existing) React 19 + CSS | already installed | Dashboard panel layout | CSS Grid/Flexbox is sufficient for a non-resizable side panel; project constraint forbids UI libraries |
| (existing) pngjs | ^7.0.0 (devDep) | Asset pack inspection scripts | Already used by composite-characters.ts; adequate for any new asset prep scripts |
| (existing) TypeScript | ^6.0.2 | Type-safe token fields in types.ts | Token tracking data shape slots cleanly into AgentState extension |

### Supporting Libraries

None. Rationale per feature:

**Dashboard UI** — The existing AgentPanel component plus CSS variables already provides the
skeleton. A "dashboard" in this context means adding token/cost rows to existing cards and
optionally a collapsible panel. CSS `display: grid` or `flex` + `transition: width` is the full
implementation. No charting library is warranted at this scale (N ≤ ~10 agents).

**Token/cost tracking** — Claude Code JSONL files at `~/.claude/projects/**/*.jsonl` contain a
`usage` object on assistant messages with `input_tokens`, `output_tokens`,
`cache_creation_input_tokens`, `cache_read_input_tokens`. The `costUSD` top-level field existed
until Claude Code v1.0.6 but was removed circa v1.0.9 and is not reliably present.

Accurate session-level cost is available via the Claude Code statusline JSON protocol
(`cost.total_cost_usd`, `context_window.total_input_tokens`, `context_window.total_output_tokens`,
`rate_limits.*`). This data is sent to any configured statusline script via stdin as JSON on each
assistant message. The server can expose a small HTTP endpoint or WebSocket push to forward this
data to the dashboard.

**Accurate approach:** Extend the existing WebSocket message protocol to carry a new
`token-update` message type. The Express server reads statusline JSON from a
`~/.claude/statusline-bridge.json` file (written by a lightweight shell hook) or parses JSONL
`usage` fields as a lower-fidelity fallback.

**Asset replacement** — PixelOffice (256×224 px, tile size 16), Pixel Life Desk Essentials
(288×64 px spritesheet), and office_assets_release (props.png 50×50, office_workers.png 50×50)
are all standard PNGs readable by the browser via `<img>` / Canvas `drawImage`. No new loader
library is required. The existing `SpriteSheet.ts` engine class handles arbitrary PNG + frame
dimensions. The asset-manifest.ts / office-layout.ts files just need updated URL/region references.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| (existing) pngjs + tsx | Asset prep scripts | Use for any new composite scripts needed to slice/pack new asset sheets |
| (existing) TypeScript strict | Type the new token fields | Add `tokenUsage?: TokenUsage` to `AgentState` in types.ts |

---

## Installation

```bash
# No new packages required for v1.2.
# Existing devDependencies cover all needs.
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Pure CSS panel | react-resizable-panels | Only if drag-to-resize panel width is a hard requirement; adds ~40 KB and conflicts with "no UI libraries" constraint |
| JSONL usage parse + statusline bridge | Anthropic API billing API | Only if you need organization-level billing data across multiple users; overkill for a local monitoring tool |
| Extend existing WSMessage type | Separate REST poll endpoint | REST polling adds latency and complexity; existing WebSocket connection is the correct channel |
| Manual cost formula (input×rate + output×rate) | ccusage CLI integration | ccusage is a separate process; formulaic calculation is simpler and sufficient for display purposes |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `costUSD` JSONL field | Removed from Claude Code since v1.0.9; unreliable on Max plan | `cost.total_cost_usd` from statusline JSON, or manual formula from `usage.*_tokens` |
| Recharts / Chart.js / Victory | Overkill for displaying 3-4 numbers per agent; adds hundreds of KB | Styled `<div>` with CSS width percentage for a token bar |
| Tailwind CSS | Project constraint explicitly forbids it | Existing CSS variables + `index.css` |
| react-resizable-panels | Violates "React + CSS only" constraint | CSS `transition: width` + click-to-toggle |
| JSONL `usage.input_tokens` for accuracy | Streaming placeholder — 75% of values are 0 or 1, undercounts by 100-174x | Statusline `context_window.total_input_tokens` (session cumulative) or `current_usage.input_tokens` (last call) |

---

## Data Shape for Token Tracking

Add to `src/shared/types.ts` (orchestrator's call):

```typescript
export interface TokenUsage {
  inputTokens: number;           // context_window.current_usage.input_tokens (last call)
  outputTokens: number;          // context_window.current_usage.output_tokens
  cacheReadTokens: number;       // context_window.current_usage.cache_read_input_tokens
  cacheWriteTokens: number;      // context_window.current_usage.cache_creation_input_tokens
  totalInputCumulative: number;  // context_window.total_input_tokens (session total)
  totalOutputCumulative: number; // context_window.total_output_tokens
  costUSD: number;               // cost.total_cost_usd
  contextUsedPct: number;        // context_window.used_percentage
  rateLimitFiveHourPct?: number; // rate_limits.five_hour.used_percentage (Pro/Max only)
}
```

Add optional field to `AgentState`:
```typescript
tokenUsage?: TokenUsage;
```

New `WSMessage` type variant:
```typescript
{ type: 'token-update'; payload: { agentId: string; usage: TokenUsage } }
```

---

## Asset Pack Integration Notes

### PixelOffice (2dPig, CC0)

- `PixelOffice.png` — 256×224, 16px tile grid (16 cols × 14 rows), office scene tileset
- `LargePixelOffice.png` — 1024×896, same layout at 4× scale (64px tiles); use this for higher DPI
- `PixelOfficeAssets.png` — 256×160, 16px tile grid (16 cols × 10 rows), furniture assets
- License: CC0 (identical to MetroCity), drop-in replacement

Tile size is 16px vs MetroCity's 16px — compatible with existing tile infrastructure.
The existing `FurnitureObject.sprite.region` system (sx/sy/sw/sh) can reference these sheets
by adding entries to the asset manifest.

### Pixel Life — Desk Essentials (CC0 assumed)

- `spritesheet.png` — 288×64, desk objects. At 16px per tile: 18 columns × 4 rows. At 32px:
  9 columns × 2 rows. Requires visual inspection to confirm actual frame size; 16px most likely
  given pixel art style.
- Small, focused pack — suitable for desk decoration variants

### office_assets_release (props + workers)

- `props.png` — 50×50 px. This is a single sprite, not a sheet. Use as a standalone prop.
- `office_workers.png` — 50×50 px. Single character sprite at non-power-of-2 size.
- `example.png` — 50×50 px. Reference layout.
- These are character/prop sprites at non-standard sizes. They can be drawn with `drawImage` at
  any target size via the existing SpriteSheet `exactWidth`/`exactHeight` parameters, but at
  50×50 they are likely full-scene thumbnails, not tileable sheets. Inspect visually before use.
- The `office_workers.png` is 50×50, likely representing a single character pose rather than a
  walk-cycle sheet (compare to existing 128×224 character sheets). May serve as static decoration
  or reference only.

**Recommendation:** Use PixelOffice as the primary replacement for background/furniture tiles.
Use Pixel Life Desk Essentials for desk prop enrichment. Treat office_assets_release as
supplementary references until visually confirmed as usable sheets.

---

## Stack Patterns by Variant

**If token data comes from statusline hook (recommended):**
- Write a minimal `~/.claude/statusline.sh` that dumps JSON to a file watched by chokidar
- Server reads file via chokidar, parses JSON, matches `session_id` to `AgentState`, pushes
  `token-update` via WebSocket
- Zero new packages; chokidar already handles file watching

**If token data comes from JSONL parsing only (fallback):**
- Extend `parser.ts` to extract `usage` from assistant messages
- Accuracy is lower (output tokens undercount 10-17×, input tokens near-zero from streaming)
- Cache write/read tokens from JSONL are reliable (~1× accuracy)
- Useful as supplementary context-window tracking, not cost tracking

**If dashboard needs tab navigation (future):**
- Simple state variable `activeTab: 'agents' | 'tokens'` in App.tsx
- CSS `display: none / block` switch — no router needed

---

## Version Compatibility

All additions are pure TypeScript type extensions and CSS changes. No version conflicts.

| Existing Package | Compatibility with v1.2 Changes | Notes |
|------------------|---------------------------------|-------|
| react@19.2.4 | Fully compatible | No new hooks needed; useState/useEffect sufficient |
| typescript@6.0.2 | Fully compatible | New interfaces added to types.ts |
| ws@8.20.0 | Fully compatible | New message type added to discriminated union |
| chokidar@5.0.0 | Fully compatible | May watch statusline bridge file if needed |
| vite@5.4.21 | Fully compatible | New PNG assets served from public/assets/ as-is |

---

## Sources

- [Claude Code Statusline Docs](https://code.claude.ai/docs/en/statusline) — Full JSON schema
  for `cost.*`, `context_window.*`, `rate_limits.*` fields. HIGH confidence (official docs).
- [Claude Code JSONL Token Undercounting Analysis](https://gille.ai/en/blog/claude-code-jsonl-logs-undercount-tokens/) —
  Documents streaming placeholder bug: `usage.input_tokens` near-zero in 75% of records.
  HIGH confidence (empirically measured).
- [ccusage GitHub](https://github.com/ryoppippi/ccusage) — Third-party JSONL cost parser,
  confirms `costUSD` field history and token field structure. MEDIUM confidence.
- [costUSD removal in v1.0.9](https://medium.com/@trysmr/how-to-calculate-claude-code-costs-on-the-claude-max-plan-20adf761d798) —
  Confirms field dropped from JSONL on Max plan. MEDIUM confidence (community report).
- pngjs inspection of asset packs — Direct measurement. HIGH confidence.
- Existing codebase inspection (`types.ts`, `AgentPanel.tsx`, `App.tsx`, `parser.ts`) — HIGH confidence.

---

*Stack research for: Pixel Office v1.2 — Dashboard UI, Token Tracking, Asset Replacement*
*Researched: 2026-03-30*
