# Pitfalls Research

**Domain:** Adding Dashboard UI, Token Tracking, and Asset Replacement to an existing Canvas 2D + React + WebSocket app (Pixel Office v1.2)
**Researched:** 2026-03-30
**Confidence:** HIGH (based on direct codebase inspection + official docs verification)

---

## Critical Pitfalls

### Pitfall 1: Canvas Resize Invalidates Game State When Side Panel Opens

**What goes wrong:**
The OfficeCanvas element is sized relative to the parent container. When the dashboard side panel expands or collapses, the parent width changes, which triggers a CSS resize. If the canvas `width`/`height` attributes are changed (not just CSS size), the Canvas 2D context is reset — all drawn state is erased and the `imageSmoothingEnabled` setting reverts to `true`. The game loop renders one blank frame, then continues, but the pixel-art assets appear blurred until `imageSmoothingEnabled = false` is re-applied on every draw call.

**Why it happens:**
Developers set the HTML `width`/`height` attributes to follow container size via `ResizeObserver`. Any write to `canvas.width` or `canvas.height` — even to the same value — completely resets the context. The `useGameEngine` hook currently passes `agents` as a prop which can trigger re-renders on every WebSocket message. If the OfficeCanvas component unmounts/remounts due to layout changes, the engine's `start()`/`stop()` cycle fires and drops in-flight path-finding state.

**How to avoid:**
- Fix `canvas.width` and `canvas.height` at game-world dimensions (e.g., `30 * 16 * scale` = 480 CSS pixels wide). Let CSS `width: 100%` with `object-fit: contain` handle responsive scaling.
- Apply `ctx.imageSmoothingEnabled = false` at the top of every `drawFrame()` call, not just at init.
- Use `position: relative` + `flex: 1` on the canvas wrapper so side-panel width changes do not affect the canvas element's attribute dimensions.
- Never let the dashboard panel cause `OfficeCanvas` to unmount — keep it as a sibling, not a wrapper.

**Warning signs:**
- Blurry sprites appearing after panel toggle.
- Console error: "Cannot read properties of null (reading 'drawImage')" — engine drawing into a cleared context.
- Character positions resetting when the panel is first opened.

**Phase to address:** Dashboard UI phase (first milestone of v1.2). Establish layout constraints before building any panel content.

---

### Pitfall 2: Token Accumulation Double-Counts Parallel Tool Calls

**What goes wrong:**
Claude's JSONL files emit multiple `assistant` entries that share the same `message.id` when parallel tool calls are active (e.g., when Claude reads several files simultaneously). If the parser sums `input_tokens` from every line, tokens are counted 2–4x. This produces wildly inflated cost estimates (e.g., $0.80 shown for a session that actually cost $0.08).

**Why it happens:**
The official SDK documentation explicitly warns: "When Claude uses multiple tools in one turn, all messages in that turn share the same `id`, so deduplicate by ID to avoid double-counting." The existing `parser.ts` is designed for state changes, not token accumulation — it has no deduplication logic.

**How to avoid:**
- Maintain a `Set<string>` of seen `message.id` values per session. Only accumulate `input_tokens` + `output_tokens` for IDs not yet seen.
- The authoritative total is in the `result` message (`total_cost_usd`). If the JSONL format exposes this, use it as the ground truth and use per-step data only for the live "in-progress" estimate.
- Treat `cache_creation_input_tokens` and `cache_read_input_tokens` as separate fields — do not add them to `input_tokens` directly (they have different per-token pricing).
- Reset the `seenIds` set when a `turn_end` system event is parsed — each turn is a fresh deduplication scope.

**Warning signs:**
- Cost estimates 3–5x higher than the Anthropic billing dashboard.
- Token count jumps by several thousand in a single event when multiple tools fire.
- `input_tokens` reported is identical across 3–4 consecutive JSONL lines with same `message.id`.

**Phase to address:** Token Tracking phase. Before displaying any number, validate against a known session's actual billing.

---

### Pitfall 3: New Asset Pack Frame Dimensions Don't Match the SpriteSheet Contract

**What goes wrong:**
The `SpriteSheet` class derives column count as `Math.floor(img.width / this.frameWidth)`. MetroCity sheets use variable per-sprite sizes (region-based, not fixed-frame). The three new packs have completely different cell structures:
- `PixelOfficeAssets.png` — 256×160, mixed-size furniture objects, no uniform grid
- `Pixel Life spritesheet.png` — 288×64, objects appear ~16–32px wide but inconsistently spaced
- `office_assets_release/props.png` — very small objects (~8–16px), different scale from MetroCity 16px tiles

