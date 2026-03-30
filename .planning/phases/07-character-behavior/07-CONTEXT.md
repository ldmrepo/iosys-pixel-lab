# Phase 7: Character Behavior - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

캐릭터가 에이전트 활성 상태에 따라 좌석으로 걸어가거나 사무실을 배회하며, 도구별 애니메이션이 분기된다. Phase 6에서 FSM/BFS/방향별 walk가 완성되었으므로, 배회 타이밍을 Pixel Agents 수준으로 튜닝하고 서버→클라이언트 전체 체인의 E2E 검증이 핵심 작업이다.

</domain>

<decisions>
## Implementation Decisions

### 배회 타이밍 튜닝
- **Pixel Agents 수준으로 조정**:
  - wanderPause: 3~12초 → **2~20초** (더 자연스러운 리듬)
  - wanderLimit: 2~5회 → **3~6회** (더 긴 배회 사이클)
  - seatRestDuration: 15~40초 → **120~240초** (더 오래 좌석에서 휴식)
  - seatLeaveDelay: 2~5초 유지 (빠른 반응 유지)

### 도구별 애니메이션 매핑
- **현재 매핑 유지** — Pixel Agents와 동일:
  - Write/Edit → typing (타이핑 애니메이션)
  - Read/Glob/Grep → reading (읽기 애니메이션)
  - Bash/Agent → executing (실행 애니메이션)
  - assistant_text → typing
  - unknown tools → executing
- 추가 매핑 변경 불필요

### E2E 연동 검증
- **타이밍 튜닝 + 검증** 범위
- 서버 상태변경 → WebSocket → updateAgent() → Character.updateState() → behavior.onStatusChange() → FSM 전환 → 애니메이션 전체 체인
- 실제 JSONL 이벤트로 도구별 상태 전환 확인
- 배회 사이클이 새 타이밍 값으로 자연스럽게 동작하는지 확인

### Claude's Discretion
- CharacterBehavior.ts의 정확한 타이밍 값 미세 조정 (Pixel Agents 범위 내)
- 에이전트 비활성→활성 전환 시 배회 중단 타이밍
- breakTiles 선택 알고리즘 (현재 랜덤 — 충분하면 유지)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 엔진 코드 (Phase 6에서 수정됨)
- `src/engine/CharacterBehavior.ts` — 3상태 FSM, 배회 타이밍 상수 (수정 대상)
- `src/engine/Character.ts` — getEffectiveStatus(), 방향별 walk 상태, path following
- `src/engine/index.ts` — PixelOfficeEngine: addAgent→setBehavior, requestPath callback

### 서버 상태 매핑
- `src/server/state-machine.ts` — deriveStatus() 도구→상태 매핑 (lines 145-188)
- `src/server/parser.ts` — JSONL 파싱 로직

### 참조 구현
- `/tmp/pixel-agents/webview-ui/src/office/engine/characters.ts` — Pixel Agents 배회 타이밍 상수 (WANDER_PAUSE_MIN/MAX, WANDER_MOVES_BEFORE_REST, SEAT_REST_MIN/MAX)

### 타입 & 레이아웃
- `src/shared/types.ts` — AgentStatus (walk_* 포함), AgentState, Seat
- `src/shared/office-layout.ts` — 좌석 배치, 존 정보

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CharacterBehavior.ts`: FSM 전체 구현 완료 — 타이밍 상수만 변경하면 됨
- `deriveStatus()`: 도구→상태 매핑 이미 정확 — 변경 불필요
- Phase 6 walk 시스템: 4방향 walk_*, direction 추적, 애니메이션 리셋 모두 검증됨

### Established Patterns (Phase 6에서 확립)
- workSeat = layout.seats.find(s => !s.assignedAgentId) — 순차 배정
- removeAgent() → seat.assignedAgentId = undefined — 즉시 해제
- setPath() → animTime=0, currentFrameIndex=0 — 깨끗한 애니메이션 시작
- getEffectiveStatus() → behavior.isWalking이면 walk_* 반환, shouldPlayWorkAnim이면 실제 상태 반환

### Integration Points
- 서버→클라이언트 체인: AgentStateMachine.deriveStatus() → WSMessage → useWebSocket → updateAgent() → Character.updateState() → behavior.onStatusChange()
- behavior.onStatusChange(): ACTIVE_STATUSES에 typing/reading/executing 포함 — 서버가 이 상태를 보내면 goToWork() 트리거

</code_context>

<specifics>
## Specific Ideas

- Pixel Agents의 배회 리듬 참고: 더 긴 휴식(120~240초)이 자연스러운 사무실 분위기를 만듦
- 현재 코드의 핵심 gap은 타이밍 값뿐 — FSM 로직 자체는 Phase 6 E2E에서 검증됨

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-character-behavior*
*Context gathered: 2026-03-30*
