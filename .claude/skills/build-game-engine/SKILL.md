---
name: build-game-engine
description: >
  Builds the Pixel Office Canvas 2D game engine with sprite animation, tile map rendering,
  BFS pathfinding, and character state visualization. Pure Canvas 2D, no external game libraries.
  Triggers when game engine features need building or modification.
---

# Pixel Office Game Engine Builder

이 스킬은 Pixel Office의 2D 게임 엔진을 구축한다. 순수 Canvas 2D API만 사용한다.

## 의존성

반드시 먼저 읽어야 할 파일:
- `src/shared/types.ts` — 타입 계약
- `src/shared/asset-manifest.ts` — 에셋 정보 (있는 경우)
- `src/shared/office-layout.ts` — 오피스 레이아웃 (있는 경우)

에셋/레이아웃 파일이 아직 없으면 타입 정의만 기준으로 개발하고, 런타임에 동적 로딩.

## Step 1: 게임 루프 (`src/engine/GameLoop.ts`)

```typescript
export class GameLoop {
  private running = false;
  private lastTime = 0;
  private updateFn: (dt: number) => void;
  private renderFn: () => void;

  start(): void;   // RAF 시작
  stop(): void;    // RAF 중지
  pause(): void;   // 일시정지 토글
}
```

### 핵심 원칙
- `requestAnimationFrame` 사용
- deltaTime (초 단위) 전달로 프레임 독립적
- update와 render 분리
- 최대 deltaTime 캡 (0.1초) — 탭 전환 후 점프 방지

## Step 2: 스프라이트시트 (`src/engine/SpriteSheet.ts`)

```typescript
export class SpriteSheet {
  constructor(url: string, frameWidth: number, frameHeight: number);
  load(): Promise<void>;         // Image 로딩
  drawFrame(ctx, frameIndex, x, y, scale?): void;  // 특정 프레임 그리기
}
```

### 프레임 인덱싱
- 좌→우, 위→아래 순서
- `frameIndex = row * columns + col`
- columns = image.width / frameWidth

## Step 3: 캐릭터 (`src/engine/Character.ts`)

```typescript
export class Character {
  agentState: AgentState;
  private currentAnimation: SpriteAnimation;
  private frameTimer: number;
  private currentFrame: number;
  private targetPosition: { x: number; y: number } | null;
  private path: { x: number; y: number }[] | null;

  updateState(state: AgentState): void;  // 상태 업데이트
  update(dt: number): void;              // 프레임 업데이트
  render(ctx: CanvasRenderingContext2D): void;  // 그리기
}
```

### 상태별 시각 표현
- `idle`: 제자리 미세 움직임, 반투명 ZZZ 말풍선
- `typing`: 키보드 타이핑 모션, 책상 앞 고정
- `reading`: 고개 좌우 움직임 (파일 읽는 느낌)
- `executing`: 활발한 동작, 작은 기어 아이콘
- `waiting`: 물음표 말풍선 깜빡 (주의 필요!)
- `done`: 체크마크, 평화로운 자세
- `error`: 느낌표 말풍선, 붉은 깜빡임

### 이동 애니메이션
- 좌석 배정 변경 시 PathFinder로 경로 계산
- 경로를 따라 타일 단위 이동 (초당 3타일)
- 보간(lerp)으로 부드러운 이동

### 이름 라벨
- 캐릭터 위 8px에 이름 표시
- 폰트: 8px 픽셀 폰트 (또는 monospace)
- 배경: 반투명 검은색 박스

### 말풍선
- 캐릭터 위 20px에 표시
- `waiting` → "?" 말풍선 (노란색 테두리)
- `error` → "!" 말풍선 (빨간색 테두리)
- 부드러운 바운스 애니메이션

## Step 4: 타일맵 (`src/engine/TileMap.ts`)

```typescript
export class TileMap {
  constructor(layout: OfficeLayout, spriteSheet: SpriteSheet);
  render(ctx, camera): void;    // 뷰포트 영역만 렌더링
  isWalkable(tileX, tileY): boolean;
  getSeats(): Seat[];
  tileToWorld(tileX, tileY): { x: number; y: number };
  worldToTile(worldX, worldY): { tileX: number; tileY: number };
}
```

### 렌더링 최적화
- 카메라 뷰포트 범위의 타일만 렌더링
- 타일맵은 거의 변하지 않으므로 오프스크린 캔버스에 캐시 가능

## Step 5: 경로탐색 (`src/engine/PathFinder.ts`)

```typescript
export class PathFinder {
  constructor(isWalkable: (x: number, y: number) => boolean, width: number, height: number);
  findPath(startX, startY, endX, endY): { x: number; y: number }[];
}
```

### BFS 알고리즘
- 4방향 이동 (상하좌우)
- 큐 기반 BFS
- 경로 역추적
- 경로 없으면 빈 배열 반환

## Step 6: 카메라 (`src/engine/Camera.ts`)

```typescript
export class Camera {
  x: number; y: number;
  zoom: number;           // 1.0 = 기본, 2.0 = 2배 확대
  viewportWidth: number;
  viewportHeight: number;

  pan(dx: number, dy: number): void;
  setZoom(zoom: number): void;
  worldToScreen(wx, wy): { x: number; y: number };
  screenToWorld(sx, sy): { x: number; y: number };
  focusOn(worldX, worldY): void;  // 특정 위치로 부드러운 이동
}
```

### 제약
- 줌 범위: 0.5 ~ 3.0
- 패닝 범위: 맵 경계 ± 여유 100px

## Step 7: 엔진 Public API (`src/engine/index.ts`)

```typescript
export class PixelOfficeEngine {
  constructor(canvas: HTMLCanvasElement);

  start(): void;
  stop(): void;

  // 에이전트 관리
  updateAgent(state: AgentState): void;
  addAgent(state: AgentState): void;
  removeAgent(id: string): void;

  // 카메라
  focusOnAgent(id: string): void;

  // 이벤트
  onAgentClick(callback: (agentId: string) => void): void;

  // 리사이즈
  resize(width: number, height: number): void;
}
```

이것이 frontend-builder가 사용할 유일한 인터페이스.

## 품질 체크리스트

- [ ] 5개 캐릭터 동시 렌더링 60fps
- [ ] 상태 변경 시 애니메이션 즉시 전환
- [ ] 경로탐색으로 부드러운 캐릭터 이동
- [ ] 카메라 패닝/줌 동작
- [ ] 뷰포트 밖 타일 렌더링 스킵
- [ ] 모든 public API가 타입 안전