If a developer passes the wrong `frameWidth` / `frameHeight` to `SpriteSheet`, `drawFrame()` computes the wrong `sx`/`sy`, and draws a completely wrong region — yielding visual garbage that looks like a random slice of the sheet.

**How to avoid:**
- For non-uniform sheets, use the existing `ObjectSpriteRef` region pattern (`{ sx, sy, sw, sh }`) already in `FurnitureObject.sprite`, bypassing `SpriteSheet.drawFrame()` and calling `ctx.drawImage()` directly with measured coordinates.
- Measure every new asset's pixel coordinates using an image editor or the browser inspector before writing any layout constant.
- Add an inventory pass (like the existing `ASSET-INVENTORY.md`) specifically for new packs before writing a single `SPRITES` constant.
- Check visual scale compatibility: PixelOffice pack uses ~16px tile grid, matching MetroCity; `Pixel Life` desk objects are ~16px; `office_assets_release` props appear 8px-scale — mixing 8px and 16px assets will produce half-size or double-size furniture on the 16px tile map.

**Warning signs:**
- Furniture appears as a wrong-colored rectangle or a fragment of another object.
- Objects that are visually twice or half the expected tile width.
- `drawFrame()` returning blank/transparent area (out-of-bounds region on small sheet).

**Phase to address:** Asset Replacement phase. Do the inventory/measurement pass first; write SPRITES constants only after pixel coordinates are confirmed.

---

### Pitfall 4: `AgentState` Type Contract Broken by Adding Token Fields Without Orchestrator Review

**What goes wrong:**
`src/shared/types.ts` is declared immutable — only the orchestrator may modify it. Adding `tokenCount` or `costUsd` fields to `AgentState` (the obvious place) without updating the server's `WSMessage` serialization, the client's `useAgentState` reducer, and the Canvas engine's `Character` class causes a cascade of TypeScript errors and silent runtime failures. The dashboard panel reads `undefined` for cost fields, the AgentPanel shows NaN, and the engine crashes if it tries to spread the updated `AgentState`.

**Why it happens:**
Developers add the field where it feels natural (`AgentState`), but the type is shared across three consumers (server state machine, WebSocket message, React client). The `WSMessage.payload: AgentState | AgentState[]` means the new field must be serialized in every broadcast path.

**How to avoid:**
- Create a separate `TokenStats` type in `types.ts` and a separate `WSMessage` variant `token-update` with `payload: TokenStats` rather than modifying `AgentState`.
- If embedding in `AgentState` is chosen, update all three locations atomically: `types.ts`, `state-machine.ts` (accumulation), and `useAgentState.ts` (reducer handling `agent-update`).
- The dashboard panel should derive cost from its own local state fed by `token-update` messages, not from `AgentState`, keeping concerns separated.

**Warning signs:**
- TypeScript build errors in `src/server/state-machine.ts` after adding a field to `AgentState`.
- `cost` showing as `undefined` in the dashboard even though the server logs show it being set.
- The game engine crashing when spreading a new `AgentState` that has fields the engine's `Character` class does not expect.

**Phase to address:** Token Tracking phase, design step. Finalize the WSMessage schema extension before writing any accumulation logic.

---

### Pitfall 5: CSS Layout Conflict Between Pixel-Perfect Canvas Scaling and Fluid Dashboard Panel

**What goes wrong:**
The existing layout uses a flex row: `canvas-wrapper` + `AgentPanel`. The Canvas target is 30×24 tiles × 16px = 480×384 world pixels, rendered at 2× scale = 960×768 CSS pixels. Adding a wider dashboard panel (e.g., 360px) forces the canvas to shrink below 960px — but the canvas is rendering at a fixed 2× scale. The result is either: (a) horizontal scroll appears, (b) the canvas is clipped, or (c) CSS scale is applied post-render, causing blurring.

**Why it happens:**
The project uses `React + CSS only` (no Tailwind/MUI). Without explicit viewport math in the layout CSS, the canvas wrapper either overflows or compresses. The `min-width` on the canvas prevents the flex container from distributing remaining space to the panel.

**How to avoid:**
- Implement a three-column layout: `[canvas | fixed-width dashboard | fixed-width agent-panel]` where the canvas is `flex: 1; min-width: 0` and the panels have explicit `width: 280px` / `width: 240px`.
- The canvas should render at `Math.floor(availableWidth / (30 * 16)) * (30 * 16)` — compute the integer scale from available pixels, not a fixed 2×.
- Test layout at 1280px, 1440px, and 1920px widths before shipping.
- Keep existing `AgentPanel` in place; the new dashboard panel is an additional sibling, not a replacement.

