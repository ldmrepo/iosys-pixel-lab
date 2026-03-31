---
phase: 13
slug: asset-replacement
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual visual verification + grep-based validation |
| **Config file** | none — no test framework for visual assets |
| **Quick run command** | `npx tsc --noEmit && node -e "require('./src/shared/asset-manifest')"` |
| **Full suite command** | `npx tsc --noEmit` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (type-check)
- **After every plan wave:** Run full TypeScript check + visual browser verification
- **Before `/gsd:verify-work`:** Full suite must be green + visual verification
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | ASSET-01 | grep | `grep 'pixelOffice' src/shared/asset-manifest.ts` | ✅ | ⬜ pending |
| 13-01-02 | 01 | 1 | ASSET-01 | file | `test -f public/assets/pixeloffice/PixelOfficeAssets.png` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 2 | ASSET-02, ASSET-04 | grep | `grep 'CUBICLE' src/shared/office-layout.ts` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 2 | ASSET-04 | grep | `grep -c 'seats.push' src/shared/office-layout.ts` | ✅ | ⬜ pending |
| 13-02-03 | 02 | 2 | ASSET-05 | type | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `public/assets/pixeloffice/PixelOfficeAssets.png` — copy sprite sheet from PixelOffice/ source
- [ ] TypeScript type-check must pass before and after changes

*Existing infrastructure covers core type-checking. No new test framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sprite rendering correctness | ASSET-01, ASSET-02 | Visual pixel alignment requires browser inspection | Open `localhost:5173`, verify furniture sprites render without clipping or misalignment |
| FSM/BFS pathfinding | ASSET-05 | Requires live agent movement observation | Start dev server, connect JSONL source, verify agent walks to seat without collision |
| Walkable tile correctness | ASSET-05 | Requires visual map inspection | Verify characters walk through designated paths, not through furniture |
| Speech bubble + Matrix effect | ASSET-05 | Requires triggered state changes | Trigger permission/sub-agent events, verify overlays render correctly on new layout |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
