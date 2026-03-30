# Project Research Summary

**Project:** Pixel Office v1.2 — Dashboard UI, Token Tracking, Asset Replacement
**Domain:** Real-time AI agent monitoring tool — additive feature milestone on existing Canvas 2D + React + WebSocket app
**Researched:** 2026-03-30
**Confidence:** HIGH

## Executive Summary

Pixel Office v1.2 adds three distinct feature areas to an already-working v1.1 product: a richer Dashboard UI panel, per-agent Token/Cost Tracking, and a visual Asset Pack Replacement (MetroCity tiles out, PixelOffice/Pixel Life in). All three are additive — the existing architecture is sound and requires no structural rework. The primary research finding is that **zero new runtime dependencies are needed**: the existing React 19, TypeScript, Express, WebSocket, chokidar, Canvas 2D, and pngjs stack handles everything. The highest-value implementation approach is to extend the existing shared type contract with optional fields (`tokenUsage?: TokenUsage` on `AgentState`) and accumulate token data server-side from JSONL `system/turn_duration` entries, routing it through the existing WebSocket broadcast channel.

The critical path runs through Token Tracking because it is the only feature with a meaningful data engineering challenge: JSONL `usage.input_tokens` values are unreliable (streaming placeholders, undercounted 100–174x), parallel tool calls share a `message.id` causing double-counting, and the cost field `costUSD` was removed from JSONL in Claude Code v1.0.9. The correct approach is to extract `usage` exclusively from `system/turn_duration` entries (one per completed turn), deduplicate by `message.id` within each turn, compute cost server-side using hardcoded model pricing, and rely on `cache_creation_input_tokens` / `cache_read_input_tokens` as the most reliable fields. Dashboard UI and Asset Replacement can proceed fully independently of this pipeline.

The main technical risks are layout-related: a side panel that resizes the canvas `width`/`height` attribute will silently reset the Canvas 2D context, blurring all pixel art until `imageSmoothingEnabled = false` is re-applied. Similarly, CSS layout math must be settled before panel content is built — adding a second panel at 280–360px width requires explicit `min-width: 0` on the canvas wrapper and integer-scale viewport math. Both risks are avoidable by addressing layout constraints first, before any content implementation, making Dashboard UI the correct starting phase.

---

## Key Findings

### Recommended Stack

No new runtime packages are required. The entire v1.2 scope is implementable with the packages already in `package.json`. The existing CSS variable system covers all panel styling. Charting libraries (Recharts, Chart.js) are unnecessary — token stats are 3–4 numbers per agent, displayable as styled `<div>` elements. The `pngjs` devDependency already installed covers any asset inspection scripts.

The one recommended addition is a new server-side module `src/server/pricing.ts` (no package, pure TypeScript constants) containing the model pricing lookup table. Token cost computation belongs server-side so pricing changes never require a client redeploy.

**Core technologies:**
- React 19 + CSS variables: Dashboard panel layout — pure Flexbox/Grid, no UI library, matches project constraint
- TypeScript (optional new interfaces): `TokenUsage`, `AgentEvent.usage` — additive type extensions, no breaking changes
- chokidar (existing): Can watch a statusline bridge file for higher-fidelity token data if needed
- Canvas 2D (existing `SpriteSheet.ts`): Asset replacement uses existing `ObjectSpriteRef` region system — no engine changes
- pngjs (existing devDep): Asset pack inspection and any new prep scripts

**Critical version note:** Do NOT use `costUSD` JSONL field — removed since Claude Code v1.0.9. Use `cost.total_cost_usd` from statusline JSON or compute from `usage.*_tokens` with pricing constants.

### Expected Features

The three new packs are confirmed CC0. PixelOffice (256×224, 16px tile grid) is the primary replacement for MetroCity background/furniture tiles — its tile size is compatible with the existing engine. Pixel Life Desk Essentials (288×64) is best for desk decoration enrichment. `office_assets_release` props/workers (50×50 each) should be treated as supplementary decoration or reference; they are likely single sprites, not uniform sheets.

**Must have (table stakes — v1.2 launch):**
- Token totals per agent (input + output) displayed on agent card — core ask of the milestone
- Session-level cost estimate (USD) per agent — first question token tracking answers
- Cache read indicator per agent — trivial once `usage` is parsed, high perceived value
- Sub-agent visual hierarchy in AgentPanel — `parentId` already exists, pure UI change
- PixelOffice asset integration — replace MetroCity tileset for floor/furniture
- office_assets_release props integration — supplementary decoration sprites

