# Pixel Office — PROJECT

## What This Is

AI 코딩 에이전트(Claude Code 등)의 실시간 활동 상태를 픽셀 아트 캐릭터로 시각화하는 독립형 웹 앱.
JSONL 로그 감시 → 상태 머신 → WebSocket → Canvas 2D 렌더링 파이프라인.
캐릭터가 자율적으로 이동하고, 도구별 애니메이션이 분기되며, 서브에이전트가 동적으로 스폰/디스폰된다.

## Core Value

AI 코딩 에이전트의 작업 상태를 한눈에 직관적으로 파악할 수 있는 시각적 모니터링.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express 5 + ws (WebSocket)
- **Rendering**: Canvas 2D (pure API, no external game libraries)
- **File Watch**: chokidar
- **Assets**: MetroCity CC0 pixel art
- **Audio**: Web Audio API (notification chime)

## Requirements

### Validated

- ✓ 30×24 오피스 그리드, 6개 존, 80+ 가구, 20+ 좌석 — v1.0
- ✓ MetroCity CC0 에셋 체계적 활용 (24개 시트) — v1.0
- ✓ 캐릭터 3상태 FSM (work/walk/idle) + BFS 경로탐색 — v1.1
- ✓ 4방향 walk 스프라이트 (11행 시트, 4프레임/방향) — v1.1
- ✓ 도구별 애니메이션 분기 (typing/reading/executing) — v1.1
- ✓ Pixel Agents 수준 배회 타이밍 (2~20s/3~6회/120~240s) — v1.1
- ✓ turn_duration 확정적 턴 종료 감지 — v1.1
- ✓ 7초 permission 타이머 + 5초 text-idle → waiting — v1.1
- ✓ 픽셀아트 말풍선 (permission/waiting) + 클릭 dismiss — v1.1
- ✓ E5→E6 Web Audio 차임 + 사운드 토글 (localStorage) — v1.1
- ✓ 서브에이전트 스폰/디스폰 + Matrix 이펙트 + 팔레트 상속 — v1.1

### Active

(None — planning next milestone)

### Out of Scope

- Tauri/Electron 래핑 — 웹앱으로 충분
- CASS 검색 엔진 — AgentRoom 전용
- 토큰/비용 추적 — 대시보드 UI와 함께 (v1.2+)
- VS Code 확장 — 독립 웹앱 유지
- OAuth/인증 — 로컬 전용 도구

## Context

v1.0에서 정적 오피스 공간을 구축하고, v1.1에서 Pixel Agents 수준의 동적 캐릭터 시각화를 달성.
현재 상태:
- 30×24 타일맵, 6개 존, 80+ 가구
- 3종 캐릭터 (claude/codex/gemini, 32×32, 11행 스프라이트시트)
- 서버: JSONL 파싱 + per-agent 타이머 (permission 7s, text-idle 5s, turn_end)
- 엔진: FSM + BFS + 말풍선 + 차임 + 서브에이전트 Matrix 이펙트

## Constraints

- **렌더링**: Canvas 2D only (외부 게임 라이브러리 금지)
- **UI**: React + CSS only (Material UI, Tailwind 등 금지)
- **에셋**: MetroCity CC0 (외부 생성 도구 없음)
- **관찰자 원칙**: Claude Code 프로세스에 직접 개입하지 않음 (JSONL 읽기만)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MetroCity CC0 에셋 사용 | 라이선스 무제한, 픽셀아트 품질 | ✓ Good |
| 순차 좌석 배정 + 즉시 해제 | 단순하고 예측 가능 | ✓ Good |
| permissionPending 별도 필드 | AgentStatus 유니온 변경 최소화 | ✓ Good |
| tool_use 블록으로 서브에이전트 감지 | progress보다 신뢰성 높음 (toolCallId 즉시 사용) | ✓ Good |
| Matrix 컬럼 stagger + 페이드 결합 | 스폰/디스폰 시각적 임팩트 극대화 | ✓ Good |
| Walk 스프라이트 4방향 | Pixel Agents 수준의 시각적 완성도 | ✓ Good |

## Milestones

### v1.1 — Dynamic Agents (shipped 2026-03-30)
### v1.0 — Office Space Rebuild (shipped 2026-03-30)

---
*Last updated: 2026-03-30 after v1.1 milestone*