**Warning signs:**
- Horizontal scrollbar appearing when dashboard panel is open.
- Canvas content clipped on the right edge.
- Pixel art appearing slightly blurry at certain viewport widths (non-integer CSS scaling).

**Phase to address:** Dashboard UI phase. Lock the layout grid before implementing panel content.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode `sx/sy` offset values for new asset sprites in `office-layout.ts` without a lookup table | Fast to ship | One wrong measurement requires hunting through 80+ furniture entries; no audit trail | Never — always document in a named SPRITES constant |
| Accumulate tokens by summing every JSONL line without deduplication | Simple implementation | Inflated costs shown to users; erodes trust in the monitoring tool | Never |
| Place `tokenCostUsd` directly on `AgentState` without a separate WSMessage type | Fewer files changed | Forces the Canvas engine to carry billing data it never uses; breaks type isolation | MVP only — refactor before v1.3 |
| Inline the dashboard as a second tab in the existing `AgentPanel` sidebar | Fast integration | Panel becomes a mixed-concern component; harder to hide/show independently | Acceptable for MVP if tab switching is clean |
| Use CSS `transform: scale()` on the canvas element for responsive sizing | Zero JS change | Sub-pixel rendering; blurry at non-integer scales | Never for pixel art |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| New asset PNG + `SpriteSheet` class | Pass wrong `frameWidth` derived from total image width | Use region-based `drawImage()` for non-uniform sheets; measure with image editor first |
| Token data from JSONL + existing `parser.ts` | Add token parsing inline to `parseJSONLLine()`, mixing state-event and metrics concerns | Create a separate `parseTokenUsage()` function that returns `TokenUsage | null` alongside the existing event parser |
| Dashboard state + existing `useAgentState` hook | Push cost data into the `agents` Map | Keep a separate `useTokenStats` hook fed by a new `token-update` WSMessage type |
| New asset pack (PixelOffice) + existing MetroCity tile size | Mix 16px and non-16px assets assuming same grid alignment | Confirm every new asset's natural pixel size before placing; PixelOffice furniture uses a compatible ~16px cell size, but some pieces span 2×2 or 3×2 tiles |
| Dashboard panel width + Canvas `useGameEngine` RAF loop | Add `width` to the `useGameEngine` dependency array triggering engine restart | Pass canvas dimensions via a `ref` so the RAF loop reads dimensions without React re-render dependency |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Token stats recalculated from full JSONL file on every WebSocket message | UI freezes for 100–300ms on active agents, stat panel lags behind canvas | Accumulate incrementally; only parse new lines appended since last read | Any session longer than 10 minutes (~1000+ lines) |
| Dashboard panel renders agent cost rows on every `agents` Map update | Jank when 3+ agents are active and tools fire rapidly (10+ WS messages/sec) | Memoize each agent row with `React.memo`; use `useMemo` on cost totals | 3+ simultaneous agents with active tool use |
| Loading all new PNG sheets on app start regardless of whether asset replacement is active | 400–800ms blank canvas on first load | Lazy-load new asset pack sheets only when furniture referencing them is in the active `officeLayout` | Immediately, since the new packs add ~200KB of additional PNGs |
| `ctx.imageSmoothingEnabled = false` set only once at canvas init | Blurry sprites after any canvas context state change (e.g., `save()`/`restore()` cycle) | Set before every `drawImage()` call or immediately after every `ctx.restore()` | First time a `ctx.save()` wraps a draw call |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Displaying raw cost numbers read from JSONL without bounds check | A corrupted JSONL line with `input_tokens: 999999999` shows absurd cost; erodes tool credibility | Cap display at reasonable maximum (e.g., $100 per session); log anomalies |
| Trusting `total_cost_usd` from a locally modified JSONL file | Not applicable — this is a local monitoring tool, not a billing system | N/A (local-only tool; no auth/payment surface) |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Dashboard panel open by default, taking 30% of screen width | Canvas shrinks; pixel art looks cramped; first impression is a busy, narrow viewport | Default panel to collapsed/minimized; let user opt in to expanded view |
| Showing running cost as `$0.0000` during active tool use before the turn ends | Confusing — looks like cost tracking is broken | Show token count (always available) and display cost only once `turn_end` fires with a complete `total_cost_usd` |
| Asset replacement done all-at-once (full swap of `office-layout.ts`) | If any sprite coordinate is wrong, the entire office renders garbage; no way to compare before/after | Add new furniture constants alongside old ones; replace zone-by-zone (server room first, then work zone, etc.); keep MetroCity fallbacks until new coordinates are verified |
| Dashboard panel overlaps canvas on small viewports (<1280px) | Dashboard covers part of the game view | Use a slide-over drawer pattern on narrow viewports; `position: fixed` with z-index overlay rather than pushing canvas |

