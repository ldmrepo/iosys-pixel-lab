---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Dashboard & Polish
status: roadmap_ready
stopped_at: Roadmap created — awaiting phase planning
last_updated: "2026-03-30T22:00:00.000Z"
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# STATE — v1.2 Dashboard & Polish

## Current Phase

**Not started** — Roadmap created, ready for `/gsd:plan-phase 11`

## Phase Status

| Phase | Name | Plans | Status |
|-------|------|-------|--------|
| 11 | Layout & Dashboard Panel | TBD | Not started |
| 12 | Token & Cost Tracking | TBD | Not started |
| 13 | Asset Replacement | TBD | Not started |

## Progress Bar

```
v1.2: [░░░░░░░░░░░░░░░░░░░░] 0/3 phases
```

## Decisions

- v1.2 범위: 대시보드 UI + 토큰 추적 + 에셋 교체
- v1.0/v1.1 엔진/서버 인프라 위에 UX 레이어 강화
- Phase 11 first: CSS 레이아웃 위험요소(Canvas context reset, 멀티패널 충돌)를 콘텐츠 작업 전에 해결
- Phase 12: Token pipeline은 독립 구현 — pricing.ts 신규 모듈, turn_duration 전용 파싱
- Phase 13: 에셋 교체는 독립적 — Phase 11 레이아웃 안정화 후 Phase 12와 병렬 진행 가능
- token 데이터 소스: JSONL system/turn_duration 엔트리 (assistant 스트리밍 엔트리 불사용 — 100-174x 과소산정)
- costUSD JSONL 필드 사용 금지 — v1.0.9 이후 삭제됨, 서버 측에서 pricing.ts로 직접 계산

## Critical Pitfalls to Avoid

- Canvas context reset: canvas.width/height 속성 직접 수정 시 imageSmoothingEnabled 초기화됨
  → 매 drawFrame() 호출 상단에 imageSmoothingEnabled = false 재적용, canvas wrapper에 flex: 1; min-width: 0 사용
- Token 이중 카운팅: 병렬 도구 호출 시 동일 message.id가 여러 엔트리에 등장
  → per-session Set<string>으로 message.id 중복제거, turn_end마다 리셋
- 에셋 frame dimension 불일치: 비균일 시트에 잘못된 frameWidth 전달 시 오류 렌더
  → 모든 신규 에셋은 ObjectSpriteRef(sx/sy/sw/sh) region 방식 사용, 인라인 매직넘버 금지

## Accumulated Context (from v1.0 + v1.1)

- 맵 크기: 30×24 (480×384px), 6존, 80+ 가구, 20+ 좌석
- 캐릭터: 3종 (claude/codex/gemini), 11행 스프라이트시트, 4방향 walk
- 서버: JSONL 파싱, per-agent 타이머, turn_duration, permission(7s), text-idle(5s), background agent
- 엔진: 3상태 FSM, BFS, 픽셀아트 말풍선, Web Audio 차임, 서브에이전트 Matrix 이펙트
- 새 에셋팩 준비됨: PixelOffice (큐비클/소파/자판기, 16px 그리드), Pixel Life (책상/화이트보드), office_assets_release (소형 소품 50×50)
- AgentState에 tokenUsage? 옵셔널 필드 추가 예정 (types.ts orchestrator 수정)
- TokenUsage 인터페이스 신규 정의: inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens, costUSD

## Research Flags

- Phase 12 착수 전: JSONL system/turn_duration 엔트리의 usage 정확한 JSON 경로 확인 필요
  (raw.usage vs raw.message.usage — parser.ts에 console.log 한 줄로 확인)
- Phase 13 착수 전: Pixel Life / office_assets_release 스프라이트 좌표 측정 필요
  (PixelOffice 16px 그리드는 확인됨, 나머지 2팩은 이미지 에디터 실측 필요)

## Blockers

(none)

## Last Session

Stopped at: Roadmap created for v1.2 — 14 requirements mapped across 3 phases (11-13)
