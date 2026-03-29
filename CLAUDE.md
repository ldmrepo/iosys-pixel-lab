# Pixel Office — AI Agent Visualization Tool

AI 코딩 에이전트(Claude Code)를 픽셀 아트 캐릭터로 시각화하는 독립형 웹 앱.

## 프로젝트 구조

```
pixel-office/
├── public/assets/          ← 스프라이트시트, 타일셋 (asset-preparer 담당)
├── src/
│   ├── shared/             ← 공유 타입, 에셋 매니페스트, 오피스 레이아웃
│   ├── server/             ← Express + WebSocket + JSONL 감시 (backend-builder 담당)
│   ├── engine/             ← Canvas 2D 게임 엔진 (game-engine-builder 담당)
│   └── client/             ← React 프론트엔드 (frontend-builder 담당)
├── scripts/                ← 에셋 생성 스크립트
└── docs/                   ← 리서치 문서
```

## 기술 스택

- **프론트엔드**: React 18 + TypeScript + Vite
- **백엔드**: Node.js + Express + ws (WebSocket)
- **렌더링**: Canvas 2D (순수 API, 외부 게임 라이브러리 금지)
- **파일 감시**: chokidar
- **에셋**: 프로그래매틱 생성 (MetroCity CC0 에셋 호환)

## 에이전트 팀

| 에이전트 | 담당 영역 | 수정 가능 디렉토리 |
|----------|-----------|-------------------|
| orchestrator | 전체 조율 | src/shared/ |
| asset-preparer | 에셋 | public/assets/, src/shared/asset-manifest.ts, src/shared/office-layout.ts |
| backend-builder | 서버 | src/server/ |
| game-engine-builder | 게임 엔진 | src/engine/ |
| frontend-builder | UI | src/client/, index.html |

## 핵심 규칙

1. **타입 계약 불변**: `src/shared/types.ts`는 오케스트레이터만 수정 가능
2. **디렉토리 경계 엄수**: 각 에이전트는 자기 담당 디렉토리만 수정
3. **순수 Canvas 2D**: 외부 게임 라이브러리 (Phaser, PixiJS 등) 사용 금지
4. **UI 라이브러리 최소화**: React + CSS만 사용 (Material UI, Tailwind 등 금지)
5. **순수 관찰자**: Claude Code 프로세스에 직접 개입하지 않음 (JSONL 읽기만)

## 개발 서버

```bash
npm run dev        # Vite + Express 동시 실행
npm run dev:server # 백엔드만
npm run dev:client # 프론트엔드만
```

## 포트

- 프론트엔드 (Vite): 5173
- 백엔드 (Express + WebSocket): 3333
