# Feature Research

**Domain:** AI agent monitoring tool — dashboard UI, token/cost tracking, asset replacement
**Researched:** 2026-03-30
**Confidence:** HIGH (JSONL schema verified from live files; existing codebase fully read)

---

## Context: What Already Exists

The following features are COMPLETE and must not be rebuilt:

- 30x24 office grid, 6 zones, 80+ furniture objects (MetroCity CC0)
- AgentPanel side panel (name, status dot, lastAction, sessionId, time-ago)
- StatusBar (connection state, agent count, clock)
- Tooltip (click-on-canvas agent details)
- SoundToggle + chime on waiting transition
- 3-state FSM (work/walk/idle), BFS pathfinding, 4-direction walk sprites
- Sub-agent spawn/despawn with Matrix effect
- Permission bubble (7s timer) + waiting bubble + click dismiss

The three new feature areas are: **Dashboard UI enrichment**, **Token/Cost Tracking**, **Asset Pack Replacement**.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Tool name in agent card | AgentPanel already shows `lastAction` text — showing the tool name clearly is expected | LOW | `lastAction` already contains tool strings like "Read src/..." — needs a dedicated field or parse |
| Session duration display | Monitoring tools always show how long a session has been running | LOW | `lastUpdated - createdAt`; need to add `createdAt` to AgentState or track in UI |
| Sub-agent visual indicator in panel | Sub-agents exist in canvas but AgentPanel shows them flat — parent/child hierarchy expected | MEDIUM | `parentId` already on AgentState; panel needs indentation or badge |
| Token count display per agent | Primary ask of the milestone; users expect to see input+output tokens | MEDIUM | Requires parser change to extract `message.usage` from assistant entries |
| Session-level cost total | "How much did this session cost?" is the first question token tracking answers | MEDIUM | Sum cost across all assistant entries per sessionId |
| Running session total (all agents) | Dashboard-level aggregate for multi-agent scenarios | LOW | Sum of per-agent session costs |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Cache efficiency indicator | Shows cache_read vs cache_creation ratio — tells user if Claude is being efficient | LOW | Fields confirmed in JSONL: `cache_read_input_tokens`, `cache_creation_input_tokens` |
| Per-turn token sparkline | Visual mini-graph of token usage over time per agent — makes patterns visible | HIGH | Requires storing per-turn history; Canvas 2D sparkline or SVG in React panel |
| Cost rate indicator (tokens/min) | Shows if an agent is burning tokens fast — early warning for runaway sessions | MEDIUM | Rolling window calculation from per-turn token events |
| Asset pack selector UI | Runtime switching between MetroCity / PixelOffice / Pixel Life looks — fun differentiator | HIGH | Requires asset-manifest hot-reload and office-layout regeneration per pack |
| Per-tool token attribution | "Read used 3K tokens, Bash used 50K" — shows where cost comes from | HIGH | Requires correlating tool_use events with subsequent assistant usage entries |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Historical session browser | "Show me all past sessions" | Requires reading all 1700+ JSONL files on startup, slowing launch; scope creep | Show current session only; add "load past session" as a separate v1.3 feature |
| Real-time cost alerts / budget limits | "Warn me when spending too much" | Requires a budget configuration system, alert UI, potential notification API — doubles scope | Show running cost visually; let the number itself be the warning |
| Anthropic Console API integration | "Pull usage from the cloud" | Requires OAuth/API key management, network dependency, breaks local-only principle | JSONL files already contain all usage data; no API call needed |
| Full asset pack editor / tilemap builder | "Let me rearrange furniture" | Entire new application inside this one; the office-layout.ts generation is already complex enough | Ship the three packs as fixed presets; user chooses at startup or via panel |
| Per-message token breakdown table | "Show every single API call" | Renders poorly in a side panel; too granular for monitoring use case | Aggregate by turn (turn_duration boundary); show turn-level summaries |

---

## Feature Dependencies

```
[Token Display in AgentPanel]
    └──requires──> [Parser: extract message.usage from assistant entries]
                       └──requires──> [AgentState: add tokenStats field]

[Session Cost Total]
    └──requires──> [Token Display in AgentPanel] (same data source)
    └──requires──> [Pricing table: model -> $/token lookup]

[Cache Efficiency Indicator]
    └──requires──> [Parser: extract message.usage] (same dependency)
    └──enhances──> [Session Cost Total] (cache reduces effective cost)

[Sub-agent hierarchy in AgentPanel]
    └──requires──> [nothing new] (parentId already on AgentState)
    └──enhances──> [Token Display] (sub-agent tokens shown under parent)

[Asset Pack Selector UI]
    └──requires──> [Asset Pack Analysis: sprite-region mapping for each pack]
    └──requires──> [office-layout regeneration for new pack tile sizes]
    └──conflicts──> [incremental furniture placement] (full layout rebuild required)

[Per-turn token sparkline]
    └──requires──> [Token Display] (base data pipeline)
    └──requires──> [turn_duration boundary events] (already parsed as turn_end)
```

