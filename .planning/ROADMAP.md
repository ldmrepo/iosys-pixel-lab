# ROADMAP — v1.0 Office Space Rebuild

## Phase Overview

| Phase | Name | Requirements | Key Deliverable |
|-------|------|-------------|-----------------|
| 1 | 1/1 | Complete   | 2026-03-30 |
| 2 | Office Layout Design | R1, R3, R4, R6 | 30x24 그리드 + 6존 + 전체 가구 배치 |
| 3 | 1/1 | Complete   | 2026-03-30 |
| 4 | ObjectRenderer & Sprites | R5.3 | 신규 가구 렌더링 + 좌표 검증 |
| 5 | Integration & Verification | R5.4, AC | 패스파인딩 + 좌석배정 + E2E 검증 |

---

## Phase 1: Type & Manifest Expansion

**Goal**: 확장 오피스에 필요한 타입과 에셋 매니페스트를 준비
**Requirements**: R1.2, R2
**Plans:** 1/1 plans complete

Plans:
- [x] 01-01-PLAN.md — FloorZone 타입 확장 + 8개 시트 등록 + SPRITES region 확장

**Files**:
- `src/shared/types.ts` — 존 타입, 맵 크기 유연화
- `src/shared/asset-manifest.ts` — 미사용 시트 8종 등록, SPRITES region 확장

**Tasks**:
1. `types.ts`에 FloorZone 타입 추가 (corridor, work, lounge, server, meeting, lobby)
2. `asset-manifest.ts`에 미사용 시트 등록:
   - beds1 (Beds1-Sheet -> 서버랙)
   - doorsHospital (DoorsHospital-Sheet)
   - tilesHospital (TilesHospital)
   - chimney (Chimney-Sheet)
   - chimney1 (Chimney1-Sheet)
   - bathroom (Bathroom-Sheet)
   - beds (Beds-Sheet)
   - bedHospital (BedHospital-Sheet)
3. 각 시트의 개별 스프라이트 region 좌표 문서화

**Success**: `npm run typecheck` 통과, 모든 시트 import 가능

---

## Phase 2: Office Layout Design

**Goal**: 30x24 그리드에 6개 존과 전체 가구를 체계적으로 배치
**Requirements**: R1, R3, R4, R6
**Plans:** 1/1 plans complete

Plans:
- [x] 02-01-PLAN.md — 30x24 그리드 + 6존 배치 + 전체 가구/좌석 배치 + 벽면 장식

**Files**:
- `src/shared/office-layout.ts` — 전면 재작성

**Tasks**:
1. 30x24 타일 그리드 생성 (6개 존 매핑)
2. 벽 배치 (외곽 + 서버룸/회의실 내벽 파티션)
3. 서버룸 가구 배치 (Beds1 네온랙 + 모니터링 장비)
4. 작업존 A/B 데스크 포드 생성 (총 20~24석)
5. 회의실 가구 배치 (테이블 + 의자 + TV + 유리문)
6. 라운지 가구 배치 (소파 + 카펫 + 벽난로 + 조명)
7. 탕비실 가구 배치 (냉장고 + 카운터 + 정수기)
8. 로비 가구 배치 (소파 + 접수대 + 식물 + 정문)
9. 벽면 장식 (창문, 그림, 식물)
10. 전체 가구 walkableMask 정의

**Success**: 가구/좌석 수 목표 달성, 모든 가구에 walkableMask 있음

---

## Phase 3: TileMap Engine Adaptation

**Goal**: 엔진이 확장 맵과 다중 존을 렌더링할 수 있도록 개선
**Requirements**: R5.1, R5.2, R5.5
**Plans:** 1/1 plans complete

Plans:
- [x] 03-01-PLAN.md — 6존 컬러 시스템 교체 + walkableMask 검증 + 카메라 확인

**Files**:
- `src/engine/TileMap.ts` — 존 컬러 시스템 리팩터
- `src/engine/index.ts` — walkableMask 캐싱 개선, 카메라 초기화

**Tasks**:
1. TileMap 존 컬러를 하드코딩에서 설정 맵으로 변경 (spriteIndex -> zoneColors 맵)
2. 6개 존 컬러 정의 (서버룸 다크네이비, 작업존 브라운, 회의실 그린, 라운지 베이지, 로비 크림, 복도 라이트베이지)
3. 벽 렌더링 개선 (내벽 파티션 지원)
4. walkableMask 캐싱 로직이 확장 맵에서 정상 동작하도록 수정
5. Camera 초기 줌/위치를 30x24 맵에 맞게 조정

**Success**: 6개 존이 시각적으로 구분, 맵 전체 정상 렌더링

---

## Phase 4: ObjectRenderer & Sprites

**Goal**: 17개 SPRITES region 좌표 교정 + renderWidth/renderHeight 엔진 확장 + 전체 가구 렌더링 크기/오프셋 보정
**Requirements**: R5.3
**Plans:** 1 plan

Plans:
- [ ] 04-01-PLAN.md — Engine renderWidth/renderHeight fix + 17 SPRITES corrections + 72 furniture sizing + visual verification

**Files**:
- `src/shared/types.ts` — FurnitureObject에 renderWidth/renderHeight 추가
- `src/engine/ObjectRenderer.ts` — renderObject/isVisible에서 renderWidth/renderHeight 사용
- `src/shared/office-layout.ts` — SPRITES region 교정 + 전체 가구 renderWidth/renderHeight/drawOffsetY

**Tasks**:
1. FurnitureObject 타입에 renderWidth?/renderHeight? 필드 추가
2. ObjectRenderer.renderObject()와 isVisible()에서 renderWidth/renderHeight 사용
3. 17개 SPRITES region 좌표 교정 (Kitchen1, TV, Kitchen, Windows, Lights)
4. 72개 가구 객체에 renderWidth/renderHeight 추가 및 drawOffsetY 부호 교정
5. 시각적 검증 (인간 확인)

**Success**: 모든 가구가 올바른 위치/크기로 렌더링, 깨지는 스프라이트 없음

---

## Phase 5: Integration & Verification

**Goal**: 확장 오피스에서 전체 시스템이 정상 동작하는지 검증
**Requirements**: R5.4

**Files**:
- `src/engine/index.ts` — 좌석 배정 로직
- `src/server/state-machine.ts` — 좌석 수 대응
- 전체 파일 대상 typecheck

**Tasks**:
1. PathFinder가 30x24 맵에서 모든 좌석으로 경로를 찾을 수 있는지 검증
2. CharacterBehavior 워킹/아이들이 확장 맵에서 정상 동작하는지 확인
3. StateMachine 좌석 배정이 24석 기준으로 정상 동작하는지 확인
4. `npm run typecheck` 통과
5. `npm run dev` 실행하여 시각적 검증
6. 에이전트 추가/제거/상태변경 WebSocket 시나리오 정상 동작

**Success**: Acceptance Criteria 전항목 충족

---

## Dependency Graph

```
Phase 1 (types/manifest)
 |
Phase 2 (layout) ---> Phase 3 (tilemap engine)
                        |
                      Phase 4 (object renderer)
                        |
                      Phase 5 (integration)
```

Phase 1 -> Phase 2는 순차, Phase 3/4는 Phase 2 완료 후 진행, Phase 5는 모든 phase 완료 후.
