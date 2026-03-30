# Architecture Research

**Domain:** Real-time AI agent visualizer — Dashboard UI, Token Tracking, Asset Replacement
**Researched:** 2026-03-30
**Confidence:** HIGH (existing code read directly; new feature patterns verified against current codebase)

---

## Existing Architecture (v1.1 baseline)

Before specifying integration points, the existing pipeline must be understood as-is.

```
JSONL files (~/.claude/projects/*)
    |
    v chokidar watch
[JSONLWatcher]  ──event──>  [AgentStateMachine]
                                    |
                          emit agent-update/added/removed
                                    |
                                    v
                            [WebSocket Server]  ──broadcast──>  WS clients
                            [Express REST API]  ──GET /api/agents
```

```
Browser
  [useWebSocket]  ──lastMessage──>  [useAgentState]  ──agents Map──>
  [useGameEngine] ──sync──>  [PixelOfficeEngine]  ──Canvas 2D──>  <canvas>
  [AgentPanel]  (sidebar, agent list)
  [StatusBar]   (footer, connection + agent count)
  [Tooltip]     (click popup)
```

### Shared contract (src/shared/types.ts)

`AgentState` is the single unit of truth flowing from server to client:

```typescript
interface AgentState {
  id: string;
  name: string;
  sessionId: string;
  status: AgentStatus;
  lastAction: string;
  lastUpdated: number;
  position: { x: number; y: number };
  permissionPending: boolean;
  parentId?: string;
}
```

`WSMessage` carries `type: 'agent-update' | 'agent-added' | 'agent-removed'` with `AgentState` payload.

---

## v1.2 Integration Architecture

Three features land in v1.2. Each is analyzed below for integration scope.

### Feature 1: Dashboard UI (side panel expansion)

**What exists:** `AgentPanel.tsx` is already a sidebar with agent cards. Each card shows: status dot, name, status label, lastAction, session prefix, time-ago.

**What's missing:** Per-agent tool breakdown, session duration, project name, sub-agent indicator, active tool icon. The panel is purely display — no new data pipeline is needed, only UI enrichment.

**Integration approach:** Additive changes to `AgentPanel.tsx`. No new hooks, no shared type changes, no server changes.

`AgentState` already carries enough for a richer panel:
- `status` → tool category icon (typing/reading/executing/waiting)
- `lastAction` → already contains tool name + path (e.g. "Read src/foo.ts")
- `lastUpdated` → session duration computable from first-seen time
- `parentId` → sub-agent indicator (show indentation or badge)
- `permissionPending` → already rendered in canvas bubble; show in panel too

**New client data needed (optional):** `firstSeen` timestamp per agent. This is not in `AgentState` today. Two options:
- Option A: Track it in `useAgentState.ts` hook (Map<id, firstSeenMs>) — no server change
- Option B: Add `createdAt: number` to `AgentState` in shared types — server sets it at creation

Option A is lower risk. Option B is cleaner but requires orchestrator sign-off on types.ts.

**Component boundary:**

```
AgentPanel.tsx (modified — expanded card content)
  ├── AgentCard (inline or extracted sub-component)
  │     ├── status icon + name + sub-agent badge
  │     ├── active tool row (lastAction parsed)
  │     ├── duration display (firstSeen from hook)
  │     └── permission pending indicator
  └── (optional) DashboardHeader with aggregate stats
```

---

### Feature 2: Token / Cost Tracking

**Data source reality check:**

Claude Code JSONL entries contain a `usage` object with these fields:
```
usage.input_tokens              — unreliable (streaming placeholder, usually 0 or 1)
usage.output_tokens             — partial (excludes thinking tokens, streaming artifact)
usage.cache_creation_input_tokens — reliable
usage.cache_read_input_tokens     — reliable
```

