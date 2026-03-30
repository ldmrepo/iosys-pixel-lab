# Requirements: Pixel Office

**Defined:** 2026-03-30
**Core Value:** AI 코딩 에이전트의 실시간 활동 상태를 픽셀 아트 캐릭터로 직관적으로 시각화

## v1.1 Requirements

Requirements for Dynamic Agents milestone. Each maps to roadmap phases.

### Character Movement

- [x] **MOVE-01**: 캐릭터가 idle/walk/type 3상태 FSM으로 동작한다
- [x] **MOVE-02**: 캐릭터가 BFS 경로탐색으로 타일 간 이동한다 (4방향, 장애물 회피)
- [ ] **MOVE-03**: 에이전트 활성화 시 캐릭터가 배정된 좌석으로 걸어간다
- [ ] **MOVE-04**: 에이전트 비활성 시 캐릭터가 사무실을 랜덤 배회한다 (2~20초 대기 → 이동 → 좌석 복귀)
- [ ] **MOVE-05**: 도구 종류에 따라 typing/reading 애니메이션이 분기된다 (Read/Grep→reading, Write/Edit→typing)
- [ ] **MOVE-06**: 캐릭터 걷기 애니메이션이 4프레임으로 방향별 재생된다
- [x] **MOVE-07**: 캐릭터가 자기 좌석을 pathfinding 시 임시 unblock하여 도달할 수 있다

### State Detection

- [ ] **DETECT-01**: JSONL의 turn_duration 레코드로 확정적 턴 종료를 감지한다
- [ ] **DETECT-02**: 비면제 도구가 7초간 무응답이면 permission 상태로 전환한다
- [ ] **DETECT-03**: 새 데이터 수신 시 permission/waiting 타이머를 취소한다
- [ ] **DETECT-04**: 백그라운드 에이전트(run_in_background)를 queue-operation으로 추적한다
- [ ] **DETECT-05**: 텍스트 전용 턴에서 5초 미활동 시 waiting으로 전환한다

### Visual Feedback

- [ ] **VISUAL-01**: Permission 말풍선이 도구 권한 대기 시 캐릭터 위에 표시된다 (호박색 "...")
- [ ] **VISUAL-02**: Waiting 말풍선이 턴 종료 시 표시되고 2초 후 페이드아웃된다 (녹색 체크마크)
- [ ] **VISUAL-03**: 말풍선 클릭으로 즉시 닫을 수 있다
- [ ] **VISUAL-04**: 턴 종료 시 2음 차임 사운드가 재생된다 (E5→E6, Web Audio API)
- [ ] **VISUAL-05**: 사운드 on/off 토글이 가능하다

### Sub-Agents

- [ ] **SUB-01**: Task/Agent 도구의 progress 레코드에서 서브에이전트를 감지한다
- [ ] **SUB-02**: 서브에이전트가 부모 근처 walkable 타일에 음수 ID 캐릭터로 스폰된다
- [ ] **SUB-03**: 서브에이전트가 부모의 팔레트/색상을 상속받는다
- [ ] **SUB-04**: 서브에이전트 스폰/디스폰 시 Matrix 이펙트가 재생된다 (컬럼별 stagger)
- [ ] **SUB-05**: 서브에이전트 작업 완료 시 캐릭터가 자동 제거된다

## v2 Requirements

Deferred to future release.

### Dashboard UI

- **DASH-01**: 에이전트별 상태/도구 표시하는 사이드 패널
- **DASH-02**: 토큰 사용량 실시간 추적
- **DASH-03**: 세션 히스토리 검색

### Layout Editor

- **EDIT-01**: 드래그 앤 드롭 가구 배치
- **EDIT-02**: 타일 타입 변경 (floor/wall/void)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Tauri/Electron 래핑 | 웹앱으로 충분, 데스크탑 앱은 오버킬 |
| CASS 검색 엔진 | AgentRoom 전용 기능, 현재 불필요 |
| 오피스 레이아웃 에디터 | v2 이후 — 현재 코드 기반 레이아웃으로 충분 |
| 토큰/비용 추적 | v2 이후 — 대시보드 UI와 함께 |
| VS Code 확장 | 독립 웹앱 유지 |
| OAuth/인증 | 로컬 전용 도구 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MOVE-01 | Phase 6 | Complete |
| MOVE-02 | Phase 6 | Complete |
| MOVE-07 | Phase 6 | Complete |
| MOVE-03 | Phase 7 | Pending |
| MOVE-04 | Phase 7 | Pending |
| MOVE-05 | Phase 7 | Pending |
| MOVE-06 | Phase 7 | Pending |
| DETECT-01 | Phase 8 | Pending |
| DETECT-02 | Phase 8 | Pending |
| DETECT-03 | Phase 8 | Pending |
| DETECT-04 | Phase 8 | Pending |
| DETECT-05 | Phase 8 | Pending |
| VISUAL-01 | Phase 9 | Pending |
| VISUAL-02 | Phase 9 | Pending |
| VISUAL-03 | Phase 9 | Pending |
| VISUAL-04 | Phase 9 | Pending |
| VISUAL-05 | Phase 9 | Pending |
| SUB-01 | Phase 10 | Pending |
| SUB-02 | Phase 10 | Pending |
| SUB-03 | Phase 10 | Pending |
| SUB-04 | Phase 10 | Pending |
| SUB-05 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 — traceability filled after roadmap creation*
