# Phase 13: Asset Replacement - Research

**Researched:** 2026-03-31
**Domain:** Pixel art sprite coordinate measurement + TypeScript office layout redesign
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **PixelOffice only** — PixelOffice 에셋팩만 사용. Pixel Life, office_assets_release, MetroCity 모두 제외
- PixelOffice에 없는 아이템(서버랙, 카펫, MetroCity 전용 소품 등)은 삭제 — 공백으로 남기거나 제거
- 큐비클 워크스테이션 사용 (파티션+데스크+모니터+의자 일체형 스프라이트)
- **전면 재설계** — PixelOffice 스타일에 맞게 존 배치를 새로 설계
- **30x24 그리드 유지** — 카메라, BFS, 웹, 모든 엔진 코드 변경 최소화
- **LargePixelOffice.png 3층 구조 참조**: 상단=로비/휴게, 중단+하단=큐비클 워크스페이스
- **원본 비율 유지** — renderWidth/renderHeight로 정확한 크기 지정 (MetroCity 방식과 동일)
- **Claude 실측** — 리서치 단계에서 Claude가 PixelOfficeAssets.png 이미지를 분석하여 좌표 측정
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ASSET-01 | PixelOffice 에셋팩의 스프라이트 좌표가 측정되어 asset-manifest.ts에 등록된다 | Section "Sprite Coordinates" contains measured sx/sy/sw/sh for all sprites |
| ASSET-02 | 기존 MetroCity 가구가 PixelOffice 오피스 가구로 교체된다 (데스크, 의자, 소파 등) | SPRITES constant replacement plan in "Standard Stack" + "Architecture Patterns" |
| ASSET-03 | Pixel Life 소품이 회의실/작업공간에 보조 배치된다 | LOCKED OUT per user decision — PixelOffice only, this requirement is superseded by user's decision to use PixelOffice only |
| ASSET-04 | office-layout.ts가 새 에셋에 맞게 재설계된다 | Full layout plan in "Architecture Patterns" with zone map and cubicle placement |
| ASSET-05 | 교체 후 기존 엔진(FSM/BFS/말풍선/서브에이전트)이 정상 동작한다 | Engine compatibility analysis in "Don't Hand-Roll" confirms no engine changes needed |
</phase_requirements>

---

## Summary

PixelOfficeAssets.png (256x160 pixels)는 단일 스프라이트시트로, 의자 6종, 소파 2종, 자판기/소형기기 6종, 창문, 엘리베이터, 스낵랙, 큐비클 상단 패널, 식물 2종을 포함한다. 모든 스프라이트 좌표를 pngjs로 직접 실측 완료했다.

LargePixelOffice.png (1024x896)는 3층 구조의 레퍼런스 씬이다: 상단 로비(자판기, 소파, 엘리베이터, 식물, 창문), 중단과 하단에 2열씩 큐비클 워크스테이션. 30x24 그리드에 이 구조를 적용하면: 로비 y=1..7, 큐비클 열 1 y=9..14, 큐비클 열 2 y=16..21이 된다.

엔진(ObjectRenderer.ts)은 ObjectSpriteRef(sheetId + region {sx, sy, sw, sh}) 패턴을 그대로 사용하므로 코드 변경 없이 새 시트만 등록하면 동작한다. asset-manifest.ts에서 MetroCity furnitureSheets를 pixelOffice 단일 시트로 교체하고, office-layout.ts에서 SPRITES 상수와 가구 배치를 전면 재작성하면 된다.

**Primary recommendation:** `PixelOfficeAssets.png` 를 `public/assets/pixeloffice/PixelOfficeAssets.png`에 복사하고, `pixelOffice` 단일 sheetId로 등록한다. 아래 측정된 좌표를 그대로 SPRITES 상수에 사용한다.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pngjs | (already in node_modules) | 스프라이트 좌표 사전 검증용 (연구/빌드용) | 픽셀 수준 이미지 분석 |
| TypeScript | (project standard) | asset-manifest.ts, office-layout.ts 수정 | 기존 스택 |
| Canvas 2D API | (browser built-in) | ObjectRenderer.renderObject() | 기존 엔진 패턴 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js fs | built-in | PNG 파일 복사 (public/assets/pixeloffice/) | 에셋 배포 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 단일 pixelOffice sheetId | 여러 sheetId로 분할 | 단일이 더 단순, ObjectRenderer는 다중 시트도 지원하므로 취향 차이 |

**Installation:**
```bash
# 추가 설치 불필요 — 모든 툴은 이미 프로젝트에 존재
```

