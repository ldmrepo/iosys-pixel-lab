# Phase 13: Asset Replacement - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

PixelOffice 에셋팩의 스프라이트 좌표를 측정하고 asset-manifest.ts에 등록한 뒤, 오피스 전체 가구를 PixelOffice 에셋으로 교체하고 office-layout.ts를 재설계한다. 기존 엔진(FSM/BFS/말풍선/서브에이전트)이 정상 동작함을 검증한다.

</domain>

<decisions>
## Implementation Decisions

### 교체 범위
- **PixelOffice only** — PixelOffice 에셋팩만 사용. Pixel Life, office_assets_release, MetroCity 모두 제외
- PixelOffice에 없는 아이템(서버랙, 카펫, MetroCity 전용 소품 등)은 삭제 — 공백으로 남기거나 제거
- 큐비클 워크스테이션 사용 (파티션+데스크+모니터+의자 일체형 스프라이트)

### 레이아웃 재설계
- **전면 재설계** — PixelOffice 스타일에 맞게 존 배치를 새로 설계
- **30x24 그리드 유지** — 카메라, BFS, 웹, 모든 엔진 코드 변경 최소화
- **LargePixelOffice.png 3층 구조 참조**:
  - 상단: 로비/휴게 존 (소파, 자판기, 엘리베이터, 식물)
  - 중단: 큐비클 워크스페이스 (4-5개 큐비클)
  - 하단: 큐비클 워크스페이스 (4-5개 큐비클)

### 에셋 스케일 전략
- **원본 비율 유지** — 스프라이트 원본 px 크기 그대로 사용. renderWidth/renderHeight로 정확한 크기 지정 (현재 MetroCity 방식과 동일)
- **Claude 실측** — 리서치 단계에서 Claude가 PixelOfficeAssets.png 이미지를 분석하여 각 스프라이트의 sx/sy/sw/sh 좌표 측정

### 좌석 수 및 배치
- **8-10좌석** (큐비클) — LargePixelOffice.png 참조 수준
- **소파 좌석 없음** — 큐비클 좌석만 사용. 소파는 장식용만
- **2줄 배치** — 중층+하층에 각 4-5개 큐비클 배치

### Claude's Discretion
- 개별 스프라이트의 정확한 sx/sy/sw/sh 좌표 (실측 기반)
- 존 경계 정확한 타일 좌표 (30x24 안에서 최적 배치)
- 큐비클 간 간격 및 통로 폭
- 로비/휴게 존 가구 배치 (자판기, 소파, 엘리베이터, 식물 위치)
- 벽면 장식 (창문, 그림 등) 배치
- walkableMask 설계

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PixelOffice 에셋팩 (교체 소스)
- `PixelOffice/PixelOfficeAssets.png` — 스프라이트시트 (모든 개별 에셋). 좌표 실측 대상
- `PixelOffice/LargePixelOffice.png` — 레퍼런스 씬 (3층 구조). 존 재설계 참조
- `PixelOffice/PixelOffice.png` — 축소 레퍼런스 씬
- `PixelOffice/README.txt` — CC0 라이선스 확인

### 수정 대상 코드
- `src/shared/asset-manifest.ts` — furnitureSheets 등록 + SPRITES 상수 전체 교체
- `src/shared/office-layout.ts` — 존 구조, 가구 배치, 좌석 정의 전면 재설계
- `src/shared/types.ts` — FloorZone 타입 (존 이름 변경 시)

### 엔진 코드 (검증 대상)
- `src/engine/ObjectRenderer.ts` — renderObject(): sprite.region 기반 렌더링 (변경 불필요, 호환성 확인만)
- `src/engine/TileMap.ts` — 타일맵 렌더링 (walkable 검증)
- `src/engine/index.ts` — depth sort, camera, BFS 통합 검증

### 참조: 현재 오피스 구조
- `src/shared/types.ts` — FurnitureObject, ObjectSpriteRef, Seat, FloorZone 타입 정의

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ObjectRenderer.ts`: sprite.region(sx/sy/sw/sh) 기반 렌더링 — 새 에셋도 동일 패턴으로 등록하면 즉시 동작
- `createDeskRow()` in office-layout.ts: 데스크 행 생성 헬퍼 — 큐비클용으로 수정하거나 새 헬퍼 작성
- `assetManifest.furnitureSheets`: 시트 등록 패턴 확립됨 — PixelOffice 시트를 동일 구조로 등록

### Established Patterns
- 모든 스프라이트는 `ObjectSpriteRef` (sheetId + region {sx, sy, sw, sh}) 방식
- `renderWidth/renderHeight`로 실제 렌더링 크기 지정 (원본과 다를 수 있음)
- `drawOffsetX/drawOffsetY`로 타일 기준점 대비 오프셋 조절
- `walkableMask` 배열로 타일별 이동 가능 여부 지정
- `sortY`로 깊이 정렬 오버라이드

### Integration Points
- `office-layout.ts` → `furniture[]` + `seats[]` → 엔진 `setFurniture()` + `BFS pathfinding`
- `asset-manifest.ts` → `furnitureSheets` → `ObjectRenderer.loadSheets()`
- `SPRITES` 상수 → `FurnitureObject.sprite` 참조

</code_context>

<specifics>
## Specific Ideas

- LargePixelOffice.png의 3층 오피스를 30x24 그리드에 맞게 적응 — 상층 로비(소파+자판기+엘리베이터), 중+하층 큐비클 워크스페이스
- 큐비클은 파티션+데스크+모니터가 일체형 스프라이트로 보임 — 하나의 FurnitureObject로 등록하거나 구성요소를 분리할지는 Claude 재량
- PixelOffice 캐릭터(5명의 인간 + 2마리 동물)는 Phase 13 범위 밖 — 기존 claude/codex/gemini 캐릭터 유지

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-asset-replacement*
*Context gathered: 2026-03-31*