---

## "Looks Done But Isn't" Checklist

- [ ] **Token deduplication:** Confirm token totals match actual Anthropic billing by running a known session through the tracker — verify numbers agree within 5%.
- [ ] **Canvas context reset:** Toggle the dashboard panel open/closed 5 times while agents are walking; confirm no blurring or position resets.
- [ ] **New asset pixel coordinates:** Visually inspect every new SPRITES constant by rendering it alone on a test canvas before incorporating into `office-layout.ts`.
- [ ] **Scale compatibility:** Place one PixelOffice asset, one Pixel Life asset, and one MetroCity asset adjacent on the tile map; confirm they appear at consistent visual scale.
- [ ] **WSMessage schema:** Confirm that adding a `token-update` message type does not break the existing client's `useAgentState` reducer (it should ignore unknown message types gracefully).
- [ ] **Dashboard panel at 1280px width:** Confirm canvas is not clipped, panel is not overflowing, and agent list remains scrollable.
- [ ] **imageSmoothingEnabled after save/restore:** Check all `ctx.save()` / `ctx.restore()` call sites in the engine; confirm `imageSmoothingEnabled = false` is re-applied after each `restore()`.
- [ ] **Cost on failed turn:** Verify that a session that errors mid-turn still displays a partial token count rather than zero or NaN.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Canvas blurs after panel layout change | LOW | Re-apply `imageSmoothingEnabled = false` in engine draw loop; fix canvas attribute sizing to be static |
| Token double-counting already shipped | MEDIUM | Add `seenIds` deduplication set to parser; add a migration note in changelog explaining corrected values |
| Wrong sprite coordinates for new assets break entire office | HIGH | Revert `office-layout.ts` to MetroCity-only via git; redo measurement pass on new assets before second attempt |
| `AgentState` type change breaks engine | MEDIUM | The engine spread-copies `AgentState` in several places; identify all call sites with `tsc --noEmit`, fix each one |
| New dashboard panel causes OfficeCanvas to remount | MEDIUM | Wrap OfficeCanvas in `React.memo`; ensure panel is a sibling at the same DOM level, not a parent |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Canvas resize invalidates context | Dashboard UI — layout design step | Toggle panel 5× while game loop runs; confirm no blurring |
| Token double-counting (parallel tool calls) | Token Tracking — data model design | Compare tracker output against Anthropic billing for a known session |
| New asset frame dimension mismatch | Asset Replacement — inventory/measurement pass | Render each new SPRITES constant in isolation before adding to layout |
| `AgentState` type contract broken | Token Tracking — WSMessage schema design | `tsc --noEmit` passes before any runtime testing |
| CSS layout conflict (canvas + two panels) | Dashboard UI — layout design step | Viewport test at 1280px, 1440px, 1920px |
| Performance: full JSONL re-parse on every message | Token Tracking — incremental accumulation design | Profile with 3 simultaneous active agents; confirm <16ms per WS message |
| imageSmoothingEnabled lost after canvas state changes | Asset Replacement — any new drawImage call site | Visual QA with new assets loaded; zoom in to check crisp pixel edges |

---

## Sources

- Official Claude Agent SDK cost tracking docs (HIGH confidence): https://platform.claude.com/docs/en/agent-sdk/cost-tracking — deduplication-by-ID requirement, `cache_creation_input_tokens` / `cache_read_input_tokens` fields
- Claude Code JSONL field structure: https://shipyard.build/blog/claude-code-track-usage/ — MEDIUM confidence, cross-referenced with parser.ts codebase
- React + Canvas coexistence patterns: https://medium.com/@lavrton/using-react-with-html5-canvas-871d07d8d753 — MEDIUM confidence
- Stale closure / useState in WebSocket handlers: https://github.com/facebook/react/issues/30454 — HIGH confidence (React core issue tracker)
- Direct codebase inspection: `src/engine/SpriteSheet.ts`, `src/shared/office-layout.ts`, `src/shared/asset-manifest.ts`, `src/client/components/AgentPanel.tsx`, `src/server/state-machine.ts`, `src/client/hooks/useWebSocket.ts` — HIGH confidence
- New asset pack visual inspection: `PixelOffice/PixelOfficeAssets.png` (256×160), `Pixel Life - Desk Essentials/spritesheet.png` (288×64), `office_assets_release/props.png` (small 8px-scale objects) — HIGH confidence (direct pixel measurement)

---
*Pitfalls research for: Pixel Office v1.2 — Dashboard UI, Token Tracking, Asset Replacement*
*Researched: 2026-03-30*
