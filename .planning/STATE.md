---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Dynamic Agents
status: not_started
stopped_at: Defining requirements
last_updated: "2026-03-30T12:00:00.000Z"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# STATE — v1.1 Dynamic Agents

## Current Phase

**Not started** — Defining requirements

## Phase Status

(No phases yet — roadmap pending)

## Decisions

- v1.1 범위: Full (6가지 모두) — 캐릭터 FSM + BFS + turn_duration + 말풍선 + 서브에이전트 + 사운드
- 대시보드 UI 제외 (v1.2 이후)
- Pixel Agents 코드 분석 기반 구현 방향 결정

## Accumulated Context (from v1.0)

- 맵 크기: 30×24 (480×384px)
- 에셋: 기존 MetroCity CC0만 사용 (외부 생성 도구 없음)
- 존 구분: 6개 (서버룸/작업A/작업B/회의실/라운지/로비)
- renderWidth/renderHeight optional fields on FurnitureObject
- drawOffsetY positive = shift up convention
- createPod single-column: 2 tiles wide, 4 seats per pod
- layoutReady promise on StateMachine for async startup ordering

## Blockers

(none)

## Last Session

Stopped at: Defining requirements for v1.1