**Should have (v1.2.x after validation):**
- Pixel Life Desk Essentials integration — desk accessories layer, richer aesthetics
- Session duration display — requires adding `createdAt` to `AgentState`
- Cost rate indicator (tokens/min) — useful once base token display is stable

**Defer (v2+):**
- Per-turn token sparkline — HIGH complexity, requires persistent turn history
- Asset pack runtime selector — requires asset-manifest hot-reload architecture
- Historical session browser — major scope increase, 1700+ JSONL files on startup
- Per-tool token attribution — event ordering assumptions may not hold

### Architecture Approach

v1.2 is a pure additive integration. The server pipeline gains one new module (`pricing.ts`) and two modified files (`parser.ts`, `state-machine.ts`). The shared type contract gains two optional interfaces (`TokenUsage`, `AgentEvent.usage?`). The client gains richer renders in `AgentPanel.tsx` and `StatusBar.tsx`. The asset system gains new entries in `asset-manifest.ts` and updated sprite references in `office-layout.ts`. The Canvas engine, WebSocket hook, game loop, and pathfinding are untouched.

Token data flows: JSONL `turn_duration` entry → `parser.ts` extracts `usage` → `state-machine.ts` accumulates `AgentState.tokenUsage` → existing `agent-update` WebSocket broadcast → `useAgentState` hook → `AgentPanel.tsx` renders. No new WebSocket message type is needed; `tokenUsage` travels inside the existing `AgentState` payload.

**Major components and their v1.2 responsibilities:**

1. `src/server/pricing.ts` (NEW) — model pricing constants; `computeCost(usage, model): number`; owned by backend-builder
2. `src/server/parser.ts` (MODIFIED) — extract `usage` from `system/turn_duration` entries; deduplicate by `message.id`
3. `src/server/state-machine.ts` (MODIFIED) — accumulate `tokenUsage` per `turn_end` event
4. `src/shared/types.ts` (MODIFIED) — add `TokenUsage` interface; optional `tokenUsage?` on `AgentState`; optional `usage?` on `AgentEvent` — orchestrator must review
5. `src/client/components/AgentPanel.tsx` (MODIFIED) — richer cards: token stats row, sub-agent indentation, permission indicator
6. `src/client/components/StatusBar.tsx` (MODIFIED) — aggregate token count and cost display
7. `src/shared/asset-manifest.ts` (MODIFIED) — additive new sheet entries for PixelOffice, Pixel Life, office_assets_release
8. `src/shared/office-layout.ts` (MODIFIED) — update `FurnitureObject` sprite refs zone-by-zone to new sheet IDs

### Critical Pitfalls

1. **Canvas context reset when panel opens** — Any write to `canvas.width`/`height` attributes resets the Canvas 2D context and reverts `imageSmoothingEnabled` to `true`, blurring all pixel art. Fix: set canvas attributes to fixed game-world dimensions; re-apply `imageSmoothingEnabled = false` at the top of every `drawFrame()` call; use `flex: 1; min-width: 0` on canvas wrapper so panel width changes never touch the canvas attribute.

2. **Token double-counting from parallel tool calls** — Multiple JSONL entries sharing the same `message.id` (parallel tool calls) cause 3–5x cost inflation if accumulated naively. Fix: maintain a `Set<string>` of seen `message.id` values per session; accumulate only on first occurrence; reset per `turn_end` event.

3. **JSONL streaming placeholder undercounts input tokens** — `usage.input_tokens` is 0 or 1 in 75% of streaming JSONL entries, undercounting by 100–174x. Fix: extract usage only from `system/turn_duration` entries (completed turn), not from streaming `assistant` entries. Accept approximation; display `cache_read` and `cache_creation` tokens (reliable) prominently.

4. **New asset frame dimensions don't match SpriteSheet contract** — Non-uniform sheets (PixelOffice furniture, Pixel Life desk objects) will produce wrong-slice renders if passed incorrect `frameWidth`. Fix: use `ObjectSpriteRef` region system (`sx/sy/sw/sh`) for all new assets; measure every sprite coordinate with an image editor before writing any constant; document in named SPRITES constants, never inline magic numbers.

5. **CSS layout conflict — fixed-scale canvas plus fluid dashboard panels** — Adding a 280–360px wide dashboard panel forces the canvas to shrink below its intended 2× scale width without explicit layout constraints. Fix: implement three-column layout with explicit panel widths and `flex: 1; min-width: 0` on the canvas wrapper; compute canvas integer scale from available pixels; test at 1280px, 1440px, 1920px.

---

## Implications for Roadmap

Based on research, the three features are largely independent but have one hard prerequisite chain and one layout constraint that must be resolved before content work begins. Suggested four-phase structure:

