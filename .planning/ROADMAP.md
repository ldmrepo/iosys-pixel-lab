# ROADMAP — v1.0 Office Space Rebuild

## Phase Overview

| Phase | Name | Requirements | Key Deliverable |
|-------|------|-------------|-----------------|
| P1 | Type & Manifest Expansion | R1.2, R2 | 타입 확장 + 전체 에셋 등록 |
| P2 | Office Layout Design | R1, R3, R4, R6 | 30×24 그리드 + 6존 + 전체 가구 배치 |
| P3 | TileMap Engine Adaptation | R5.1, R5.2, R5.5 | 존 컬러 시스템 + walkableMask |
| P4 | ObjectRenderer & Sprites | R5.3 | 신규 가구 렌더링 + 좌표 검증 |
| P5 | Integration & Verification | R5.4, AC | 패스파인딩 + 좌석배정 + E2E 검증 |

---

## P1: Type & Manifest Expansion

**Goal**: 확장 오피스에 필요한 타입과 에셋 매니페스트를 준비

**Files**:
- `src/shared/types.ts` — 존 타입, 맵 크기 유연화
- `src/shared/asset-manifest.ts` — 미사용 시트 8종 등록, SPRITES region 확장

**Tasks**:
1. `types.ts`에 FloorZone 타입 추가 (corridor, work, lounge, server, meeting, lobby)
2. `asset-manifest.ts`에 미사용 시트 등록:
   - beds1 (Beds1-Sheet → 서버랙)
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

## P2: Office Layout Design

**Goal**: 30×24 그리드에 6개 존과 전체 가구를 체계적으로 배치

**Files**:
- `src/shared/office-layout.ts` — 전면 재작성

**Tasks**:
1. 30×24 타일 그리드 생성 (6개 존 매핑)
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

## P3: TileMap Engine Adaptation

**Goal**: 엔진이 확장 맵과 다중 존을 렌더링할 수 있도록 개선

**Files**:
- `src/engine/TileMap.ts` — 존 컬러 시스템 리팩터
- `src/engine/index.ts` — walkableMask 캐싱 개선, 카메라 초기화

**Tasks**:
1. TileMap 존 컬러를 하드코딩에서 설정 맵으로 변경 (spriteIndex → zoneColors 맵)
2. 6개 존 컬러 정의 (서버룸 다크네이비, 작업존 브라운, 회의실 그린, 라운지 베이지, 로비 크림, 복도 라이트베이지)
3. 벽 렌더링 개선 (내벽 파티션 지원)
4. walkableMask 캐싱 로직이 확장 맵에서 정상 동작하도록 수정
5. Camera 초기 줌/위치를 30×24 맵에 맞게 조정

**Success**: 6개 존이 시각적으로 구분, 맵 전체 정상 렌더링

---

## P4: ObjectRenderer & Sprites

**Goal**: 신규 가구 타입이 정상 렌더링되도록 ObjectRenderer 확장

**Files**:
- `src/engine/ObjectRenderer.ts` — 신규 시트 로딩, region 렌더링
- `src/engine/SpriteSheet.ts` — (필요시) region 기반 드로잉 개선

**Tasks**:
1. ObjectRenderer가 신규 furnitureSheets를 로드하도록 확장
2. 서버랙(Beds1) 스프라이트 렌더링 검증 — 네온 글로우가 올바르게 표시되는지
3. 유리문(DoorsHospital) 렌더링 검증
4. 벽난로(Chimney) 렌더링 검증
5. 전체 가구 스프라이트 좌표(region) 실제 이미지와 대조 검증
6. drawOffsetY 값 각 가구 타입별 보정

**Success**: 모든 가구가 올바른 위치/크기로 렌더링, 깨지는 스프라이트 없음

---

## P5: Integration & Verification

**Goal**: 확장 오피스에서 전체 시스템이 정상 동작하는지 검증

**Files**:
- `src/engine/index.ts` — 좌석 배정 로직
- `src/server/state-machine.ts` — 좌석 수 대응
- 전체 파일 대상 typecheck

**Tasks**:
1. PathFinder가 30×24 맵에서 모든 좌석으로 경로를 찾을 수 있는지 검증
2. CharacterBehavior 워킹/아이들이 확장 맵에서 정상 동작하는지 확인
3. StateMachine 좌석 배정이 24석 기준으로 정상 동작하는지 확인
4. `npm run typecheck` 통과
5. `npm run dev` 실행하여 시각적 검증
6. 에이전트 추가/제거/상태변경 WebSocket 시나리오 정상 동작

**Success**: Acceptance Criteria 전항목 충족

---

## Dependency Graph

```
P1 (types/manifest)
 ↓
P2 (layout) ───→ P3 (tilemap engine)
                   ↓
                 P4 (object renderer)
                   ↓
                 P5 (integration)
```

P1 → P2는 순차, P3/P4는 P2 완료 후 진행, P5는 모든 phase 완료 후.