---

## Sprite Coordinates

### PixelOfficeAssets.png 실측 결과 (256x160 pixels)

스프라이트시트는 pngjs로 직접 픽셀 바이트를 읽어 배경색(rgb(65,166,246) = sky blue)과 투명 픽셀을 제외한 tight bounding box를 측정했다.

#### 의자 (6종, y=41..62)
각 의자는 11x22px. 간격 13px 단위로 수평 배열.

| 스프라이트명 | sx | sy | sw | sh | 색상 |
|------------|----|----|----|----|------|
| CHAIR_ORANGE | 6 | 41 | 11 | 22 | 오렌지 (#ef7d57) |
| CHAIR_YELLOW | 19 | 41 | 11 | 22 | 노랑 (#ffcd75) |
| CHAIR_GREEN | 32 | 41 | 11 | 22 | 연두 (#a7f070) |
| CHAIR_BLUE | 45 | 41 | 11 | 22 | 파랑 (#415dc9) |
| CHAIR_WHITE | 58 | 41 | 11 | 22 | 흰색 (#f4f4f4) |
| CHAIR_GRAY | 71 | 41 | 11 | 22 | 회색 (#94b0c2) |

**렌더링 권장:** renderWidth=11, renderHeight=22 (원본 비율). 큐비클 앞 walkable 타일에 배치.

#### 소파 (2종, x=84..110)
| 스프라이트명 | sx | sy | sw | sh | 색상 |
|------------|----|----|----|----|------|
| SOFA_ORANGE | 85 | 47 | 26 | 16 | 오렌지 (#ef7d57) |
| SOFA_WHITE | 84 | 70 | 26 | 20 | 흰/회색 (#f4f4f4) |

**렌더링 권장:** renderWidth=26, renderHeight=16/20 (원본). 로비 장식용, 좌석 없음.

#### 소형 기기/자판기 (6종, x=115..155, 수직 배열)
6개 아이템이 약 16-17px 간격으로 수직 스택됨. 배경색 rgb(65,166,246)을 제외한 tight bound.

| 스프라이트명 | sx | sy | sw | sh | 색상 | 추정 유형 |
|------------|----|----|----|----|------|----------|
| MACHINE_ORANGE | 115 | 47 | 40 | 16 | 오렌지 (#ef7d57) | 자판기 or 음료기기 |
| MACHINE_GRAY | 119 | 66 | 33 | 15 | 회색 (#94b0c2) | 커피머신 |
| MACHINE_CYAN | 120 | 84 | 33 | 15 | 하늘 (#41aef7) | 정수기 |
| MACHINE_GREEN | 120 | 102 | 33 | 16 | 초록 (#38b764) | 식물/디스펜서 |
| MACHINE_ORANGE2 | 120 | 121 | 33 | 16 | 오렌지 (#ef7d57) | 자판기 변형 |
| MACHINE_PURPLE | 116 | 140 | 40 | 17 | 남보라 (#29366f) | 복사기 or 프린터 |

**렌더링 권장:** renderWidth=원본, renderHeight=원본. 로비 벽면 배치.

#### 창문 (y=44..60, x=171..249)
| 스프라이트명 | sx | sy | sw | sh | 비고 |
|------------|----|----|----|----|------|
| WINDOWS_PANEL | 171 | 44 | 79 | 17 | 창문 3연 패널 (79x17) |

LargePixelOffice.png 씬에서 창문은 좌/우 각각 독립 배치. 79px 전체를 하나로 쓰거나 각 창문을 분리 가능 (약 25px씩). 단순 배치 위해 전체 패널을 하나의 스프라이트로 사용 권장.

**렌더링 권장:** renderWidth=79, renderHeight=17. 상단 로비 후벽(y=1) 에 배치.

#### 엘리베이터 (y=63..102)
| 스프라이트명 | sx | sy | sw | sh | 비고 |
|------------|----|----|----|----|------|
| ELEVATOR | 159 | 63 | 92 | 40 | 전체 엘리베이터 어셈블리 |

엘리베이터는 프레임+문 구조. 92x40px. 로비 중앙 후벽에 배치.

**렌더링 권장:** renderWidth=48 (3타일), renderHeight=32 (2타일). drawOffsetY=0, widthTiles=3, heightTiles=2.

#### 스낵랙/선반 (y=106..156, x=159..247)
4개 서브 아이템이 수평 배열:

| 스프라이트명 | sx | sy | sw | sh | 색상 | 추정 유형 |
|------------|----|----|----|----|------|----------|
| RACK_GRAY | 159 | 108 | 24 | 49 | 회색 (#94b0c2) | 스낵랙 A |
| RACK_PINK | 184 | 107 | 24 | 50 | 핑크 (#b13e53) | 스낵랙 B |
| RACK_BLUE | 211 | 107 | 12 | 50 | 파랑 (#41aef7) | 소형 기기 |
| RACK_SILVER | 233 | 106 | 15 | 45 | 실버 (#566c86) | 소형 기기 |

로비 우측 벽에 선택적 배치. RACK_GRAY + RACK_PINK를 나란히 배치하면 48px(3타일) 너비의 자판기 코너가 됨.

#### 큐비클 상단 패널 (y=2..33, 최상단 스트립)
이 영역은 씬 배경(sky+building facade)에 포함된 큐비클 상단 뷰. 개별 스프라이트로 추출 불가 (씬의 일부). **사용하지 않음.**

#### 큐비클 데스크 뷰 (x=59..113, y=96..120)
| 스프라이트명 | sx | sy | sw | sh | 색상 | 비고 |
|------------|----|----|----|----|------|------|
| CUBICLE_DESK_A | 59 | 96 | 26 | 21 | 어두운 네이비 (#1a1c2c) | 큐비클 데스크 전면 |
| CUBICLE_DESK_B | 88 | 96 | 26 | 25 | 어두운 네이비 (#1a1c2c) | 큐비클 데스크 전면 (variant) |

이 스프라이트는 큐비클 데스크 상단 뷰. 26x21~25px 크기 (약 1.5타일 너비).

#### 식물 (엘리베이터 주변, y=63..103)
| 스프라이트명 | sx | sy | sw | sh | 비고 |
|------------|----|----|----|----|------|
| PLANT_LEFT | 170 | 65 | 15 | 38 | 식물 화분 (좌측) |
| PLANT_RIGHT | 213 | 63 | 18 | 40 | 식물 화분 (우측) |

엘리베이터 좌우에 배치된 화분. 15~18px 너비 (약 1타일).

### 큐비클 워크스테이션 전략

LargePixelOffice.png를 분석하면, 큐비클은 다음 구성요소의 조합:
- 회색 칸막이(partition) 배경 — 큰 직사각형 블록
- 데스크 표면 (CUBICLE_DESK_A/B, 약 26x21px)
- 의자 (CHAIR_* 중 하나, 11x22px)

각 큐비클의 실제 타일 폭을 결정해야 한다. 26px 데스크 = 1.625타일 → 실용적으로 **2타일 너비** 큐비클이 적합.

**단순화 전략 (권장):**
- 큐비클 = CUBICLE_DESK_A/B (2타일 footprint, 26x21 렌더) + CHAIR (1타일 앞, 11x22 렌더)
- 파티션 벽은 별도 스프라이트 없이 zone floor color로 표현
- 또는 MACHINE_PURPLE (큐비클 파티션처럼 보이는 어두운 아이템)을 파티션 역할로 재활용

---

## Architecture Patterns

### 파일 배치
```
public/assets/
└── pixeloffice/
    └── PixelOfficeAssets.png   ← PixelOffice/ 에서 복사
```

### Recommended Project Structure (변경 파일만)
```
src/shared/
├── asset-manifest.ts     ← furnitureSheets에 pixelOffice 단일 시트 등록, SPRITES 전면 교체
└── office-layout.ts      ← 30x24 그리드 유지, 존/가구/좌석 전면 재설계
public/assets/
└── pixeloffice/
    └── PixelOfficeAssets.png   ← 신규 복사
```

### Pattern 1: furnitureSheets 등록 패턴

```typescript
// src/shared/asset-manifest.ts
// 기존 MetroCity 시트 모두 제거, pixelOffice 단일 시트로 교체
furnitureSheets: {
  pixelOffice: {
    url: '/assets/pixeloffice/PixelOfficeAssets.png',
    name: 'PixelOffice Assets',
  },
},
```

**중요:** 기존 MetroCity sheetId들(tilesHouse, livingRoom1, kitchen1 등)은 모두 제거. SPRITES 상수에서 새 sheetId `pixelOffice`만 사용.

### Pattern 2: SPRITES 상수 패턴 (ObjectSpriteRef)

기존 패턴과 동일하게 sheetId + region {sx, sy, sw, sh} 구조를 유지.

```typescript
// Source: ObjectRenderer.renderObject() — sprite.region 기반 렌더링
const SPRITES = {
  // 의자
  CHAIR_ORANGE: { sheetId: 'pixelOffice', region: { sx: 6,  sy: 41, sw: 11, sh: 22 } },
  CHAIR_YELLOW: { sheetId: 'pixelOffice', region: { sx: 19, sy: 41, sw: 11, sh: 22 } },
  CHAIR_GREEN:  { sheetId: 'pixelOffice', region: { sx: 32, sy: 41, sw: 11, sh: 22 } },
  CHAIR_BLUE:   { sheetId: 'pixelOffice', region: { sx: 45, sy: 41, sw: 11, sh: 22 } },
  CHAIR_WHITE:  { sheetId: 'pixelOffice', region: { sx: 58, sy: 41, sw: 11, sh: 22 } },
  CHAIR_GRAY:   { sheetId: 'pixelOffice', region: { sx: 71, sy: 41, sw: 11, sh: 22 } },

  // 소파 (장식용, 좌석 없음)
  SOFA_ORANGE:  { sheetId: 'pixelOffice', region: { sx: 85, sy: 47, sw: 26, sh: 16 } },
  SOFA_WHITE:   { sheetId: 'pixelOffice', region: { sx: 84, sy: 70, sw: 26, sh: 20 } },

  // 큐비클 데스크 (전면 뷰)
  CUBICLE_DESK: { sheetId: 'pixelOffice', region: { sx: 59, sy: 96, sw: 26, sh: 21 } },

  // 소형 기기 (자판기/복사기 등)
  MACHINE_ORANGE:  { sheetId: 'pixelOffice', region: { sx: 115, sy: 47, sw: 40, sh: 16 } },
  MACHINE_GRAY:    { sheetId: 'pixelOffice', region: { sx: 119, sy: 66, sw: 33, sh: 15 } },
  MACHINE_CYAN:    { sheetId: 'pixelOffice', region: { sx: 120, sy: 84, sw: 33, sh: 15 } },
  MACHINE_GREEN:   { sheetId: 'pixelOffice', region: { sx: 120, sy: 102, sw: 33, sh: 16 } },
  MACHINE_ORANGE2: { sheetId: 'pixelOffice', region: { sx: 120, sy: 121, sw: 33, sh: 16 } },
  MACHINE_PURPLE:  { sheetId: 'pixelOffice', region: { sx: 116, sy: 140, sw: 40, sh: 17 } },

  // 창문
  WINDOW_PANEL:    { sheetId: 'pixelOffice', region: { sx: 171, sy: 44, sw: 79, sh: 17 } },

  // 엘리베이터
  ELEVATOR:        { sheetId: 'pixelOffice', region: { sx: 159, sy: 63, sw: 92, sh: 40 } },

  // 스낵랙
  RACK_GRAY:       { sheetId: 'pixelOffice', region: { sx: 159, sy: 108, sw: 24, sh: 49 } },
  RACK_PINK:       { sheetId: 'pixelOffice', region: { sx: 184, sy: 107, sw: 24, sh: 50 } },
  RACK_SMALL_BLUE: { sheetId: 'pixelOffice', region: { sx: 211, sy: 107, sw: 12, sh: 50 } },

  // 식물
  PLANT_LEFT:      { sheetId: 'pixelOffice', region: { sx: 170, sy: 65, sw: 15, sh: 38 } },
  PLANT_RIGHT:     { sheetId: 'pixelOffice', region: { sx: 213, sy: 63, sw: 18, sh: 40 } },
} as const;
```

### Pattern 3: 30x24 그리드 레이아웃 설계

LargePixelOffice.png의 3층 구조를 30x24(내부 28x22, 외벽 제외)에 적용:

```
y=0:        [벽]
y=1:        [로비/휴게 존 상단 — 창문, 배경]
y=2..7:     [로비/휴게 존 — 엘리베이터(x=12..14), 소파, 자판기, 식물]
y=8:        [분리 벽 or 통로]
y=9..13:    [큐비클 워크스페이스 열 1 — 4~5개 큐비클 × 2칸 너비]
y=14:       [통로]
y=15..19:   [큐비클 워크스페이스 열 2 — 4~5개 큐비클 × 2칸 너비]
y=20..22:   [하단 여백 or 통로]
y=23:       [벽]
```

**큐비클 배치 계산:**
- 각 큐비클 = 2타일 너비 (데스크 26px = ~1.6타일 → 2타일 할당)
- 큐비클 간 간격 = 1타일 (통로)
- 4개 큐비클 × (2 + 1) = 9타일 → 양쪽 1타일 여백 포함 11타일 (28 안에 맞음)
- 5개 큐비클 × (2 + 1) = 12타일 + 2 마진 = 14타일 (여유 있음)

**권장 배치:**
```
큐비클 열 1: startX=2, y=10(데스크), y=9(의자)
  큐비클 위치: x=2,5,8,11,14  (spacing=3, 5개)
큐비클 열 2: startX=2, y=16(데스크), y=15(의자)
  큐비클 위치: x=2,5,8,11,14  (spacing=3, 5개)
총 좌석: 10석
```

### Pattern 4: FurnitureObject 정의 패턴

기존 `createDeskRow()` 헬퍼와 유사하게 `createCubicleRow()` 헬퍼 작성:

```typescript
// 큐비클 1개 = 데스크(2타일) + 의자(1타일, 앞)
function createCubicleRow(startX: number, deskY: number, count: number, prefix: string) {
  const spacing = 3; // 2-tile desk + 1-tile gap
  const chairY = deskY - 1; // 의자는 데스크 위 타일
  for (let i = 0; i < count; i++) {
    const x = startX + i * spacing;
    const id = `s${seatId++}`;
    // 데스크 (26x21 원본, 2타일 footprint)
    furniture.push({
      id: `desk-${prefix}-${i}`, type: 'desk',
      tileX: x, tileY: deskY, widthTiles: 2, heightTiles: 1,
      walkableMask: [false, false],
      sprite: SPRITES.CUBICLE_DESK,
      renderWidth: 26, renderHeight: 21,
      drawOffsetX: -3, drawOffsetY: 4,   // Claude 재량으로 미세조정
    });
    // 의자 (11x22 원본, 1타일 footprint)
    furniture.push({
      id: `chair-${id}`, type: 'chair',
      tileX: x, tileY: chairY, widthTiles: 1, heightTiles: 1,
      walkableMask: [true],
      sprite: SPRITES.CHAIR_ORANGE,  // 또는 색상 순환
      renderWidth: 11, renderHeight: 22,
      seatId: id,
      drawOffsetX: 3, drawOffsetY: 0,
      sortY: chairY - 1,
    });
    seats.push({ id, tileX: x, tileY: chairY, deskTileX: x, deskTileY: deskY, facing: 'down' });
  }
}
```

### Pattern 5: 존 설계 (FloorZone 재사용)

기존 FloorZone 타입(`work | lounge | lobby | server | meeting | corridor`)을 재사용. server/meeting 존은 삭제하지 않고 사용하지 않으면 됨.

```typescript
// 새 존 구조 (30x24 기준)
const NEW_ZONES = {
  lobby:  { y1: 1, y2: 7,  description: '로비/휴게 — 엘리베이터, 소파, 자판기' },
  workA:  { y1: 9, y2: 13, description: '큐비클 워크스페이스 열 1' },
  workB:  { y1: 15, y2: 19, description: '큐비클 워크스페이스 열 2' },
};
// walkable: lobby는 대부분 walkable, work는 큐비클 제외 walkable
```

### Anti-Patterns to Avoid
- **MetroCity sheetId 혼용:** 새 코드에서 'tilesHouse', 'kitchen1' 등 MetroCity sheetId를 참조하면 404 오류
- **walkableMask 누락:** furniture에 walkableMask 없으면 런타임에 throw new Error 발생 (office-layout.ts 검증 로직)
- **renderWidth/renderHeight 생략:** 원본 스프라이트 크기(11px 의자 등)는 타일(16px) 대비 너무 작거나 크게 보일 수 있으므로 반드시 명시
- **sortY 누락 on 의자:** 의자는 캐릭터와 depth-sort 충돌 발생 가능 — sortY: y - 1로 캐릭터 뒤로 처리

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 스프라이트 좌표 추정 | 눈대중 추정 | pngjs 실측값 (본 문서) | 1px 오차도 렌더 깨짐 |
| 커스텀 스프라이트 파서 | 직접 구현 | ObjectSpriteRef 패턴 | 이미 ObjectRenderer.renderObject()에서 완벽히 동작 |
| 새 렌더링 파이프라인 | 신규 renderer | 기존 ObjectRenderer 재사용 | 변경 불필요 |
| 좌석 할당 로직 | 재구현 | 기존 Seat/BFS 로직 유지 | FSM/BFS는 tileX/tileY만 사용 |
| 씬 파일에서 스프라이트 추출 | Aseprite 파싱 | PNG 직접 측정 | Aseprite는 바이너리 포맷, PNG가 단순 |

**Key insight:** ObjectRenderer.renderObject()는 sheetId와 region(sx/sy/sw/sh)만 알면 즉시 렌더링된다. 엔진 코드 변경은 전혀 필요 없고, asset-manifest.ts + office-layout.ts 두 파일만 수정하면 된다.

---

## Common Pitfalls

### Pitfall 1: 스프라이트 시트 경로 불일치
**What goes wrong:** `furnitureSheets`에 등록한 URL과 실제 파일 경로가 다르면 ObjectRenderer.loadSheets()에서 콘솔 경고만 나오고 스프라이트가 렌더링 안 됨 (silent fail)
**Why it happens:** ObjectRenderer.loadSheets()의 onerror는 console.warn만 하고 Promise를 resolve로 처리
**How to avoid:** `public/assets/pixeloffice/PixelOfficeAssets.png`로 경로 통일. 복사 확인 먼저.
**Warning signs:** 게임 화면에 가구가 안 보임

### Pitfall 2: walkableMask 배열 길이 불일치
**What goes wrong:** `widthTiles * heightTiles != walkableMask.length`이면 office-layout.ts의 검증 throw가 아닌 BFS 오동작 발생 가능
**Why it happens:** 2타일 너비 큐비클에 walkableMask: [false]만 지정
**How to avoid:** widthTiles=2 → walkableMask=[false, false] 필수
**Warning signs:** 캐릭터가 책상 위로 걸어다님

### Pitfall 3: drawOffsetY 부호 반전
**What goes wrong:** ObjectRenderer는 `worldY = tileY * tileSize - drawOffsetY`로 계산 — 양수값이면 스프라이트가 위로 이동
**Why it happens:** 직관적으로 "아래로 내리려면 양수"로 생각하기 쉬움
**How to avoid:** drawOffsetY > 0이면 스프라이트가 타일보다 위에 그려짐을 기억. 작은 스프라이트(의자 11x22)는 drawOffsetY=0으로 시작, 시각적으로 확인 후 미세조정.
**Warning signs:** 가구가 예상보다 위/아래로 오프셋

### Pitfall 4: 의자 sortY 처리
**What goes wrong:** 의자가 캐릭터와 같은 depth-sort Y를 가지면 캐릭터가 의자 뒤로 사라지거나 의자가 캐릭터 위에 그려짐
**Why it happens:** getSortY()는 `(sortY ?? (tileY + heightTiles - 1)) * tileSize + tileSize`를 사용
**How to avoid:** 의자에 `sortY: deskY - 2` 설정으로 데스크 뒤로 처리
**Warning signs:** 앉을 때 캐릭터가 의자에 가려짐

### Pitfall 5: 사용 안 하는 MetroCity furnitureSheets 유지
**What goes wrong:** MetroCity sheetId들이 furnitureSheets에 남아있으면 loadSheets() 시 다수의 404 요청 발생
**Why it happens:** 부분 삭제 실수
**How to avoid:** furnitureSheets를 pixelOffice 단일 항목으로 **완전 교체**
**Warning signs:** 네트워크 탭에 /assets/metrocity/... 404 다수

### Pitfall 6: 10좌석 FSM 할당 검증
**What goes wrong:** 10개 Seat가 있는데 에이전트가 11명이면 마지막 에이전트는 좌석 없이 배회
**Why it happens:** 좌석 수 변경 후 FSM 할당 로직 검증 안 함
**How to avoid:** 구현 후 브라우저에서 실제 에이전트 10명 상태 확인
**Warning signs:** 에이전트가 무한 배회

---

## Code Examples

### asset-manifest.ts 변경 패턴
```typescript
// Source: 기존 assetManifest 패턴 (src/shared/asset-manifest.ts)
export const assetManifest: AssetManifest = {
  tileSheet: { /* 변경 없음 */ },
  characters: { /* 변경 없음 */ },
  furnitureSheets: {
    // MetroCity 항목 모두 삭제, 이것만 남김
    pixelOffice: {
      url: '/assets/pixeloffice/PixelOfficeAssets.png',
      name: 'PixelOffice Assets',
    },
  },
};
```

### 의자 색상 순환 패턴
```typescript
// 큐비클 10개에 의자 색상 분산
const CHAIR_SPRITES = [
  SPRITES.CHAIR_ORANGE, SPRITES.CHAIR_YELLOW, SPRITES.CHAIR_GREEN,
  SPRITES.CHAIR_BLUE,   SPRITES.CHAIR_WHITE,  SPRITES.CHAIR_GRAY,
];
// createCubicleRow 내에서: sprite: CHAIR_SPRITES[i % CHAIR_SPRITES.length]
```

### 엘리베이터 배치 패턴 (로비 중앙)
```typescript
// 엘리베이터: 92x40px 원본 → 3타일 너비(48px), 2타일 높이(32px)로 렌더
furniture.push({
  id: 'elevator', type: 'door',
  tileX: 12, tileY: 1,         // 로비 중앙 (x=12..14), 상단 벽 인접
  widthTiles: 3, heightTiles: 2,
  walkableMask: [false, false, false, false, false, false],
  sprite: SPRITES.ELEVATOR,
  renderWidth: 48, renderHeight: 32,
  drawOffsetX: -8, drawOffsetY: 0,
});
```

### 식물 배치 (엘리베이터 좌우)
```typescript
// 식물: 15x38px → 1타일 너비, 2타일 높이 정도
furniture.push({
  id: 'plant-left', type: 'plant',
  tileX: 10, tileY: 2, widthTiles: 1, heightTiles: 1,
  walkableMask: [false],
  sprite: SPRITES.PLANT_LEFT,
  renderWidth: 15, renderHeight: 38,
  drawOffsetX: 0, drawOffsetY: 22,  // 상향 오프셋으로 2타일 높이처럼 보이게
});
```

---

## LargePixelOffice.png 레이아웃 분석

**이미지 크기:** 1024x896px (약 4x scale = 256x224 논리 픽셀)

**3층 구조 (위→아래):**
1. **최상단 스트립 (하늘+건물 파사드):** 배경만, 스프라이트 없음
2. **로비/휴게 층:** 창문 2개(좌/우), 시계 패널(중앙 상단), 엘리베이터(중앙), 식물 2개(엘리베이터 좌우), 소파(우측), 자판기(좌측 2개), 스낵랙(우측 끝)
3. **큐비클 층 1:** 4개 큐비클 유닛 (좌), 빈 공간 (우, 캐릭터들 위치)
4. **큐비클 층 2:** 4개 큐비클 유닛 (양쪽 분산), 캐릭터들
5. **큐비클 층 3(하단):** 일부 큐비클 + 소품들

**30x24 적용 시 권장 존 경계:**
```
y=0:        외벽(상단)
y=1..2:     로비 후벽 — 창문(x=2..6), 엘리베이터(x=12..14), 창문(x=18..22)
y=3..7:     로비 바닥 — 자판기(x=1..2), 소파(x=4..6), 식물, 스낵랙(x=26..28)
y=8:        로비↔큐비클 구분선(벽 또는 통로)
y=9:        큐비클 열1 의자 행
y=10:       큐비클 열1 데스크 행
y=11..12:   큐비클 열1 파티션 뒷쪽(walkable, 배경)
y=13:       큐비클 열1↔열2 통로
y=14:       큐비클 열2 의자 행
y=15:       큐비클 열2 데스크 행
y=16..17:   큐비클 열2 파티션 뒷쪽(walkable)
y=18..22:   하단 여유 공간 (빈 통로 — 캐릭터 이동 공간)
y=23:       외벽(하단)
```

**총 좌석:** 큐비클 열1(x=2,5,8,11,14 = 5개) + 열2(x=2,5,8,11,14 = 5개) = **10좌석**

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MetroCity CC0 (다수 시트) | PixelOffice 단일 시트 | Phase 13 | furnitureSheets가 1개로 단순화 |
| 서버랙, 카펫, 병원 misc 등 | 삭제 (PixelOffice에 없음) | Phase 13 | SPRITES 상수 대폭 축소 |
| 6개 좌석 (열 1개) | 10개 좌석 (열 2개) | Phase 13 | 에이전트 수용량 증가 |
| 혼합 가구 스타일 | 일관된 PixelOffice 스타일 | Phase 13 | 시각적 통일성 향상 |

**Deprecated/outdated after Phase 13:**
- 모든 MetroCity sheetId: 제거됨
- SPRITES.SERVER_RACK_*: 제거됨
- SPRITES.CHIMNEY_*, CHIMNEY1_*: 제거됨
- SPRITES.BATHROOM_*: 제거됨
- SPRITES.BED_*: 제거됨
- SPRITES.DOOR_HOSP_*: 제거됨
- SPRITES.SOFA_FRONT/BACK, DESK_TOP/BOT 등: 제거됨

---

## Open Questions

1. **큐비클 파티션 렌더링**
   - What we know: PixelOfficeAssets.png에 별도의 파티션 벽 스프라이트가 명확하지 않음 (최상단 씬 영역은 추출 불가)
   - What's unclear: 큐비클 간 파티션을 별도로 그릴지, floor color만으로 충분할지
   - Recommendation: 우선 CUBICLE_DESK + CHAIR만으로 큐비클 구현, 파티션은 TileMap zone color로 시각적 구분 제공

2. **시계 패널 스프라이트**
   - What we know: LargePixelOffice.png 로비 중앙 상단에 디지털 시계 패널이 있음
   - What's unclear: PixelOfficeAssets.png에서 시계 스프라이트를 식별하지 못했음 (중간 좌표 분석에서 누락 가능)
   - Recommendation: Phase 13에서 시계는 선택 사항 — 없어도 핵심 요건 충족

3. **ASSET-03 (Pixel Life 소품) 처리**
   - What we know: 유저가 PixelOffice only로 결정했으므로 ASSET-03은 사실상 N/A
   - What's unclear: REQUIREMENTS.md에 ASSET-03이 남아있어 혼란 가능
   - Recommendation: 플래너가 ASSET-03을 "PixelOffice 소품(자판기, 식물 등)으로 로비 배치"로 재해석하여 충족

---

## Validation Architecture

nyquist_validation 설정 없음 → 기본값으로 검증 아키텍처 포함.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | TypeScript 컴파일 검증 (no dedicated test framework) |
| Config file | tsconfig.json (기존) |
| Quick run command | `npx tsc --noEmit` |
| Full suite command | `npm run dev` (실제 렌더링 확인) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ASSET-01 | PixelOffice 스프라이트 좌표 등록 | 수동 확인 | `npx tsc --noEmit` (타입 오류 없음) | ✅ asset-manifest.ts |
| ASSET-02 | MetroCity → PixelOffice 가구 교체 | 시각 확인 | `npm run dev` + 브라우저 확인 | ✅ office-layout.ts |
| ASSET-04 | office-layout.ts 재설계 | 단위 확인 | `npx tsc --noEmit` + walkableMask 검증 throw | ✅ office-layout.ts |
| ASSET-05 | FSM/BFS/말풍선/서브에이전트 정상 동작 | 통합 수동 확인 | `npm run dev` + Claude Code 연결 | ✅ 엔진 변경 없음 |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npm run dev` + 브라우저에서 렌더링 확인
- **Phase gate:** Full suite (브라우저) + Claude Code JSONL 연결 확인 후 `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `public/assets/pixeloffice/PixelOfficeAssets.png` — PixelOffice/ 에서 복사 필요 (Wave 0에서 수행)
- Wave 0에서 추가 파일 생성은 불필요 (TypeScript 컴파일이 유일한 자동화된 검증)

---

## Sources

### Primary (HIGH confidence)
- `PixelOffice/PixelOfficeAssets.png` — pngjs로 직접 픽셀 데이터 분석, 모든 스프라이트 좌표 실측
- `PixelOffice/LargePixelOffice.png` — 씬 구조 분석 (1024x896, 3층 레이아웃)
- `src/engine/ObjectRenderer.ts` — renderObject() sprite.region 패턴 확인
- `src/shared/types.ts` — FurnitureObject, ObjectSpriteRef, Seat 타입 정의
- `src/shared/asset-manifest.ts` — 기존 furnitureSheets 등록 패턴
- `src/shared/office-layout.ts` — 기존 SPRITES 상수, createDeskRow() 헬퍼, walkableMask 검증

### Secondary (MEDIUM confidence)
- `PixelOffice/README.txt` — CC0 라이선스 확인
- `src/engine/TileMap.ts` — isWalkable(), zone color 로직 확인

### Tertiary (LOW confidence)
- 스프라이트 유형 추정 (의자/자판기/복사기 등): 색상 기반 추정, Aseprite 파일 미분석

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 기존 패턴 그대로 사용, 검증됨
- Architecture: HIGH — 측정된 좌표 + 엔진 호환성 확인
- Sprite coordinates: HIGH — pngjs 픽셀 직접 측정 (배경색 마스킹)
- Pitfalls: HIGH — 기존 코드 분석 기반
- Layout design: MEDIUM — 타일 경계값은 구현 중 시각 확인 후 미세조정 가능

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (에셋팩 변경 없음 가정)