### Phase 1: Layout Foundation + Sub-agent Panel
**Rationale:** Both critical CSS pitfalls (canvas resize invalidation, multi-panel layout conflict) must be addressed before any panel content is built. Once layout is locked, sub-agent hierarchy in AgentPanel is a pure UI change using existing `parentId` data — highest-value, lowest-risk item to ship first. Resolving layout up front means Phases 2 and 3 can be built in parallel without risk of their visual changes breaking each other.
**Delivers:** Stable three-column layout (canvas | agent panel) that survives panel expand/collapse; sub-agent visual indentation in AgentPanel; `imageSmoothingEnabled` applied defensively on every draw call.
**Addresses:** Sub-agent hierarchy (P1 feature), session duration display foundation
**Avoids:** Canvas context reset (Pitfall 1), CSS layout conflict (Pitfall 5)

### Phase 2: Token / Cost Tracking Pipeline
**Rationale:** This is the milestone's primary deliverable and has the most implementation risk. It must be completed after Phase 1 (layout must not cause engine restarts that drop accumulator state) but has no dependency on asset replacement. The server pipeline (parser + state-machine + pricing) should be built and validated against actual Anthropic billing before any UI is wired up. Token UI additions to AgentPanel and StatusBar are the final step.
**Delivers:** Per-agent token totals (input, output, cache read/write) in AgentPanel; session-level USD cost estimate; aggregate cost in StatusBar; `TokenUsage` type in shared contract.
**Uses:** `system/turn_duration` JSONL entries; `src/server/pricing.ts` (new); `AgentState.tokenUsage?` optional field
**Implements:** Token accumulation pipeline (parser → state-machine → WSMessage → AgentPanel)
**Avoids:** Token double-counting (Pitfall 2), streaming placeholder undercounts (Pitfall 3), `AgentState` type contract breakage (architecture anti-pattern)

### Phase 3: Asset Pack Replacement
**Rationale:** Fully independent of Phases 1 and 2. Can proceed in parallel with Phase 2 if multiple agents are available, or after Phase 2 if sequential. The only internal dependency is: complete an inventory/measurement pass before writing any sprite coordinate constants. Replace assets zone-by-zone (not all-at-once) to allow incremental visual validation. Keep MetroCity fallback entries until every zone is confirmed.
**Delivers:** PixelOffice furniture sheets registered in asset-manifest; select furniture objects in office-layout updated to new sprites; office_assets_release props as supplementary decoration; MetroCity fallbacks preserved until full validation.
**Addresses:** PixelOffice integration (P1), office_assets_release integration (P1)
**Avoids:** Asset frame dimension mismatch (Pitfall 3), all-at-once breakage (UX pitfall)

### Phase 4: Polish + P2 Features
**Rationale:** Once the three primary deliverables are validated, add the lower-priority items that depend on Phase 2 stability: Pixel Life desk essentials (depends on asset infra from Phase 3), session duration display (depends on stable AgentState schema from Phase 2), and cost rate indicator (depends on token pipeline from Phase 2 being production-stable).
**Delivers:** Pixel Life desk accessories on desk furniture; session duration in agent cards; tokens/min rolling window display; end-to-end v1.2 validation.
**Addresses:** Pixel Life integration (P2), session duration (P2), cost rate indicator (P2)

### Phase Ordering Rationale

- Phase 1 first because layout bugs compound — building panel content on a broken layout means reworking it twice
- Phase 2 before Phase 4 because Phase 4's cost-rate and duration features depend on Phase 2's stable token pipeline
- Phase 3 is independent and can overlap Phase 2 with a separate agent; sequenced after Phase 1 so the layout baseline is stable before visual inspection
- Phases 1 and 3 have no data pipeline risk; Phase 2 carries the highest implementation risk and should be isolated to its own phase with validation gates

### Research Flags

Phases needing deeper research or validation during planning:
- **Phase 2:** JSONL `system/turn_duration` usage field presence needs empirical verification against live files for the specific Claude Code version in use. Research confirmed the pattern but the exact field path (`raw.usage` vs `raw.message.usage`) should be confirmed with a one-line test parse before building the accumulator. Also: model pricing constants should be verified at implementation time — Anthropic pricing changes periodically.
- **Phase 3:** All three new asset packs need a dedicated measurement/inventory pass before sprite constants are written. PixelOffice is high-confidence (16px grid confirmed), but Pixel Life and office_assets_release require pixel-level coordinate inspection.

