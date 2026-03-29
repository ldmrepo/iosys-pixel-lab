---
name: prepare-assets
description: >
  Downloads and configures MetroCity pixel art assets for the Pixel Office project.
  Generates programmatic placeholder sprites when external downloads are unavailable.
  Triggers when asset setup, sprite sheet creation, or tile map definition is needed.
---

# Pixel Office Asset Preparation

이 스킬은 Pixel Office의 픽셀 아트 에셋을 준비한다.

## 전략

itch.io에서 직접 다운로드는 자동화가 어렵다 (웹 인터페이스 + 결제 플로우).
따라서 **프로그래매틱 플레이스홀더** 전략을 기본으로 사용하고, 사용자가 수동으로 에셋을 넣을 수 있는 구조를 제공한다.

## Step 1: 프로그래매틱 스프라이트 생성기

`scripts/generate-sprites.ts` 생성:

Canvas API로 각 에이전트별 픽셀 아트 캐릭터를 코드로 생성한다.

### 캐릭터 디자인 (16x24 크기)

각 에이전트별 색상 팔레트:
- **Claude** (보라/주황): 기본 에이전트 색상
  - 머리: #8B5CF6, 몸: #A78BFA, 악센트: #F97316
- **Codex** (녹색): 향후 지원용 예비
  - 머리: #22C55E, 몸: #4ADE80, 악센트: #FFFFFF
- **Gemini** (파랑): 향후 지원용 예비
  - 머리: #3B82F6, 몸: #60A5FA, 악센트: #FBBF24

### 애니메이션 프레임

상태별 프레임 수:
- `idle`: 2 프레임 (가만히 + 살짝 숨쉬기)
- `typing`: 4 프레임 (손 올림 → 타이핑 → 반복)
- `reading`: 2 프레임 (책 들고 있기 + 페이지 넘김)
- `executing`: 4 프레임 (활발한 동작)
- `waiting`: 2 프레임 (물음표 말풍선 깜빡)
- `done`: 2 프레임 (체크마크 + 유휴)
- `error`: 2 프레임 (느낌표 깜빡)

### 스프라이트시트 레이아웃

하나의 PNG에 모든 프레임 배치:
- 행: 각 상태 (7행)
- 열: 프레임 (최대 4열)
- 총 크기: 64 x 168 (16px * 4열 x 24px * 7행)

## Step 2: 타일 에셋 생성

`scripts/generate-tiles.ts` 생성:

오피스 타일셋을 코드로 생성한다:
- 바닥 타일 (밝은 회색)
- 벽 타일 (어두운 회색)
- 책상 타일 (나무색)
- 의자 타일 (파란색)
- 장식 타일 (화분 등)

타일 크기: 16x16

## Step 3: 오피스 레이아웃 정의

`src/shared/office-layout.ts` 생성:

기본 오피스 (20x15 타일):
```
WWWWWWWWWWWWWWWWWWWW
W..................W
W.DC..DC..DC..DC..W
W..................W
W..................W
W.DC..DC..DC..DC..W
W..................W
W..................W
W......DDDD.......W
W..................W
W.DC..DC..DC..DC..W
W..................W
W..................W
W..................W
WWWWWWWWWWWWWWWWWWWW

W=벽, D=책상, C=의자, .=바닥
```

## Step 4: 에셋 매니페스트 생성

`src/shared/asset-manifest.ts` 생성:
- `src/shared/types.ts`의 `AssetManifest` 타입 준수
- 모든 스프라이트시트/타일시트 URL
- 프레임 크기, 애니메이션 정보

## Step 5: 빌드 스크립트

`package.json`에 스크립트 추가:
```json
{
  "scripts": {
    "generate:sprites": "npx tsx scripts/generate-sprites.ts",
    "generate:tiles": "npx tsx scripts/generate-tiles.ts",
    "generate:assets": "npm run generate:sprites && npm run generate:tiles"
  }
}
```

## 실제 에셋 교체 가이드

사용자가 MetroCity 에셋을 수동 다운로드한 경우:
1. `public/assets/sprites/` 에 캐릭터 스프라이트시트 배치
2. `public/assets/tiles/` 에 타일시트 배치
3. `src/shared/asset-manifest.ts` 의 URL/프레임 정보 수정
4. 게임 엔진이 자동으로 새 에셋 로드

## 품질 체크리스트

- [ ] `public/assets/sprites/claude.png` 존재
- [ ] `public/assets/tiles/office-tiles.png` 존재
- [ ] `src/shared/asset-manifest.ts` 가 AssetManifest 타입 준수
- [ ] `src/shared/office-layout.ts` 가 OfficeLayout 타입 준수
- [ ] 오피스에 최소 8개 워크스테이션 배치
- [ ] 모든 캐릭터 상태에 대한 애니메이션 프레임 정의
