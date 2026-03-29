---
name: orchestrate-pixel-office
description: >
  Orchestrates the full Pixel Office build pipeline by dispatching parallel sub-agents,
  managing shared type contracts, and performing final integration verification.
  Triggers when user requests building, rebuilding, or modifying the Pixel Office app.
---

# Pixel Office Build Orchestrator

이 스킬은 Pixel Office 앱 빌드의 전체 파이프라인을 조율한다.

## 사전 조건 확인

```bash
# Node.js 확인
node --version  # 18+ 필요

# 프로젝트 디렉토리
cd /Users/ldm/work/iosys-pixel-lab
```

## Step 1: 프로젝트 스캐폴딩

기존 파일이 없으면 초기화:

```bash
npm init -y
npm install react react-dom
npm install -D typescript vite @vitejs/plugin-react @types/react @types/react-dom chokidar ws @types/ws express @types/express concurrently
```

필수 설정 파일 생성:
- `tsconfig.json` (strict mode, JSX preserve)
- `vite.config.ts` (React plugin, proxy /ws → backend)
- `package.json` scripts: `dev` = concurrently server + vite

## Step 2: 공유 타입 계약 생성

`src/shared/types.ts` — 모든 에이전트가 이 계약을 기준으로 개발:

```typescript
export type AgentStatus = 'idle' | 'typing' | 'reading' | 'executing' | 'waiting' | 'done' | 'error';

export interface AgentEvent {
  timestamp: number;
  sessionId: string;
  type: string;
  content: string;
  raw: unknown;
}

export interface AgentState {
  id: string;
  name: string;
  sessionId: string;
  status: AgentStatus;
  lastAction: string;
  lastUpdated: number;
  position: { x: number; y: number };
}

export interface WSMessage {
  type: 'agent-update' | 'agent-added' | 'agent-removed';
  payload: AgentState | AgentState[];
}

export interface TileInfo {
  type: 'floor' | 'wall' | 'desk' | 'chair' | 'decoration';
  walkable: boolean;
  spriteIndex: number;
}

export interface Seat {
  id: string;
  tileX: number;
  tileY: number;
  deskTileX: number;
  deskTileY: number;
  facing: 'down' | 'left' | 'right' | 'up';
  assignedAgentId?: string;
}

export interface OfficeLayout {
  width: number;
  height: number;
  tileSize: number;
  tiles: TileInfo[][];
  seats: Seat[];
}

export interface SpriteAnimation {
  frames: number[];
  fps: number;
  loop: boolean;
}

export interface CharacterSprite {
  sheetUrl: string;
  frameWidth: number;
  frameHeight: number;
  animations: Record<AgentStatus, SpriteAnimation>;
}

export interface AssetManifest {
  tileSheet: { url: string; tileSize: number; columns: number };
  characters: Record<string, CharacterSprite>;
}
```

## Step 3: Phase A — 병렬 에이전트 디스패치

Agent 도구를 사용하여 3개 에이전트를 **동시에** 디스패치:

1. **asset-preparer**: MetroCity 에셋 다운로드 + 스프라이트시트 + 타일맵 구성
2. **backend-builder**: Express + WebSocket + JSONL 감시 + 상태 머신
3. **game-engine-builder**: Canvas 2D 렌더링 엔진 전체

각 에이전트에게 전달할 프롬프트:
- 프로젝트 루트 경로
- `src/shared/types.ts` 내용 (타입 계약)
- 해당 에이전트의 `.claude/agents/{name}.md` 스펙 전체

## Step 4: Phase B — 프론트엔드 통합

Phase A 3개 에이전트 완료 후:

1. 각 에이전트 산출물 확인 (파일 존재 여부)
2. **frontend-builder** 에이전트 디스패치
   - Phase A 산출물 경로 전달
   - engine의 public API 요약 전달

## Step 5: Phase C — 검증

1. TypeScript 컴파일: `npx tsc --noEmit`
2. 개발 서버 시작: `npm run dev`
3. 파일 구조 확인: 모든 예상 파일 존재 여부
4. 서버 헬스 체크: `curl http://localhost:3333/api/agents`

## 에러 복구

| 에러 상황 | 대응 |
|-----------|------|
| 에이전트가 타입 계약 위반 | 해당 에이전트 재디스패치 (타입 명시 강조) |
| 에셋 다운로드 실패 | 플레이스홀더 모드로 전환 |
| 컴파일 에러 | 에러 메시지 분석 후 해당 모듈 에이전트 재디스패치 |
| 포트 충돌 | 대체 포트 (3334) 사용 |
