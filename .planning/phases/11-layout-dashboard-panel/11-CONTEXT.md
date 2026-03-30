# Phase 11: Layout & Dashboard Panel - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Canvas와 사이드 패널이 안정적으로 공존하는 3열 레이아웃을 구축하고, 에이전트별 상태/도구/계층/세션 정보를 패널에 표시한다. Canvas resize 시 context state 리셋 방지가 핵심 기술 과제.

</domain>

<decisions>
## Implementation Decisions

### 레이아웃 구조
- **우측 패널** — 현재 구조 유지 확장. Canvas 좌측 + Dashboard 패널 우측
- **토글 버튼** — 패널 접기/펼기 지원. Canvas를 전체 화면으로 활용 가능
- Canvas resize 시 `imageSmoothingEnabled = false` 매 프레임 재적용 (pitfall 방지)
- CSS: `flex: 1; min-width: 0` 패턴으로 Canvas가 남은 공간 차지

### 패널 콘텐츠
- **에이전트 카드**: 상태 아이콘 + 현재 도구명 + 세션 경과시간
- **서브에이전트**: 부모 카드 아래 들여쓰기 표시 (parentId 기반)
- 토큰/비용은 Phase 12에서 채울 자리만 확보 (이번 Phase에서는 미표시)

### Claude's Discretion
- 패널 너비 (고정 px vs 반응형 %)
- 토글 버튼 아이콘/위치
- 에이전트 카드 내부 레이아웃 (가로 vs 세로 배치)
- 세션 시간 포맷 (mm:ss vs hh:mm:ss)
- 도구명 표시 방식 (아이콘 + 텍스트 vs 텍스트만)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 수정 대상 클라이언트 코드
- `src/client/App.tsx` — 현재 레이아웃 (header + main + statusbar), AgentPanel 배치
- `src/client/components/AgentPanel.tsx` — 기존 에이전트 패널 (상태 컬러/라벨만)
- `src/client/components/OfficeCanvas.tsx` — Canvas 래핑 컴포넌트
- `src/client/styles/index.css` — 전체 CSS
- `src/client/hooks/useAgentState.ts` — agents Map 동기화

### 엔진 코드 (Canvas resize 관련)
- `src/engine/index.ts` — PixelOfficeEngine.resize(): dpr 처리, ctx.setTransform
- `src/engine/index.ts` — render(): imageSmoothingEnabled 설정

### 참조: AgentState 구조
- `src/shared/types.ts` — AgentState (status, name, lastAction, position, parentId, permissionPending)

### 리서치
- `.planning/research/PITFALLS.md` — Canvas resize context reset 위험
- `.planning/research/ARCHITECTURE.md` — Dashboard UI 통합 아키텍처

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AgentPanel.tsx`: 이미 에이전트 목록 + 상태 컬러/라벨 + 클릭 핸들러 구현. 확장하여 도구명/세션시간 추가
- `App.tsx`: header(SoundToggle) + main(canvas-wrapper + AgentPanel) + StatusBar 구조. 패널 토글 추가 지점
- `useAgentState.ts`: agents Map — parentId 기반 서브에이전트 필터링 가능
- `AgentState.lastAction`: 현재 도구명/설명 이미 포함 (서버에서 전송)

### Established Patterns
- React + CSS only (Material UI/Tailwind 금지)
- className 기반 스타일링 (index.css)
- useCallback/useRef 패턴 (App.tsx)
- localStorage 설정 유지 (soundMuted 패턴 → 패널 접기 상태도 동일)

### Integration Points
- App.tsx:117 — `<AgentPanel agents={agentList} onAgentClick={...}/>` 현재 위치
- App.tsx:102-116 — canvas-wrapper div (resize 이벤트 소스)
- OfficeCanvas.tsx — engine.resize() 호출 지점

</code_context>

<specifics>
## Specific Ideas

- AgentRoom의 사이드 패널 참조 — 에이전트별 카드에 상태 dot + 도구명 + 시간 표시
- 패널 접기 시 localStorage에 상태 저장 (soundMuted 패턴 재사용)
- 서브에이전트는 부모 카드 내부가 아닌 아래에 들여쓰기 — flat list가 더 간결

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-layout-dashboard-panel*
*Context gathered: 2026-03-30*
