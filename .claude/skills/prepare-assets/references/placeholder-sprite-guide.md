# 프로그래매틱 플레이스홀더 스프라이트 생성 가이드

## 캐릭터 스프라이트 규격

- 프레임 크기: 16x24 픽셀
- 스프라이트시트: 4열 x 7행 (64x168 픽셀)

### 행(Row)별 상태

| Row | 상태 | 프레임 수 | 설명 |
|-----|------|-----------|------|
| 0 | idle | 2 | 가만히 서 있기 + 살짝 숨쉬기 |
| 1 | typing | 4 | 손 올림 → 타이핑 → 반복 |
| 2 | reading | 2 | 책 들기 + 페이지 넘김 |
| 3 | executing | 4 | 활발한 동작 |
| 4 | waiting | 2 | 물음표 말풍선 |
| 5 | done | 2 | 체크마크 + 유휴 |
| 6 | error | 2 | 느낌표 깜빡 |

### 에이전트별 색상 팔레트

```typescript
const PALETTES = {
  claude: {
    skin: '#FFD5B8',
    hair: '#8B5CF6',
    body: '#A78BFA',
    accent: '#F97316',
    outline: '#4C1D95',
  },
  codex: {
    skin: '#FFD5B8',
    hair: '#22C55E',
    body: '#4ADE80',
    accent: '#FFFFFF',
    outline: '#166534',
  },
  gemini: {
    skin: '#FFD5B8',
    hair: '#3B82F6',
    body: '#60A5FA',
    accent: '#FBBF24',
    outline: '#1E3A5F',
  },
};
```

### 캐릭터 해부도 (16x24 그리드)

```
....HHHH........ Row 0-3: 머리 (H=머리, h=머리카락)
...hHHHHh.......
...FFFFHH....... F=얼굴
....FFFF........
....BBBB........ Row 4-8: 상체 (B=몸통)
...BBBBBB.......
...B.BB.B.......
....BBBB........
.....BB......... Row 9-12: 하체 (L=다리)
....LLLL........
....L..L........
....L..L........
```

## 타일 에셋 규격

- 타일 크기: 16x16 픽셀
- 타일시트: 8열 x 4행 (128x64 픽셀)

### 타일 인덱스

| Index | 타일 | 색상 |
|-------|------|------|
| 0 | 바닥 (밝은) | #D4C8A8 |
| 1 | 바닥 (어두운) | #C4B898 |
| 2 | 벽 (상단) | #4A4A5A |
| 3 | 벽 (측면) | #3A3A4A |
| 4 | 책상 (상단면) | #8B7355 |
| 5 | 책상 (전면) | #6B5335 |
| 6 | 의자 | #4A6FA5 |
| 7 | 화분 | #2D8B46 |

## Canvas API 생성 예시

```typescript
function generateCharacterFrame(
  ctx: CanvasRenderingContext2D,
  palette: typeof PALETTES.claude,
  x: number,
  y: number,
  frameWidth: number,
  frameHeight: number,
) {
  // 외곽선
  ctx.fillStyle = palette.outline;
  // ... 픽셀 단위로 그리기

  // 머리
  ctx.fillStyle = palette.hair;
  ctx.fillRect(x + 4, y + 0, 8, 4);

  // 얼굴
  ctx.fillStyle = palette.skin;
  ctx.fillRect(x + 5, y + 2, 6, 4);

  // 몸통
  ctx.fillStyle = palette.body;
  ctx.fillRect(x + 4, y + 6, 8, 6);

  // 다리
  ctx.fillStyle = palette.accent;
  ctx.fillRect(x + 5, y + 12, 2, 4);
  ctx.fillRect(x + 9, y + 12, 2, 4);
}
```

## 출력 파일

- `public/assets/sprites/claude.png` — Claude 에이전트 스프라이트시트
- `public/assets/tiles/office-tiles.png` — 오피스 타일시트
