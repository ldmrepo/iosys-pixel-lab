---
name: build-frontend
description: >
  Builds the Pixel Office React frontend that integrates the game engine, WebSocket client,
  and dashboard UI. Creates the complete user-facing application with agent monitoring panel.
  Triggers when UI features, layout changes, or frontend integration is needed.
---

# Pixel Office Frontend Builder

이 스킬은 Pixel Office의 React 프론트엔드를 구축한다.

## 사전 조건

반드시 먼저 확인할 파일:
- `src/shared/types.ts` — 공유 타입
- `src/engine/index.ts` — 게임 엔진 public API
- `src/shared/asset-manifest.ts` — 에셋 매니페스트
- `src/shared/office-layout.ts` — 오피스 레이아웃

이 파일들이 존재해야 프론트엔드를 제대로 구축할 수 있다.

## Step 1: HTML 템플릿 + React 진입점

`index.html`:
- `<div id="root">` 마운트 포인트
- viewport meta, favicon
- 다크 테마 기본 (body background: #1a1a2e)

`src/client/main.tsx`:
- React 18 createRoot
- `<App />` 렌더

## Step 2: WebSocket Hook (`src/client/hooks/useWebSocket.ts`)

```typescript
export function useWebSocket(url: string) {
  // 반환값
  return {
    isConnected: boolean;
    messages: WSMessage[];
    connectionState: 'connected' | 'disconnected' | 'reconnecting';
  };
}
```

### 기능
- 자동 연결 + 자동 재연결 (3초 간격)
- 재연결 시도 최대 10회 → 이후 수동 재연결 버튼
- JSON 파싱 실패 시 무시
- 컴포넌트 언마운트 시 cleanup

## Step 3: 에이전트 상태 Hook (`src/client/hooks/useAgentState.ts`)

```typescript
export function useAgentState(messages: WSMessage[]) {
  return {
    agents: Map<string, AgentState>;
    agentList: AgentState[];  // 정렬된 배열
  };
}
```

### 메시지 처리
- `agent-update` (배열) → 전체 교체
- `agent-update` (단일) → 해당 에이전트만 업데이트
- `agent-added` → 맵에 추가
- `agent-removed` → 맵에서 제거

## Step 4: 게임 엔진 Hook (`src/client/hooks/useGameEngine.ts`)

```typescript
export function useGameEngine(
  canvasRef: RefObject<HTMLCanvasElement>,
  agents: Map<string, AgentState>
) {
  return {
    engine: PixelOfficeEngine | null;
    focusOnAgent: (id: string) => void;
  };
}
```

### 생명주기
1. canvasRef 유효 시 엔진 생성 + 시작
2. agents 변경 시 엔진에 반영 (add/update/remove)
3. 언마운트 시 엔진 정지

## Step 5: 컴포넌트 구현

### `App.tsx` — 메인 레이아웃

```
┌──────────────────────────────────────────┐
│  🏢 Pixel Office                  [설정]  │  ← Header (48px)
├─────────────────────────┬────────────────┤
│                         │                │
│                         │  AgentPanel    │
│    OfficeCanvas         │  (280px 고정)   │
│    (나머지 공간)         │                │
│                         │                │
├─────────────────────────┴────────────────┤
│  ● Connected  │  Agents: 3  │  FPS: 60   │  ← StatusBar (32px)
└──────────────────────────────────────────┘
```

CSS: flexbox 기반, 다크 테마

### `OfficeCanvas.tsx`

- Canvas 엘리먼트 + useGameEngine 연동
- 부모 컨테이너 크기에 반응형 (ResizeObserver)
- 마우스 이벤트 → 카메라 패닝/줌
- 캐릭터 클릭 이벤트 → AgentPanel 연동

### `AgentPanel.tsx`

에이전트 카드 목록:

```
┌─────────────────────┐
│ 🟢 Claude-pixel-1   │
│ Status: typing       │
│ Writing to App.tsx   │
│ 2초 전               │
├─────────────────────┤
│ 🟡 Claude-api-2     │
│ Status: waiting      │
│ Awaiting user input  │
│ 45초 전              │
├─────────────────────┤
│ ⚪ Claude-test-3    │
│ Status: idle         │
│ No recent activity   │
│ 3분 전               │
└─────────────────────┘
```

상태별 색상 인디케이터:
- `typing` → 녹색 (🟢)
- `reading` → 파랑 (🔵)
- `executing` → 보라 (🟣)
- `waiting` → 주황 (🟡) + 깜빡임
- `idle` → 회색 (⚪)
- `done` → 하늘색 (✅)
- `error` → 빨강 (🔴) + 깜빡임

카드 클릭 → 해당 캐릭터로 카메라 포커스

### `StatusBar.tsx`

하단 상태 바:
- 연결 상태 인디케이터 (●/○ + 텍스트)
- 활성 에이전트 수
- 현재 시간

### `Tooltip.tsx`

캐릭터 호버/클릭 시 팝업:
- 에이전트 이름
- 현재 상태 + 마지막 행동
- 세션 ID
- 활동 시작 시간

## Step 6: 스타일링 (`src/client/styles/`)

다크 테마 기본:
- 배경: `#1a1a2e` (다크 네이비)
- 패널: `#16213e` (약간 밝은 네이비)
- 텍스트: `#e0e0e0`
- 액센트: `#8B5CF6` (보라)
- 성공: `#22C55E`, 경고: `#F97316`, 에러: `#EF4444`

폰트: `'Courier New', monospace` (픽셀 아트 느낌)

## 품질 체크리스트

- [ ] WebSocket 끊김 → 3초 내 자동 재연결
- [ ] 에이전트 상태 변경이 패널 + 캐릭터에 동시 반영
- [ ] Canvas 반응형 리사이즈
- [ ] 카드 클릭 → 카메라 포커스 동작
- [ ] 다크 테마 일관성
- [ ] 최소 너비 800px에서 레이아웃 정상
- [ ] 타입 에러 없음 (`tsc --noEmit` 통과)