Source: [gille.ai analysis](https://gille.ai/en/blog/claude-code-jsonl-logs-undercount-tokens/) confirms `input_tokens` is undercounted 100-174x in JSONL. The reliable path is: read `usage` from the last entry in a session's JSONL, not from streaming events.

**Practical integration approach:** Parse `usage` from `system` type entries (which contain `turn_duration` subtype) and `assistant` type entries. The `system/turn_duration` entry is already parsed. It likely carries usage in the raw object even if the current code ignores it.

**Where token data enters the pipeline:**

```
JSONL line (type: "system", subtype: "turn_duration")
    raw object may contain:  { usage: { input_tokens, output_tokens, ... } }
    Currently: parser.ts returns type:'turn_end', ignores usage fields
    New:       parser.ts extracts usage fields into AgentEvent
```

**New types required in shared/types.ts:**

```typescript
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;          // sum for display
  estimatedCostUsd: number;     // computed from model pricing
}
```

This field is additive to `AgentState` as optional `tokenUsage?: TokenUsage`. Being optional means no breakage to existing code paths.

**Server pipeline changes:**

1. `parser.ts` — extract `usage` from `system/turn_duration` raw entries into `AgentEvent`
2. `AgentEvent` type — add optional `usage?: TokenUsage` field
3. `AgentStateMachine.processEvent()` — accumulate `tokenUsage` on `AgentState` when `event.type === 'turn_end'` and `event.usage` is present
4. `WSMessage` broadcast — no change needed; `AgentState` already carries the full object

**Cost computation:** Apply Anthropic model pricing constants server-side at accumulation time. Do not compute in the client — server owns the pricing table. Constants can live in `src/server/pricing.ts`.

**Pricing table (as of 2026-03-30, Claude 3.x/Sonnet 4 tiers):**

| Model | Input per MTok | Output per MTok | Cache write per MTok | Cache read per MTok |
|-------|---------------|-----------------|---------------------|---------------------|
| claude-sonnet-4 | $3.00 | $15.00 | $3.75 | $0.30 |
| claude-opus-4 | $15.00 | $75.00 | $18.75 | $1.50 |
| fallback | $3.00 | $15.00 | $3.75 | $0.30 |

Model detection: parse `model` field from JSONL entries when present.

**Dashboard display:** Token data surfaces in the AgentPanel card and optionally in a global stats footer row. `StatusBar.tsx` can gain a total-tokens-across-agents display.

---

### Feature 3: Asset Replacement (new asset packs)

**What's changing:** Replace MetroCity CC0 office furniture sprites with new packs. This affects:
- `asset-manifest.ts` (furnitureSheets registry)
- `office-layout.ts` (sprite references per FurnitureObject)
- `public/assets/` directory (new image files need to be served)

**New asset packs on disk (analyzed visually):**

| Pack | Files | Contents | Notes |
|------|-------|----------|-------|
| PixelOffice | `PixelOfficeAssets.png` (256x224) | Blue cubicle desks, computers, chairs, sofas, vending machine, plants, server rack | Top-down pixel art, ~16px tile grid, office-appropriate style |
| PixelOffice | `PixelOffice.png` (256x224) | Full office scene reference (tilemap) | Use as layout reference, not directly as spritesheet |
| Pixel Life Desk Essentials | `spritesheet.png` | Individual desk items: monitor, keyboard, phone, coffee, vase, stapler, brick wall, door | Mixed-scale items, not a uniform grid — needs careful region mapping |
| office_assets_release | `office_workers.png` | 4-direction character sprites (office worker style) | Character sheet compatible with existing 32x32 FSM layout |
| office_assets_release | `props.png` | Minimal props: ladder, windows, door, table | Very sparse |

**Architecture impact — ObjectRenderer:** `ObjectRenderer.loadSheets()` accepts `Record<string, FurnitureSpriteSheet>` from `AssetManifest.furnitureSheets`. Adding new sheets requires only entries in `asset-manifest.ts`. No engine code changes.

**Architecture impact — FurnitureObject:** `ObjectSpriteRef` uses `{ sheetId, region: { sx, sy, sw, sh } }`. New assets integrate via the same region-based reference system. No type changes required.

**Architecture impact — TileMap:** Floor/wall tiles come from `tileSheet.url` in the manifest. If PixelOffice floor tiles are to replace MetroCity tiles, only `asset-manifest.ts` tileSheet entry changes plus re-mapping of `office-layout.ts` tile indices.

**Character sprite option:** `office_assets_release/office_workers.png` shows a character sheet with 4-directional walking frames. It could replace the current MetroCity-derived claude/codex/gemini sprites. Frame count and layout must be verified before committing — the existing sprite system expects 11 rows x 4 columns (44 frames). The office_workers sheet appears to be a simpler 3-direction layout and would need a custom `CharacterSprite` animation map rather than the standard 11-row layout.

**Recommended approach for assets:**

1. Copy new asset PNG files to `public/assets/new/` (separate from `/assets/metrocity/`)
2. Add new sheet entries to `asset-manifest.ts` (additive — keep MetroCity entries as fallback)
3. Update specific `FurnitureObject` references in `office-layout.ts` to use new sheet IDs
4. Do not delete MetroCity entries until the new layout is confirmed working

---

## Component Boundaries: New vs Modified

| File | Status | Change |
|------|--------|--------|
| `src/shared/types.ts` | **MODIFIED** | Add `TokenUsage` interface; add `tokenUsage?: TokenUsage` to `AgentState`; add optional `usage?` to `AgentEvent` |
| `src/server/parser.ts` | **MODIFIED** | Extract `usage` fields from `system/turn_duration` raw entry |
| `src/server/state-machine.ts` | **MODIFIED** | Accumulate `tokenUsage` on `AgentState.tokenUsage` per turn_end event |
| `src/server/pricing.ts` | **NEW** | Model pricing constants; `computeCost(usage, model): number` pure function |
| `src/client/components/AgentPanel.tsx` | **MODIFIED** | Richer agent cards: tool icon, duration, permission indicator, token stats |
| `src/client/components/StatusBar.tsx` | **MODIFIED** | Add aggregate token count / cost display |
| `src/shared/asset-manifest.ts` | **MODIFIED** | Add new asset pack sheet entries |
| `src/shared/office-layout.ts` | **MODIFIED** | Update FurnitureObject sprite refs to use new sheet IDs |
| `public/assets/new/` | **NEW DIR** | New asset PNG files copied here |
| `src/client/hooks/useAgentState.ts` | **MODIFIED (optional)** | Track `firstSeen` timestamps per agent for duration display |

Engine files (`src/engine/*`), game loop, Canvas rendering, WebSocket hook — no changes needed.

---

## Data Flow (v1.2 additions)

### Token tracking flow

```
JSONL: system/turn_duration entry (raw.usage present)
    |
    v parser.ts
AgentEvent { type: 'turn_end', usage: { inputTokens, outputTokens, ... } }
    |
    v state-machine.ts processEvent()
AgentState.tokenUsage accumulated (per-session running total)
    |
    v WSMessage agent-update broadcast
    |
    v useAgentState.ts — agents Map updated
    |
    v AgentPanel.tsx — token display per card
    v StatusBar.tsx  — aggregate tokens / cost
```

### Asset replacement flow

```
New PNG files in public/assets/new/
    |
    v asset-manifest.ts (new furnitureSheets entries)
    |
    v PixelOfficeEngine.start() calls ObjectRenderer.loadSheets()
    |
    v office-layout.ts FurnitureObject refs updated to new sheetId
    |
    v ObjectRenderer.renderLayer() draws from new sheets
```

### Dashboard panel flow

No new data flow. Existing `AgentState` from `useAgentState` feeds the enriched panel. Optional `firstSeen` tracking in `useAgentState.ts` requires no server changes.

---

## Suggested Build Order

Build order respects dependencies: server data before client display, types before consumers, assets independently of everything else.

**Step 1 — Types contract (prerequisite for 2 and 3)**
Modify `src/shared/types.ts`: add `TokenUsage`, add optional `tokenUsage?` to `AgentState`, add optional `usage?` to `AgentEvent`. This is the only shared type change needed. All downstream consumers treat these as optional, so no existing code breaks.

**Step 2 — Token pipeline (server)**
Implement in order:
1. `src/server/pricing.ts` — pricing constants + cost function (no deps)
2. `src/server/parser.ts` — extract `usage` from `turn_duration` entries
3. `src/server/state-machine.ts` — accumulate `tokenUsage` per turn_end

**Step 3 — Dashboard UI (client)**
Modify `AgentPanel.tsx` for richer cards. Optionally modify `useAgentState.ts` for `firstSeen` tracking. Modify `StatusBar.tsx` for aggregate token display. These have no deps on step 2 for the UI structure — token fields just render as 0/null until the pipeline is live.

**Step 4 — Asset replacement**
Independent of all above. Copy new assets, update `asset-manifest.ts` and `office-layout.ts`. Can be done in parallel with any other step.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Modifying AgentState with non-optional token fields

**What to avoid:** Adding `tokenUsage: TokenUsage` (required, not optional) to `AgentState` before the server pipeline is complete.
**Why wrong:** All existing `AgentState` objects in flight lack the field. TypeScript will error; if cast away, runtime will crash wherever the field is accessed.
**Do this instead:** `tokenUsage?: TokenUsage` — optional throughout. Render "—" or "0" when absent.

### Anti-Pattern 2: Computing token cost in the client

**What to avoid:** Passing raw token counts to the browser and computing `$ = tokens * rate` in React.
**Why wrong:** Pricing changes require a client redeploy; pricing is business logic that belongs server-side.
**Do this instead:** Compute `estimatedCostUsd` in `pricing.ts` server-side at accumulation time. Send the pre-computed cost in `TokenUsage`.

### Anti-Pattern 3: Trusting streaming `usage.input_tokens` values

**What to avoid:** Summing `usage.input_tokens` from every JSONL event as they arrive in the watcher.
**Why wrong:** Claude Code writes streaming placeholders — 75% of JSONL entries have `input_tokens` of 0 or 1. Accumulating these produces values 100x too low.
**Do this instead:** Only update `tokenUsage` when processing `turn_end` events, where the `system/turn_duration` entry's `usage` reflects the completed turn. Accept that the number will still be approximate for input tokens; show `cache_read` and `cache_creation` which are reliable.

### Anti-Pattern 4: Deleting MetroCity asset entries before validating new layout

**What to avoid:** Removing MetroCity sheet entries from `asset-manifest.ts` while updating `office-layout.ts`.
**Why wrong:** Any missed furniture reference causes silent render failures (ObjectRenderer logs a warning and skips — no crash, but invisible furniture).
**Do this instead:** Keep both asset sets registered simultaneously. Flip references one zone at a time. Delete MetroCity entries last, after full visual validation.

### Anti-Pattern 5: Adding a new WebSocket message type for token events

**What to avoid:** Creating a `token-update` WSMessage type to push token data separately from `agent-update`.
**Why wrong:** The existing `WSMessage` union and `useAgentState` reducer handle all state on a per-agent basis. A parallel channel fragments the state model and requires client-side merging.
**Do this instead:** Include `tokenUsage` inside `AgentState`. It travels in the existing `agent-update` broadcast with no protocol changes.

---

## Integration Points Summary

| Integration Point | Direction | Mechanism | Notes |
|-------------------|-----------|-----------|-------|
| JSONL `turn_duration` usage fields | JSONL → server | parser.ts extraction | Reliable for cache tokens; approximate for input/output |
| `AgentState.tokenUsage` | server → client | WSMessage agent-update | Optional field, no breaking change |
| `AgentPanel.tsx` token display | state → UI | React props (existing `agents` Map) | No new hooks |
| `StatusBar.tsx` aggregate cost | state → UI | React props or new `useTokenStats` hook | Sum across all agents |
| New asset sheets | disk → canvas | `asset-manifest.ts` + `ObjectRenderer` | Additive; zero engine changes |
| `office-layout.ts` sprite refs | manifest → engine | `FurnitureObject.sprite.sheetId` | Point to new sheet IDs |

---

## Sources

- Existing codebase: `src/shared/types.ts`, `src/server/parser.ts`, `src/server/state-machine.ts`, `src/server/index.ts`, `src/engine/index.ts`, `src/engine/ObjectRenderer.ts`, `src/engine/SpriteSheet.ts`, `src/client/App.tsx`, `src/client/components/AgentPanel.tsx`, `src/client/hooks/useAgentState.ts`
- [Claude Code JSONL token undercount analysis](https://gille.ai/en/blog/claude-code-jsonl-logs-undercount-tokens/) — streaming placeholder issue with `usage.input_tokens`
- [ccusage — JSONL token field reference](https://github.com/ryoppippi/ccusage) — confirms `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`
- [Claude Code token accounting](https://shipyard.build/blog/claude-code-tokens/) — context on JSONL-based measurement
- New asset packs inspected visually: `PixelOffice/PixelOfficeAssets.png`, `Pixel Life - Desk Essentials/spritesheet.png`, `office_assets_release/office_workers.png`

---

*Architecture research for: Pixel Office v1.2 — Dashboard UI, Token Tracking, Asset Replacement*
*Researched: 2026-03-30*
