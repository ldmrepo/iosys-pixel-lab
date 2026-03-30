# Phase 10: Sub-Agents - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Task/Agent 도구 실행 시 서브에이전트 캐릭터가 부모 근처에 스폰되고 작업 완료 시 Matrix 이펙트와 함께 디스폰된다. Phase 8에서 progress 레코드 파싱 기반 인프라가 구축되었으므로, 서버 측 서브에이전트 이벤트 발행 + 클라이언트 측 캐릭터 생성/삭제/이펙트가 핵심.

</domain>

<decisions>
## Implementation Decisions

### 서브에이전트 라이프사이클
- **부모당 무제한** — Task/Agent 도구가 스폰하는 만큼 생성
- **음수 ID** 캐릭터 (-1, -2, ...) — Pixel Agents 패턴
- 스폰 위치: 부모 캐릭터 근처 walkable 타일 (BFS 최근접)
- **부모 근처 배회**: 서브에이전트도 부모 좌석 근처에서 배회 (생동감)
- 작업 완료 시 자동 제거 (progress 레코드 또는 tool_result로 감지)

### 팔레트 상속
- 서브에이전트가 부모의 스프라이트 시트/팔레트를 상속
- 팀 소속을 시각적으로 표현 (같은 캐릭터 외형)

### Matrix 이펙트
- **컬럼별 stagger + 페이드 결합** — 두 가지 모두
- 스폰: 컬럼별 순차 reveal + alpha 0→1 (300ms 총 duration)
- 디스폰: 컬럼별 순차 숨김 + alpha 1→0 (300ms 총 duration)
- 컬럼별 랜덤 seed로 stagger 오프셋 (Pixel Agents 패턴)

### Claude's Discretion
- progress 레코드에서 서브에이전트 ID 추출 방식
- 서브에이전트 배회 반경 (부모 근처 몇 타일 이내)
- Matrix 이펙트의 정확한 easing/stagger 값
- 서브에이전트 라벨 표시 방식 (이름, 도구명 등)
- 서버→클라이언트 서브에이전트 이벤트 WSMessage 구조

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 서버 인프라 (Phase 8에서 구축)
- `src/server/parser.ts` — progress 레코드 파싱, background-tool/queue-operation 이벤트 타입
- `src/server/state-machine.ts` — AgentStateMachine: processEvent, per-agent 타이머, backgroundAgentIds

### 엔진 코드
- `src/engine/Character.ts` — Character 클래스, setBehavior, 렌더링, 말풍선 시스템
- `src/engine/CharacterBehavior.ts` — FSM, 배회, 좌석 복귀 (서브에이전트용 축소 버전 필요)
- `src/engine/index.ts` — PixelOfficeEngine: addAgent/removeAgent, cacheMovementTiles
- `src/engine/PathFinder.ts` — BFS 최근접 walkable 타일 검색용

### 공유 타입
- `src/shared/types.ts` — AgentState, AgentStatus, WSMessage

### 참조 구현 (Pixel Agents)
- `/tmp/pixel-agents/webview-ui/src/office/engine/officeState.ts` — addSubagent() (lines 435-487), removeSubagent() (lines 490-520), subagentIdMap/subagentMeta
- `/tmp/pixel-agents/webview-ui/src/office/engine/characters.ts` — Matrix stagger effect (lines 50-57), COLUMN_STAGGER_RANGE

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PixelOfficeEngine.addAgent()`: 이미 Character 생성 + setBehavior + 좌석 배정 로직 포함. 서브에이전트용 변형 가능
- `CharacterBehavior`: work/walk/idle FSM — 서브에이전트는 workSeat 대신 부모 근처 타일을 "home" 타일로 사용
- `PathFinder.findPath()`: 부모 근처 walkable 타일 검색에 활용
- `Character.render()`: 스프라이트 렌더링 — Matrix 이펙트는 globalAlpha 조작으로 구현 가능

### Established Patterns
- 음수 ID: 기존 코드에 없지만 characters Map<string, Character>이므로 "-1" 등 문자열 키 사용 가능
- 서브에이전트 WebSocket: 기존 agent-added/agent-removed 이벤트 재사용 가능 (AgentState에 parentId 필드 추가)
- 이펙트 렌더링: Character.render()에서 globalAlpha 조작 + 컬럼별 clip rect 조합

### Integration Points
- parser.ts → state-machine.ts: progress 레코드에서 서브에이전트 스폰/디스폰 이벤트 추출
- state-machine.ts → WebSocket: agent-added/agent-removed로 서브에이전트 브로드캐스트
- PixelOfficeEngine: addAgent/removeAgent에서 서브에이전트 특수 처리 (음수 ID, 팔레트 상속, 위치 계산)

</code_context>

<specifics>
## Specific Ideas

- Pixel Agents의 addSubagent()/removeSubagent() 패턴이 핵심 참조
- Matrix 이펙트: 컬럼별 stagger + alpha 결합으로 "디지털 물질화/비물질화" 느낌
- 서브에이전트 배회는 CharacterBehavior의 breakTiles를 부모 좌석 근처 타일로 제한

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-sub-agents*
*Context gathered: 2026-03-30*
