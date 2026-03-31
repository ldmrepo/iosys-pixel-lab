# Roadmap: Pixel Office

## Milestones

- ✅ **v1.0 Office Space Rebuild** - Phases 1-5 (shipped 2026-03-30)
- ✅ **v1.1 Dynamic Agents** - Phases 6-10 (shipped 2026-03-30)
- 🚧 **v1.2 Dashboard & Polish** - Phases 11-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 Office Space Rebuild (Phases 1-5) - SHIPPED 2026-03-30</summary>

### Phase 1: Type & Manifest Expansion
**Goal**: 확장 오피스에 필요한 타입과 에셋 매니페스트를 준비
**Plans**: 1/1 plans complete

Plans:
- [x] 01-01-PLAN.md — FloorZone 타입 확장 + 8개 시트 등록 + SPRITES region 확장

### Phase 2: Office Layout Design
**Goal**: 30x24 그리드에 6개 존과 전체 가구를 체계적으로 배치
**Plans**: 1/1 plans complete

Plans:
- [x] 02-01-PLAN.md — 30x24 그리드 + 6존 배치 + 전체 가구/좌석 배치 + 벽면 장식

### Phase 3: TileMap Engine Adaptation
**Goal**: 엔진이 확장 맵과 다중 존을 렌더링할 수 있도록 개선
**Plans**: 1/1 plans complete

Plans:
- [x] 03-01-PLAN.md — 6존 컬러 시스템 교체 + walkableMask 검증 + 카메라 확인

### Phase 4: ObjectRenderer & Sprites
**Goal**: 17개 SPRITES region 좌표 교정 + renderWidth/renderHeight 엔진 확장 + 전체 가구 렌더링 크기/오프셋 보정
**Plans**: 1/1 plans complete

Plans:
- [x] 04-01-PLAN.md — Engine renderWidth/renderHeight fix + 17 SPRITES corrections + 72 furniture sizing + visual verification

### Phase 5: Integration & Verification
**Goal**: 3개 결함 수정 + 전체 시스템 E2E 검증
**Plans**: 1/1 plans complete

Plans:
- [x] 05-01-PLAN.md — Fix seat count bug + async race condition + FALLBACK_LAYOUT + visual verification (v1.0 APPROVED)

</details>

<details>
<summary>✅ v1.1 Dynamic Agents (Phases 6-10) - SHIPPED 2026-03-30</summary>

### Phase 6: Movement Engine
**Goal**: 캐릭터가 오피스를 자율적으로 이동할 수 있는 FSM과 BFS 경로탐색 엔진을 갖춘다
**Plans**: 2/2 plans complete

Plans:
- [x] 06-01-PLAN.md — 4방향 walk 스프라이트시트 확장 + 엔진 방향 시스템 구현
- [x] 06-02-PLAN.md — E2E 연동 gap 수정 + 좌석 배정 + 통합 검증

### Phase 7: Character Behavior
**Goal**: 캐릭터가 에이전트 활성 상태에 따라 좌석으로 걸어가거나 사무실을 배회하며, 도구별 애니메이션이 분기된다
**Plans**: 1/1 plans complete

Plans:
- [x] 07-01-PLAN.md — Pixel Agents 타이밍 튜닝 + 전체 E2E 검증

### Phase 8: State Detection
**Goal**: 서버가 JSONL 스트림에서 턴 종료·권한 요청·백그라운드 에이전트 상태를 확정적으로 감지한다
**Plans**: 2/2 plans complete

Plans:
- [x] 08-01-PLAN.md — 타입 확장 + turn_duration 파서 + per-agent 타이머 인프라 + text-idle 5s
- [x] 08-02-PLAN.md — Background agent 추적 + 타이머 취소 검증 + E2E 통합 확인

### Phase 9: Visual Feedback
**Goal**: 캐릭터 위에 상태별 말풍선이 표시되고 턴 종료 시 사운드 알림이 재생된다
**Plans**: 2/2 plans complete

Plans:
- [x] 09-01-PLAN.md — Pixel-art speech bubble renderer (permission + waiting + fade-out + click dismiss)
- [x] 09-02-PLAN.md — Web Audio E5-E6 chime + SoundToggle React component + localStorage persistence

### Phase 10: Sub-Agents
**Goal**: Task/Agent 도구 실행 시 서브에이전트 캐릭터가 부모 근처에 스폰되고 작업 완료 시 Matrix 이펙트와 함께 디스폰된다
**Plans**: 2/2 plans complete

Plans:
- [x] 10-01-PLAN.md — Type extensions + parser sub-agent event + state machine sub-agent lifecycle
- [x] 10-02-PLAN.md — MatrixEffect renderer + palette inheritance + BFS spawn + sub-agent behavior + visual verification

</details>

### 🚧 v1.2 Dashboard & Polish (In Progress)

**Milestone Goal:** UX 레이어 강화 — 대시보드 사이드 패널로 에이전트 상태를 한눈에 파악하고, 토큰/비용을 실시간 추적하며, 새 에셋팩으로 오피스 비주얼을 업그레이드한다.