Phases with standard patterns (skip additional research):
- **Phase 1:** CSS Flexbox three-column layout with `min-width: 0` is well-documented; `imageSmoothingEnabled` Canvas fix is a known pattern.
- **Phase 4:** All Phase 4 features are direct extensions of Phase 1–3 work; no new patterns or third-party integrations.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings verified from existing codebase + official Claude Code docs; no new dependencies means no version uncertainty |
| Features | HIGH | JSONL schema verified from live files; existing codebase fully read; competing tools (ccusage, Claude-Code-Usage-Monitor) confirm feasibility |
| Architecture | HIGH | Based on direct codebase inspection of all relevant files; integration points are additive and constrained |
| Pitfalls | HIGH | Canvas context reset and CSS layout pitfalls verified against actual `SpriteSheet.ts` and `AgentPanel.tsx` code; token undercounting confirmed from official docs + empirical analysis; deduplication requirement from official SDK docs |

**Overall confidence:** HIGH

### Gaps to Address

- **`system/turn_duration` exact field path for `usage`:** Research identified the entry type and the pattern, but the exact JSON path (`raw.usage` vs `raw.message.usage` vs `raw.content[0].usage`) should be confirmed with a targeted `console.log` on a live JSONL file in `parser.ts` before writing the accumulator logic. Low risk — fix is a one-line path correction.

- **PixelOffice asset tile grid alignment to MetroCity `tileSize: 16`:** PixelOffice uses a 16px grid, confirmed compatible. However, multi-tile furniture objects (e.g., a 2×3 desk) may use different anchor conventions than MetroCity. This needs visual confirmation during the Phase 3 inventory pass.

- **`office_assets_release` sprite type determination:** The 50×50 files may be single sprites, thumbnail sheets, or scene references. This can only be resolved by visual inspection of the actual PNG contents. Research recommends treating them as supplementary decoration rather than primary tileset, but exact usage requires inspection.

- **Statusline bridge approach vs. JSONL-only approach:** Research confirmed JSONL `system/turn_duration` usage as the primary token data source, noting that `usage.input_tokens` from JSONL undercounts 100–174x. If the product requirement is accurate absolute token counts (not just relative/trend display), the statusline bridge approach (writing a Claude Code statusline hook) provides higher fidelity. The decision between approximate-but-zero-setup (JSONL-only) vs. accurate-but-requires-setup (statusline bridge) should be made explicit in requirements.

---

## Sources

### Primary (HIGH confidence)
- Live JSONL file inspection (`~/.claude/projects/D--work-dev-github-ldmprog-iosys-pixel-lab/*.jsonl`) — confirmed `message.usage` schema with `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `message.model` fields
- [Claude Agent SDK Cost Tracking Docs](https://platform.claude.com/docs/en/agent-sdk/cost-tracking) — `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens` field names; deduplication-by-ID requirement
- [Claude Code Statusline Docs](https://code.claude.ai/docs/en/statusline) — full JSON schema for `cost.*`, `context_window.*`, `rate_limits.*` fields
- Existing codebase: `src/shared/types.ts`, `src/server/parser.ts`, `src/server/state-machine.ts`, `src/client/components/AgentPanel.tsx`, `src/client/hooks/useAgentState.ts`, `src/engine/SpriteSheet.ts`, `src/shared/asset-manifest.ts`, `src/shared/office-layout.ts`
- PixelOffice asset pack README (`PixelOffice/README.txt`) — CC0 license confirmed; 16px tile grid confirmed
- [Claude Code JSONL Token Undercounting Analysis](https://gille.ai/en/blog/claude-code-jsonl-logs-undercount-tokens/) — streaming placeholder bug; `input_tokens` undercounted 100–174x empirically measured

### Secondary (MEDIUM confidence)
- [ccusage GitHub](https://github.com/ryoppippi/ccusage) — confirms `costUSD` field history, token field structure, JSONL-based cost parsing feasibility
- [costUSD removal in v1.0.9](https://medium.com/@trysmr/how-to-calculate-claude-code-costs-on-the-claude-max-plan-20adf761d798) — field dropped from JSONL on Max plan (community report)
- [Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor) — confirms real-time overlay pattern from same JSONL files
- [Claude Code token accounting](https://shipyard.build/blog/claude-code-tokens/) — context on JSONL-based measurement
- [React + Canvas coexistence patterns](https://medium.com/@lavrton/using-react-with-html5-canvas-871d07d8d753) — Canvas context lifecycle with React

### Tertiary (LOW confidence)
- pngjs inspection of `office_assets_release` pack — visual estimates of sprite scale (8–16px objects); exact coordinates unverified
- Pixel Life Desk Essentials frame size estimates (16–32px) — inferred from image dimensions, not from explicit documentation

---
*Research completed: 2026-03-30*
*Ready for roadmap: yes*
