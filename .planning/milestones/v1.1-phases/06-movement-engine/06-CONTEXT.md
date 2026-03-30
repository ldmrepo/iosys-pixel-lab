# Phase 6: Movement Engine - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

캐릭터가 오피스를 자율적으로 이동할 수 있는 FSM과 BFS 경로탐색 엔진을 갖춘다. 기존 코드(CharacterBehavior.ts, PathFinder.ts, Character.ts)가 대부분 구현되어 있으므로, E2E 검증 + gap 수정 + 새 walk 스프라이트 통합이 핵심 작업이다.

</domain>

<decisions>
## Implementation Decisions

### 걷기 애니메이션
- 새 walk 스프라이트 제작 필요 (기존 idle 프레임 재사용 안 함)
- **4방향 (상하좌우)** 별도 walk 애니메이션 — Pixel Agents 수준
- 4프레임 walk 애니메이션 per direction
- 스프라이트 시트 레이아웃 확장 필요 (현재 7행 → walk 행 추가 또는 별도 시트)
- 좌우 반전(horizontal flip)으로 프레임 절약 가능 여부는 Claude 재량

### 좌석 배정 전략
- **순차 배정** — 현재 방식 유지. 새 에이전트가 등장하면 다음 빈 좌석 자동 배정
- 에이전트 제거 시 **즉시 해제** — 좌석 예약 유지 없음
- 고정 매핑(이름→좌석)이나 존별 우선배정 불필요

### E2E 연동 검증
- 기존 FSM/BFS/좌석 코드의 **동작 검증 + gap 수정** 범위
- CharacterBehavior FSM 전환 실제 테스트 (work→walk→idle 사이클)
- PathFinder가 cacheMovementTiles() 결과와 정합성 확인
- 새 walk 스프라이트를 애니메이션 시스템에 통합
- 전체 재작성 아님 — 기존 코드 위에 gap만 수정

### Claude's Discretion
- 스프라이트 시트 레이아웃 확장 방식 (행 추가 vs 별도 시트 vs 별도 direction 시트)
- 좌우 반전 구현 방식 (Canvas transform vs 별도 프레임)
- 이동 속도 미세 조정 (현재 3 tiles/sec)
- BFS 최적화 (현재 구현 충분하면 유지)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 기존 엔진 코드
- `src/engine/CharacterBehavior.ts` — 3상태 FSM (work/walk/idle), 배회/좌석복귀 로직
- `src/engine/Character.ts` — 스프라이트 애니메이션, path following, behavior FSM 연동
- `src/engine/PathFinder.ts` — BFS 4방향 경로탐색, 비walkable 목적지 허용
- `src/engine/index.ts` — PixelOfficeEngine: addAgent→setBehavior, cacheMovementTiles, requestPath 콜백
- `src/engine/GameLoop.ts` — RAF 게임 루프, dt capping

### 참조 구현 (Pixel Agents)
- `/tmp/pixel-agents/webview-ui/src/office/engine/characters.ts` — 캐릭터 FSM (TYPE/WALK/IDLE), 4방향 스프라이트 선택 로직
- `/tmp/pixel-agents/webview-ui/src/office/sprites/spriteData.ts` — 방향별 스프라이트 로딩, hue shift, 좌우 반전
- `/tmp/pixel-agents/webview-ui/src/office/layout/tileMap.ts` — BFS + withOwnSeatUnblocked 패턴

### 타입 정의
- `src/shared/types.ts` — AgentStatus, AgentState, Seat, SpriteAnimation, CharacterSprite

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CharacterBehavior.ts`: 완전한 3상태 FSM — work/walk/idle 전환, 배회 타이머, 좌석 복귀, break 타일 이동. 그대로 사용 가능
- `PathFinder.ts`: BFS 4방향 경로탐색 완성. 비walkable 목적지 허용(line 96-98). MOVE-07 충족
- `Character.ts`: path following (setPath/updateMovement), behavior FSM 연동 (setBehavior/getEffectiveStatus), 스프라이트 애니메이션 시스템

### Established Patterns
- `getEffectiveStatus()`: behavior FSM 상태에 따라 애니메이션 상태 결정. walk 시 현재 'idle' 반환 → walk 전용 상태 반환으로 수정 필요
- `DEFAULT_ANIMATIONS`: 7개 상태별 프레임 인덱스 매핑. walk 상태 추가 필요
- `SpriteSheet`: 단일 방향 시트. 방향별 지원하려면 확장 필요
- `cacheMovementTiles()`: walkGrid 계산 → walkableTiles/breakTiles 캐시. PathFinder와 연동됨

### Integration Points
- `PixelOfficeEngine.addAgent()` line 248-265: setBehavior 호출, requestPath 콜백으로 PathFinder 연결
- `PixelOfficeEngine.update()` line 568: character.update(dt) 호출 → behavior FSM + 애니메이션 + 이동 모두 갱신
- `AgentStateMachine (server)`: 에이전트 상태 변경 → WebSocket → updateAgent() → Character.updateState() → behavior.onStatusChange()

</code_context>

<specifics>
## Specific Ideas

- Pixel Agents의 4방향 walk 애니메이션 수준을 목표 — 방향에 따라 다른 프레임 재생
- 좌우 반전으로 프레임 수 절약하는 Pixel Agents 패턴 참고 (LEFT = flipHorizontal(RIGHT))
- 기존 코드 최대한 활용하되, walk 스프라이트 통합과 방향 시스템이 핵심 gap

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-movement-engine*
*Context gathered: 2026-03-30*