### Dependency Notes

- **Token display requires parser change:** The existing parser (`parser.ts`) discards `assistant` entries after extracting tool/text content. It must also extract `message.usage` and surface it as a new field on `AgentEvent`, then `AgentState` must accumulate totals.
- **Cache efficiency requires same parser change:** Once `message.usage` is extracted, cache fields are free — same parse, different display field.
- **Asset pack replacement has no code dependencies** on token tracking and can ship in parallel or earlier. Its dependency is purely on the research/analysis of the three new packs' sprite layouts.
- **Sub-agent hierarchy in panel requires no new data** — `parentId` is already on `AgentState`. It only requires a UI change to `AgentPanel.tsx`.

---

## MVP Definition

### Launch With (v1.2)

Minimum viable product for the milestone — what validates the three feature areas.

- [ ] **Token totals per agent in AgentPanel** — input + output tokens displayed on the agent card; the core ask of token tracking
- [ ] **Session cost total** — running USD cost per session using model pricing lookup (model is available: `message.model` = "claude-opus-4-6")
- [ ] **Cache read indicator** — show cache_read_input_tokens as a percentage or badge; trivial once usage is parsed
- [ ] **Sub-agent visual hierarchy in panel** — indent sub-agent cards under parent; uses existing `parentId` field
- [ ] **Asset pack: PixelOffice integration** — replace the MetroCity tileset with PixelOffice.png for the floor/walls; remapping office-layout.ts furniture sprites to PixelOfficeAssets.png
- [ ] **Asset pack: office_assets_release integration** — integrate props.png as supplementary decoration sprites

### Add After Validation (v1.2.x)

Features to add once the core is working and stable.

- [ ] **Pixel Life — Desk Essentials integration** — spritesheet.png for desk accessories layer; adds visual richness without disrupting layout
- [ ] **Session duration display** — requires adding `createdAt` timestamp to AgentState; minor schema change
- [ ] **Cost rate indicator** — tokens/min rolling window; useful once token display is stable

### Future Consideration (v2+)

Features to defer until after v1.2 ships.

- [ ] **Per-turn token sparkline** — HIGH complexity, requires persistent turn history; worth doing for power users but not for initial monitoring UX
- [ ] **Asset pack runtime selector** — UI to switch packs without restart; requires significant asset-manifest hot-reload architecture
- [ ] **Historical session loader** — browse past JSONL sessions; major scope increase, separate milestone
- [ ] **Per-tool token attribution** — correlating tool events to usage entries requires event ordering assumptions that may not hold

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Token totals per agent | HIGH | MEDIUM | P1 |
| Session cost total | HIGH | LOW (once usage parsed) | P1 |
| Cache read indicator | MEDIUM | LOW (same pipeline) | P1 |
| Sub-agent hierarchy in panel | MEDIUM | LOW | P1 |
| PixelOffice asset integration | HIGH | MEDIUM | P1 |
| office_assets_release integration | MEDIUM | MEDIUM | P1 |
| Session duration display | LOW | LOW | P2 |
| Pixel Life desk essentials | LOW | MEDIUM | P2 |
| Cost rate indicator | MEDIUM | MEDIUM | P2 |
| Per-turn token sparkline | MEDIUM | HIGH | P3 |
| Asset pack runtime selector | LOW | HIGH | P3 |
| Historical session browser | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.2 launch
- P2: Should have, add after P1 is stable
- P3: Nice to have, future milestone

---

## Implementation Notes by Feature Area

### Dashboard UI

The existing `AgentPanel.tsx` already has the structure needed. Enrichment is additive:

- Agent card gets a new "tokens" row below `agent-card-action`
- Sub-agents get `padding-left` or a tree connector line — no new data needed
- StatusBar gets a "Total cost: $X.XXXX" segment — aggregate from all agents

**CSS constraint:** React + CSS only, no Tailwind/MUI. The existing CSS variable system (`var(--status-typing)` etc.) is the pattern to follow.

### Token / Cost Tracking

**JSONL data confirmed available** (verified from live files in `~/.claude/projects`):

