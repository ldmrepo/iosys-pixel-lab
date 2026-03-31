# MILESTONES

## v1.2 Dashboard & Polish (Shipped: 2026-03-31)

**Phases completed:** 3 phases, 6 plans | **Timeline:** 2026-03-30 ~ 2026-03-31 | **Commits:** 18 feat

| Phase | Name | Plans | Summary |
|-------|------|-------|---------|
| P11 | Layout & Dashboard Panel | 2/2 | 3열 CSS 레이아웃 + 패널 토글 + 에이전트 카드(상태/도구/시간/계층) |
| P12 | Token & Cost Tracking | 2/2 | pricing.ts + JSONL usage 파싱 + message.id 중복제거 + 카드 표시 |
| P13 | Asset Replacement | 2/2 | PixelOffice CC0 에셋 전면 교체 + 3존 레이아웃 + 10좌석 |

**Key accomplishments:**

- 3열 CSS 레이아웃: Canvas + 사이드 패널 안정적 공존 (flex:1 + min-width:0)
- 에이전트 카드: 상태 dot, 도구명, 경과시간, 서브에이전트 들여쓰기 계층
- 토큰/비용 파이프라인: turn_duration → pricing.ts → message.id 중복제거 → $X.XX · XX.XK 표시
- PixelOffice CC0 에셋팩으로 전면 교체: 25개 MetroCity 시트 → 1개 PixelOffice 시트 (23 스프라이트)
- 3존 오피스 재설계: 로비(엘리베이터/소파/자판기) + 큐비클 2열(10좌석)
- v1.2 요구사항 14/14 완료 (DASH-01~05, TOKEN-01~04, ASSET-01~05)

---

## v1.1 Dynamic Agents (Shipped: 2026-03-30)

**Phases completed:** 5 phases, 9 plans | **Timeline:** 2026-03-30 ~ 2026-03-31 | **Commits:** 13 feat

| Phase | Name | Plans | Summary |
|-------|------|-------|---------|
| P6 | Movement Engine | 2/2 | 4방향 walk 스프라이트 (11행 시트) + 3상태 FSM + BFS 경로탐색 |
| P7 | Character Behavior | 1/1 | Pixel Agents 배회 타이밍 (2~20s/3~6회/120~240s) + E2E 검증 |
| P8 | State Detection | 2/2 | turn_duration 파서 + 7s permission + 5s text-idle + background agent 추적 |
| P9 | Visual Feedback | 2/2 | 픽셀아트 말풍선 (permission/waiting) + E5→E6 차임 + 사운드 토글 |
| P10 | Sub-Agents | 2/2 | 서브에이전트 스폰/디스폰 + Matrix 컬럼 stagger 이펙트 |

**Key accomplishments:**

- 캐릭터 자율 이동: 3상태 FSM (work/walk/idle) + BFS 경로탐색 + 4방향 walk 애니메이션
- 도구별 애니메이션 분기: Write→typing, Read→reading, Bash→executing
- 확정적 상태 감지: turn_duration 파싱, 7초 permission 타이머, 5초 text-idle
- 시각/청각 피드백: 픽셀아트 말풍선 + Web Audio 차임 + 사운드 토글
- 서브에이전트 시각화: Task/Agent 도구 스폰/디스폰 + Matrix 이펙트 + 부모 팔레트 상속
- Pixel Agents 수준의 동적 캐릭터 시각화 달성

---

## v1.0 — Office Space Rebuild (complete)

**Completed:** 2026-03-30
**Phases:** 5 (P1–P5)

| Phase | Name | Summary |
|-------|------|---------|
| P1 | Type & Manifest Expansion | FloorZone, ZONE_INDEX, 8 new sheets, 70+ SPRITES |
| P2 | Office Layout Design | 30x24 grid, 6 zones, 20 seats, 80+ furniture with walkableMask |
| P3 | TileMap Engine Adaptation | ZONE_COLORS 6-entry map, walkableMask verification, camera confirmed |
| P4 | ObjectRenderer & Sprites | renderWidth/renderHeight override, 17 SPRITES fixes, 72 furniture corrected |
| P5 | Integration & Verification | v1.0 milestone gate APPROVED |

**Last phase number:** 5
