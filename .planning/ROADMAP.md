# Roadmap: Pixel Office

## Milestones

- ✅ **v1.0 Office Space Rebuild** - Phases 1-5 (shipped 2026-03-30)
- 🚧 **v1.1 Dynamic Agents** - Phases 6-10 (in progress)

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

### 🚧 v1.1 Dynamic Agents (In Progress)

**Milestone Goal:** 정적 오피스를 살아있는 에이전트 공간으로 전환 — 캐릭터가 자율 이동하고, 에이전트 상태를 실시간으로 시각화하며, 서브에이전트가 동적으로 스폰/디스폰된다.

## Phase Details

### Phase 6: Movement Engine
**Goal**: 캐릭터가 오피스를 자율적으로 이동할 수 있는 FSM과 BFS 경로탐색 엔진을 갖춘다
**Depends on**: Phase 5
**Requirements**: MOVE-01, MOVE-02, MOVE-07
**Success Criteria** (what must be TRUE):
  1. 캐릭터가 idle / walk / type 세 상태 사이를 전환하며, 상태마다 올바른 스프라이트 애니메이션이 재생된다
  2. 캐릭터가 출발지에서 목적지까지 4방향 BFS 경로를 계산하고 장애물을 우회하며 타일 단위로 이동한다
  3. 캐릭터가 자기 좌석을 목적지로 삼을 때 해당 타일을 임시 walkable로 처리하여 도달할 수 있다
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md — 4방향 walk 스프라이트시트 확장 + 엔진 방향 시스템 구현
- [ ] 06-02-PLAN.md — E2E 연동 gap 수정 + 좌석 배정 + 통합 검증

### Phase 7: Character Behavior
**Goal**: 캐릭터가 에이전트 활성 상태에 따라 좌석으로 걸어가거나 사무실을 배회하며, 도구별 애니메이션이 분기된다
**Depends on**: Phase 6
**Requirements**: MOVE-03, MOVE-04, MOVE-05, MOVE-06
**Success Criteria** (what must be TRUE):
  1. 에이전트가 활성화되면 캐릭터가 배정된 좌석까지 BFS 경로로 걸어간 뒤 작업 자세를 취한다
  2. 에이전트가 비활성 상태일 때 캐릭터가 2~20초 대기 → 랜덤 이동 → 좌석 복귀 루프를 반복한다
  3. Read/Grep 도구 사용 중에는 reading 애니메이션이, Write/Edit 도구 사용 중에는 typing 애니메이션이 재생된다
  4. 캐릭터 걷기 애니메이션이 이동 방향(상하좌우)에 맞춰 4프레임으로 재생된다
**Plans**: TBD

Plans:
- [ ] 07-01: 좌석 배정 이동 + 랜덤 배회 로직
- [ ] 07-02: 도구별 애니메이션 분기 + 방향별 walk 프레임

### Phase 8: State Detection
**Goal**: 서버가 JSONL 스트림에서 턴 종료·권한 요청·백그라운드 에이전트 상태를 확정적으로 감지한다
**Depends on**: Phase 5
**Requirements**: DETECT-01, DETECT-02, DETECT-03, DETECT-04, DETECT-05
**Success Criteria** (what must be TRUE):
  1. turn_duration 레코드 수신 시 즉시 턴 종료 이벤트가 발행되고 클라이언트에 전달된다
  2. 비면제 도구 호출 후 7초간 응답이 없으면 permission 상태로 전환된다
  3. 새 JSONL 데이터 수신 시 진행 중인 permission/waiting 타이머가 즉시 취소된다
  4. run_in_background 도구 호출이 queue-operation 이벤트로 파싱되어 별도 추적된다
  5. 텍스트 전용 턴에서 5초 미활동 시 waiting 상태로 전환된다
**Plans**: TBD

Plans:
- [ ] 08-01: turn_duration 파서 + 텍스트 턴 waiting 타이머
- [ ] 08-02: permission 타이머 + 타이머 취소 로직 + background agent 추적

### Phase 9: Visual Feedback
**Goal**: 캐릭터 위에 상태별 말풍선이 표시되고 턴 종료 시 사운드 알림이 재생된다
**Depends on**: Phase 8
**Requirements**: VISUAL-01, VISUAL-02, VISUAL-03, VISUAL-04, VISUAL-05
**Success Criteria** (what must be TRUE):
  1. Permission 상태 진입 시 캐릭터 위에 호박색 "..." 말풍선이 나타난다
  2. 턴 종료 시 녹색 체크마크 말풍선이 나타났다가 2초 후 페이드아웃된다
  3. 말풍선을 클릭하면 즉시 닫힌다
  4. 턴 종료 시 E5→E6 2음 차임이 Web Audio API로 재생된다
  5. 화면 상단 사운드 토글 버튼으로 차임 on/off를 전환할 수 있고 설정이 유지된다
**Plans**: TBD

Plans:
- [ ] 09-01: Canvas 말풍선 렌더러 (permission + waiting + 클릭 dismiss)
- [ ] 09-02: Web Audio 차임 + 사운드 토글 UI

### Phase 10: Sub-Agents
**Goal**: Task/Agent 도구 실행 시 서브에이전트 캐릭터가 부모 근처에 스폰되고 작업 완료 시 Matrix 이펙트와 함께 디스폰된다
**Depends on**: Phase 6, Phase 8
**Requirements**: SUB-01, SUB-02, SUB-03, SUB-04, SUB-05
**Success Criteria** (what must be TRUE):
  1. Task/Agent 도구의 progress 레코드가 파싱되어 서브에이전트 스폰 이벤트가 발행된다
  2. 서브에이전트가 부모 캐릭터 근처 walkable 타일에 음수 ID 캐릭터로 즉시 나타난다
  3. 서브에이전트가 부모의 팔레트/색상을 상속하여 팀 소속을 시각적으로 표현한다
  4. 스폰과 디스폰 시 Matrix 스타일 컬럼별 stagger 이펙트가 재생된다
  5. 서브에이전트 작업 완료 시 캐릭터가 자동으로 제거된다
**Plans**: TBD

Plans:
- [ ] 10-01: progress 레코드 파서 + 서브에이전트 스폰/디스폰 상태 관리
- [ ] 10-02: Matrix 이펙트 렌더러 + 팔레트 상속 + 자동 제거 로직

## Progress

**Execution Order:**
Phases execute in this order: 6 → 7 → 8 → 9 → 10
(Phase 8 can begin in parallel with Phase 7 if desired — both depend on Phase 5, not on each other)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Type & Manifest Expansion | v1.0 | 1/1 | Complete | 2026-03-30 |
| 2. Office Layout Design | v1.0 | 1/1 | Complete | 2026-03-30 |
| 3. TileMap Engine Adaptation | v1.0 | 1/1 | Complete | 2026-03-30 |
| 4. ObjectRenderer & Sprites | v1.0 | 1/1 | Complete | 2026-03-30 |
| 5. Integration & Verification | v1.0 | 1/1 | Complete | 2026-03-30 |
| 6. Movement Engine | 2/2 | Complete   | 2026-03-30 | - |
| 7. Character Behavior | v1.1 | 0/2 | Not started | - |
| 8. State Detection | v1.1 | 0/2 | Not started | - |
| 9. Visual Feedback | v1.1 | 0/2 | Not started | - |
| 10. Sub-Agents | v1.1 | 0/2 | Not started | - |