```
assistant entry → message.usage:
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number

assistant entry → message.model: "claude-opus-4-6" (or other)
```

**Implementation path:**
1. `parser.ts`: When `entryType === 'assistant'` and `raw.message?.usage` exists, extract and attach to `AgentEvent` as a new optional `usage` field
2. `types.ts`: Add `TokenUsage` interface and optional `tokenStats` to `AgentState` (accumulator pattern)
3. `state-machine.ts`: In `processEvent`, accumulate `event.usage` into `agent.tokenStats`
4. `WSMessage`: No change needed — AgentState is already passed through
5. `AgentPanel.tsx`: Render tokenStats on the card

**Pricing lookup** (hardcode for v1.2, no config needed):

| Model | Input $/1M | Output $/1M | Cache read $/1M | Cache write $/1M |
|-------|-----------|------------|----------------|-----------------|
| claude-opus-4-x | $15 | $75 | $1.50 | $18.75 |
| claude-sonnet-4-x | $3 | $15 | $0.30 | $3.75 |
| claude-haiku-3-x | $0.25 | $1.25 | $0.025 | $0.30 |

Use model string prefix matching (not exact match) to handle minor version differences.

### Asset Pack Replacement

**Three packs available, all CC0:**

1. **PixelOffice** (2dPig, CC0) — `PixelOffice.png` (10.4KB) + `PixelOfficeAssets.png` (9.2KB) + Aseprite sources. Contains full scene png and individual asset sheet. Best candidate for background/floor tileset replacement.

2. **office_assets_release** — `props.png` (854B, very small — likely 16x16 sprites) + `office_workers.png` (665B). Minimal pack; suitable for supplementary decoration sprites rather than primary tileset.

3. **Pixel Life — Desk Essentials** — `spritesheet.png` (3KB). Desk accessories. Best for adding desk decoration objects (monitors, plants, cups) on top of existing layout.

**Key challenge:** The existing system uses MetroCity CC0 tiles at 16x16 (tileSize in AssetManifest). New packs need sprite region analysis before use. The `SpriteRegion` + `ObjectSpriteRef` system in `types.ts` already supports arbitrary source coordinates, so the mapping work is purely data (no engine changes needed).

**Recommended approach:**
- Keep existing office-layout.ts structure intact
- Add new sheetIds to `furnitureSheets` in `AssetManifest`
- Remap select furniture sprite references to point at new sheets
- Do NOT rebuild the office-layout grid from scratch — map new sprites onto existing furniture objects

---

## Competitor Feature Analysis

| Feature | ccusage (CLI) | Claude-Code-Usage-Monitor | Our Approach |
|---------|--------------|--------------------------|--------------|
| Token display | Session aggregate table | Real-time CLI overlay | Inline in agent card, per-agent |
| Cost display | USD totals by session | USD with burn rate | Per-agent + dashboard total |
| Cache tracking | Yes, separate columns | Yes | Yes, as efficiency badge |
| Historical view | All sessions | Rolling 8-day window | Current session only (v1.2) |
| Visual format | Terminal table | Terminal overlay | Pixel art UI, React side panel |
| Sub-agent tracking | No | No | Yes (existing feature) |

Our approach has a unique advantage: cost data is **contextual to the visual character** — seeing the agent typing and seeing its token cost simultaneously. No CLI tool does this.

---

## Sources

- Live JSONL file inspection (`~/.claude/projects/D--work-dev-github-ldmprog-iosys-pixel-lab/*.jsonl`) — confirmed `message.usage` schema with `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `message.model` fields. HIGH confidence.
- [Track cost and usage — Claude Agent SDK Docs](https://platform.claude.com/docs/en/agent-sdk/cost-tracking) — confirmed `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens` field names and `total_cost_usd` on result messages. HIGH confidence.
- [ccusage — Claude Code Usage Analysis](https://ccusage.com/) — confirmed token/cache tracking is feasible from JSONL. MEDIUM confidence (no schema details in docs).
- [Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor) — confirms real-time overlay pattern from same JSONL files. MEDIUM confidence.
- Existing codebase read: `src/shared/types.ts`, `src/server/parser.ts`, `src/server/state-machine.ts`, `src/client/components/AgentPanel.tsx`, `src/client/App.tsx`. HIGH confidence.
- PixelOffice asset pack README (`PixelOffice/README.txt`) — CC0 license confirmed, contents described. HIGH confidence.

---

*Feature research for: Pixel Office v1.2 — Dashboard UI, Token Tracking, Asset Replacement*
*Researched: 2026-03-30*
