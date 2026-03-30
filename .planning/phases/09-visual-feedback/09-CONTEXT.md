# Phase 9: Visual Feedback - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

캐릭터 위에 상태별 말풍선이 표시되고 턴 종료 시 사운드 알림이 재생된다. Phase 8에서 permissionPending 필드와 타이머 인프라가 구축되었으므로, 클라이언트 측 시각/청각 피드백 구현이 핵심 작업이다.

</domain>

<decisions>
## Implementation Decisions

### 말풍선 스타일
- **픽셀아트 스프라이트** 말풍선 — Pixel Agents 수준 (11x13px 스프라이트)
- Permission: 호박색 배경 + "..." 텍스트
- Waiting: 녹색 배경 + 체크마크 (2초 후 페이드아웃)
- 기존 Character.ts의 renderStatusBubble()을 교체/확장
- 말풍선 스프라이트는 프로그래매틱 생성 또는 Canvas 드로잉 (외부 에셋 불필요)

### 말풍선 동작
- Permission 버블: permissionPending=true 동안 상시 표시, 클릭 시 즉시 닫힘
- Waiting 버블: 턴 종료 시 표시, 2초 타이머 후 페이드아웃 (마지막 0.5초 투명도 감소)
- 클릭 dismiss: 기존 캐릭터 클릭 핸들러 확장 — 버블 영역 클릭 시 버블만 닫힘

### 사운드
- Web Audio API로 E5(659.25Hz) → E6(1318.51Hz) 2음 차임
- sine 파형, 볼륨 0.14, 각 노트 180ms
- Pixel Agents의 playDoneSound() 패턴 참조

### 사운드 토글 UI
- **화면 우상단 아이콘 버튼** — 스피커 아이콘, 클릭으로 on/off 토글
- 설정 localStorage에 유지
- 최소한 UI — 별도 설정 패널 불필요

### Claude's Discretion
- 말풍선 스프라이트의 정확한 픽셀 디자인
- 페이드아웃 easing 함수
- 버블 위치 오프셋 (캐릭터 머리 위)
- AudioContext 초기화 타이밍 (첫 사용자 제스처)
- 사운드 토글 아이콘 디자인 (유니코드 문자 또는 Canvas 드로잉)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 수정 대상 엔진 코드
- `src/engine/Character.ts` — renderStatusBubble() (lines 391-419): 기존 버블 로직 교체 대상
- `src/engine/Character.ts` — render() (line 274): 버블 렌더링 호출 지점
- `src/engine/index.ts` — onClick (lines 693-707): 클릭 핸들러 (버블 클릭 dismiss 추가)

### Phase 8에서 구축된 인프라
- `src/shared/types.ts` — AgentState.permissionPending: boolean (말풍선 트리거)
- `src/server/state-machine.ts` — permission 타이머 (7s), text-idle (5s), turn_end 처리

### 클라이언트 코드
- `src/client/hooks/useWebSocket.ts` — WebSocket 메시지 수신
- `src/client/hooks/useAgentState.ts` — AgentState 동기화 (permissionPending 포함)
- `src/client/components/AgentPanel.tsx` — 기존 UI 컴포넌트
- `src/client/App.tsx` — 앱 레이아웃 (사운드 토글 위치)

### 참조 구현 (Pixel Agents)
- `/tmp/pixel-agents/webview-ui/src/office/engine/renderer.ts` — 말풍선 렌더링 (lines 480-516)
- `/tmp/pixel-agents/webview-ui/src/notificationSound.ts` — Web Audio 차임 (E5→E6, 2음)
- `/tmp/pixel-agents/webview-ui/src/office/engine/officeState.ts` — 버블 타이머/페이드 (lines 650-685, 720-727)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Character.ts renderStatusBubble()`: 기본 버블 프레임워크 (위치 계산, 바운스 애니메이션, 아이콘 텍스트). 교체 대상이지만 위치 계산 로직 재사용 가능
- `Character.ts drawRoundedRect()`: 둥근 사각형 유틸 — 스프라이트 스타일이라도 배경으로 사용 가능
- `PixelOfficeEngine onClick()`: 캐릭터 hitTest 로직 — 버블 hitTest 추가 지점

### Established Patterns
- Canvas 렌더링: ctx.drawImage + 스케일링 패턴
- 캐릭터 위 오버레이: renderNameLabel() + renderStatusBubble() 순서로 렌더
- 클릭 처리: canvas addEventListener → screenToWorld 변환 → hitTest

### Integration Points
- AgentState.permissionPending (Phase 8) → Character.state.permissionPending → 말풍선 표시 트리거
- AgentState.status === 'waiting' → waiting 말풍선 (기존 연동)
- useWebSocket → AgentState 업데이트 → 엔진 character.updateState() → 렌더링 자동 반영

</code_context>

<specifics>
## Specific Ideas

- Pixel Agents의 notificationSound.ts 패턴 그대로 참조 — 2음 ascending chime, sine 파형
- 말풍선은 기존 renderStatusBubble()을 확장하되, 픽셀아트 느낌의 스프라이트 스타일로
- 사운드 토글은 React 컴포넌트로 — Canvas 외부에 배치 (HTML overlay)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-visual-feedback*
*Context gathered: 2026-03-30*
