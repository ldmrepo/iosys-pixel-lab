# 에이전트 디스패치 가이드

## 병렬 디스패치 패턴

Phase A에서 3개 에이전트를 동시에 디스패치한다. Agent 도구를 단일 메시지에서 3번 호출.

### asset-preparer 디스패치 프롬프트 템플릿

```
당신은 Pixel Office 프로젝트의 에셋 준비 담당입니다.

프로젝트 루트: /Users/ldm/work/iosys-pixel-lab

## 임무
1. public/assets/ 디렉토리에 프로그래매틱 픽셀 아트 에셋 생성
2. src/shared/asset-manifest.ts 생성
3. src/shared/office-layout.ts 생성

## 타입 계약
[src/shared/types.ts 내용 전체 붙여넣기]

## 상세 스펙
[.claude/skills/prepare-assets/SKILL.md 내용 참조]

## 제약
- src/shared/types.ts 수정 금지
- src/server/, src/engine/, src/client/ 수정 금지
- public/assets/ 하위에만 파일 생성
```

### backend-builder 디스패치 프롬프트 템플릿

```
당신은 Pixel Office 프로젝트의 백엔드 서버 구축 담당입니다.

프로젝트 루트: /Users/ldm/work/iosys-pixel-lab

## 임무
1. src/server/ 에 Express + WebSocket + JSONL 감시 서버 구축
2. Claude Code 세션 자동 탐지 + 상태 머신 구현

## 타입 계약
[src/shared/types.ts 내용 전체 붙여넣기]

## 상세 스펙
[.claude/skills/build-backend/SKILL.md 내용 참조]
[.claude/skills/build-backend/references/claude-jsonl-format.md 참조]

## 제약
- src/shared/types.ts 수정 금지
- src/engine/, src/client/, public/assets/ 수정 금지
```

### game-engine-builder 디스패치 프롬프트 템플릿

```
당신은 Pixel Office 프로젝트의 Canvas 2D 게임 엔진 구축 담당입니다.

프로젝트 루트: /Users/ldm/work/iosys-pixel-lab

## 임무
1. src/engine/ 에 Canvas 2D 기반 게임 엔진 구축
2. 스프라이트 애니메이션, 타일맵, BFS 경로탐색, 카메라 구현

## 타입 계약
[src/shared/types.ts 내용 전체 붙여넣기]

## 상세 스펙
[.claude/skills/build-game-engine/SKILL.md 내용 참조]
[.claude/skills/build-game-engine/references/sprite-animation-guide.md 참조]

## 제약
- src/shared/types.ts 수정 금지
- src/server/, src/client/, public/assets/ 수정 금지
- 외부 게임 라이브러리 사용 금지 (순수 Canvas 2D)
```

### frontend-builder 디스패치 프롬프트 템플릿 (Phase B)

```
당신은 Pixel Office 프로젝트의 React 프론트엔드 구축 담당입니다.

프로젝트 루트: /Users/ldm/work/iosys-pixel-lab

## 임무
1. src/client/ 에 React 앱 구축
2. 게임 엔진 마운트 + WebSocket 연동 + 대시보드 UI

## 사전에 생성된 파일 (반드시 먼저 읽을 것)
- src/shared/types.ts
- src/engine/index.ts (게임 엔진 public API)
- src/shared/asset-manifest.ts
- src/shared/office-layout.ts

## 타입 계약
[src/shared/types.ts 내용 전체 붙여넣기]

## 상세 스펙
[.claude/skills/build-frontend/SKILL.md 내용 참조]
[.claude/skills/build-frontend/references/ui-design-spec.md 참조]

## 제약
- src/shared/types.ts 수정 금지
- src/server/, src/engine/ 내부 수정 금지
- 외부 UI 프레임워크 사용 금지
```

## 에러 복구 전략

### 타입 에러
1. `tsc --noEmit` 실행
2. 에러 메시지에서 해당 모듈 식별
3. 해당 에이전트 재디스패치 (에러 메시지 + 수정 지시 포함)

### import 경로 에러
- 상대 경로 사용: `../../shared/types`
- 에이전트에게 정확한 디렉토리 구조 안내

### 에셋 누락
- asset-preparer가 플레이스홀더 생성했는지 확인
- 없으면 asset-preparer 재디스패치

### WebSocket 연결 실패
- 서버 포트 확인 (3333)
- 프론트엔드 vite proxy 설정 확인