- [x] **Phase 11: Layout & Dashboard Panel** - 안정적인 3열 레이아웃 위에 에이전트 상태/계층/세션 패널 구축 (completed 2026-03-30)
- [x] **Phase 12: Token & Cost Tracking** - JSONL turn_duration 기반 토큰 파이프라인 + 에이전트 카드 비용 표시 (completed 2026-03-31)
- [ ] **Phase 13: Asset Replacement** - PixelOffice 에셋팩으로 오피스 전면 교체 + 엔진 호환성 검증

## Phase Details

### Phase 11: Layout & Dashboard Panel
**Goal**: Canvas와 사이드 패널이 안정적으로 공존하는 3열 레이아웃을 구축하고, 에이전트별 상태/도구/계층/세션 정보를 패널에 표시한다
**Depends on**: Phase 10
**Requirements**: DASH-05, DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. 사이드 패널을 열고 닫아도 Canvas 픽셀아트가 흐려지지 않고 그대로 렌더링된다
  2. 사이드 패널에 각 에이전트의 현재 상태(work/walk/idle/permission/waiting)와 활성 도구 이름이 표시된다
  3. 서브에이전트가 부모 에이전트 카드 아래 들여쓰기된 행으로 표시된다
  4. 각 에이전트 카드에 세션 시작 이후 경과 시간이 초 단위로 실시간 업데이트된다
**Plans**: 2 plans

Plans:
- [x] 11-01-PLAN.md — CSS layout hardening + panel toggle with localStorage persistence
- [x] 11-02-PLAN.md — AgentState createdAt + agent card enrichment (tool name, elapsed time, sub-agent hierarchy)

### Phase 12: Token & Cost Tracking
**Goal**: 서버가 JSONL turn_duration 엔트리에서 토큰 사용량을 누적·중복제거하여 USD 비용으로 변환하고, 에이전트 카드에 실시간 표시한다
**Depends on**: Phase 11
**Requirements**: TOKEN-01, TOKEN-02, TOKEN-03, TOKEN-04, DASH-04
**Success Criteria** (what must be TRUE):
  1. 각 에이전트 카드에 누적 입력/출력 토큰 수와 캐시 읽기 토큰 수가 표시된다
  2. 병렬 도구 호출 시 같은 message.id가 여러 번 집계되지 않는다 (중복 카운팅 없음)
  3. 각 에이전트 카드에 세션 누적 예상 비용(USD)이 표시된다
  4. 브라우저 재접속 후에도 토큰 누적값이 유지된다 (서버 상태 기반)
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md — TokenUsage type + pricing module + parser usage extraction + state-machine accumulation with dedup
- [x] 12-02-PLAN.md — AgentPanel token/cost display replacing placeholder + visual verification

### Phase 13: Asset Replacement
**Goal**: PixelOffice 에셋팩의 스프라이트 좌표를 측정·등록하고 오피스 가구를 새 에셋으로 교체하되 기존 엔진이 정상 동작함을 검증한다
**Depends on**: Phase 11
**Requirements**: ASSET-01, ASSET-02, ASSET-03, ASSET-04, ASSET-05
**Success Criteria** (what must be TRUE):
  1. PixelOffice 스프라이트가 asset-manifest.ts에 좌표와 함께 등록되어 있다
  2. 오피스 주요 가구(데스크, 의자, 소파 등)가 PixelOffice 스프라이트로 렌더링된다
  3. 교체 후 FSM 이동, BFS 경로탐색, 말풍선, 서브에이전트 이펙트가 모두 정상 동작한다
  4. 캐릭터가 교체된 가구와 충돌하지 않고 walkable 타일을 올바르게 탐색한다
**Plans**: 2 plans

Plans:
- [ ] 13-01-PLAN.md — PixelOffice sprite sheet deployment + asset-manifest.ts replacement + SPRITES constant definition
- [ ] 13-02-PLAN.md — Office layout redesign (zones, cubicle rows, lobby furniture) + visual verification

## Progress

**Execution Order:**
Phases execute in this order: 11 → 12 → 13
(Phase 13 can begin in parallel with Phase 12 once Phase 11 layout is stable)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Type & Manifest Expansion | v1.0 | 1/1 | Complete | 2026-03-30 |
| 2. Office Layout Design | v1.0 | 1/1 | Complete | 2026-03-30 |
| 3. TileMap Engine Adaptation | v1.0 | 1/1 | Complete | 2026-03-30 |
| 4. ObjectRenderer & Sprites | v1.0 | 1/1 | Complete | 2026-03-30 |
| 5. Integration & Verification | v1.0 | 1/1 | Complete | 2026-03-30 |
| 6. Movement Engine | v1.1 | 2/2 | Complete | 2026-03-30 |
| 7. Character Behavior | v1.1 | 1/1 | Complete | 2026-03-30 |
| 8. State Detection | v1.1 | 2/2 | Complete | 2026-03-30 |
| 9. Visual Feedback | v1.1 | 2/2 | Complete | 2026-03-30 |
| 10. Sub-Agents | v1.1 | 2/2 | Complete | 2026-03-30 |
| 11. Layout & Dashboard Panel | v1.2 | Complete    | 2026-03-30 | 2026-03-30 |
| 12. Token & Cost Tracking | v1.2 | Complete    | 2026-03-31 | 2026-03-30 |
| 13. Asset Replacement | 1/2 | In Progress|  | - |
