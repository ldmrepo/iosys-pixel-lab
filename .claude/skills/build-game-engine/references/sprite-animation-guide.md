# 스프라이트 애니메이션 가이드

## 스프라이트시트 구조

### 프로그래매틱 스프라이트 (기본)

캐릭터 크기: 16x24 픽셀
스프라이트시트: 4열 x 7행 = 28프레임

```
Row 0: idle     [frame0, frame1, -, -]
Row 1: typing   [frame0, frame1, frame2, frame3]
Row 2: reading  [frame0, frame1, -, -]
Row 3: executing[frame0, frame1, frame2, frame3]
Row 4: waiting  [frame0, frame1, -, -]
Row 5: done     [frame0, frame1, -, -]
Row 6: error    [frame0, frame1, -, -]
```

### 프레임 인덱스 계산

```typescript
const columns = 4;
const frameIndex = row * columns + col;

// idle frame 0 = 0 * 4 + 0 = 0
// idle frame 1 = 0 * 4 + 1 = 1
// typing frame 0 = 1 * 4 + 0 = 4
// typing frame 3 = 1 * 4 + 3 = 7
```

## 애니메이션 정의

```typescript
const animations: Record<AgentStatus, SpriteAnimation> = {
  idle:      { frames: [0, 1],        fps: 2,  loop: true },
  typing:    { frames: [4, 5, 6, 7],  fps: 8,  loop: true },
  reading:   { frames: [8, 9],        fps: 3,  loop: true },
  executing: { frames: [12, 13, 14, 15], fps: 6, loop: true },
  waiting:   { frames: [16, 17],      fps: 2,  loop: true },
  done:      { frames: [20, 21],      fps: 1,  loop: true },
  error:     { frames: [24, 25],      fps: 4,  loop: true },
};
```

## 애니메이션 업데이트 로직

```typescript
class AnimationPlayer {
  private animation: SpriteAnimation;
  private timer: number = 0;
  private frameIndex: number = 0;

  update(dt: number): number {
    this.timer += dt;
    const frameDuration = 1 / this.animation.fps;

    if (this.timer >= frameDuration) {
      this.timer -= frameDuration;
      this.frameIndex++;

      if (this.frameIndex >= this.animation.frames.length) {
        this.frameIndex = this.animation.loop ? 0 : this.animation.frames.length - 1;
      }
    }

    return this.animation.frames[this.frameIndex];
  }
}
```

## 말풍선 렌더링

캐릭터 위에 표시되는 상태 인디케이터:

### waiting 말풍선
```
  ┌───┐
  │ ? │  ← 노란색 배경, 검은 텍스트
  └─┬─┘
    │    ← 삼각형 꼬리
  [캐릭터]
```

### error 말풍선
```
  ┌───┐
  │ ! │  ← 빨간색 배경, 흰 텍스트
  └─┬─┘
    │
  [캐릭터]
```

### 말풍선 애니메이션
- 바운스: `y_offset = Math.sin(time * 3) * 2`
- waiting: 부드러운 바운스
- error: 빠른 깜빡임 (투명도 토글)

## 이름 라벨 렌더링

```typescript
function drawNameLabel(ctx: CanvasRenderingContext2D, name: string, x: number, y: number) {
  ctx.font = '8px monospace';
  const metrics = ctx.measureText(name);
  const padding = 2;

  // 배경
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(
    x - metrics.width / 2 - padding,
    y - 10 - padding,
    metrics.width + padding * 2,
    10 + padding
  );

  // 텍스트
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y - 2);
}
```

## 이동 보간 (Lerp)

캐릭터가 좌석으로 이동할 때:

```typescript
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(t, 1);
}

// 타일 단위 이동: 초당 3타일
const MOVE_SPEED = 3; // tiles per second
const progress = elapsedTime * MOVE_SPEED / pathLength;
```
