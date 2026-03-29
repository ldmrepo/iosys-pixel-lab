# Pixel Office UI 디자인 스펙

## 컬러 팔레트 (다크 테마)

```css
:root {
  /* 배경 */
  --bg-primary: #1a1a2e;      /* 메인 배경 */
  --bg-secondary: #16213e;     /* 패널 배경 */
  --bg-tertiary: #0f3460;      /* 카드/호버 배경 */
  --bg-elevated: #1e2a4a;      /* 높은 레벨 배경 */

  /* 텍스트 */
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0b0;
  --text-muted: #6a6a7a;

  /* 상태 색상 */
  --status-typing: #22C55E;     /* 녹색 */
  --status-reading: #3B82F6;    /* 파랑 */
  --status-executing: #8B5CF6;  /* 보라 */
  --status-waiting: #F97316;    /* 주황 */
  --status-idle: #6B7280;       /* 회색 */
  --status-done: #06B6D4;       /* 하늘색 */
  --status-error: #EF4444;      /* 빨강 */

  /* 액센트 */
  --accent: #8B5CF6;
  --accent-hover: #A78BFA;

  /* 보더 */
  --border: #2a2a4e;
  --border-active: #8B5CF6;
}
```

## 타이포그래피

```css
body {
  font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
}

h1, h2, h3 { font-weight: 600; }
.label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
.mono { font-family: 'Courier New', monospace; }
```

## 레이아웃 규격

```
┌────────────────────────────────────────────────┐
│ Header                                   48px  │
├──────────────────────────┬─────────────────────┤
│                          │                     │
│  OfficeCanvas            │  AgentPanel         │
│  (flex: 1)               │  (width: 280px)     │
│                          │                     │
│  min-width: 400px        │  overflow-y: auto   │
│                          │                     │
├──────────────────────────┴─────────────────────┤
│ StatusBar                                32px  │
└────────────────────────────────────────────────┘

전체 최소 너비: 800px
전체 높이: 100vh
```

## 컴포넌트 상세

### Header (48px)
- 좌: 로고 텍스트 "Pixel Office" (16px, bold)
- 우: 설정 아이콘 버튼 (향후 확장용)
- 배경: var(--bg-secondary)
- 하단 보더: 1px solid var(--border)

### AgentPanel (280px)
- 배경: var(--bg-secondary)
- 좌측 보더: 1px solid var(--border)
- 패딩: 12px
- 스크롤: overflow-y auto (에이전트가 많을 때)

### AgentCard
```
┌───────────────────────────┐
│ ● Claude-pixel-1          │  ← 상태 dot + 이름
│ typing                    │  ← 상태 텍스트 (상태 색상)
│ Writing to App.tsx        │  ← 마지막 행동 (muted)
│ 2s ago                    │  ← 시간 (muted)
└───────────────────────────┘

크기: 100% x auto
패딩: 10px 12px
마진: 0 0 8px 0
배경: var(--bg-tertiary)
보더: 1px solid var(--border)
보더-레디우스: 6px
커서: pointer
호버: border-color → var(--border-active)
```

상태 dot:
- 크기: 8px 원
- 색상: 해당 상태 색상
- `waiting`, `error`: CSS animation pulse

### StatusBar (32px)
```
● Connected  │  Agents: 3  │  12:34:56

배경: var(--bg-secondary)
상단 보더: 1px solid var(--border)
패딩: 0 16px
폰트: 12px
```

연결 상태:
- Connected: 녹색 dot + "Connected"
- Disconnected: 빨간 dot + "Disconnected"
- Reconnecting: 주황 dot + "Reconnecting..."

### Tooltip (캐릭터 클릭 시)
```
┌─────────────────────┐
│ Claude-pixel-1      │
│ Status: typing      │
│ Action: Write App.tsx│
│ Session: abc-123    │
│ Since: 10:30:45     │
└─────────────────────┘

위치: 클릭 좌표 기준 상단
배경: var(--bg-elevated)
보더: 1px solid var(--accent)
보더-레디우스: 4px
패딩: 8px 12px
z-index: 100
```

## 반응형 대응

```css
/* 800px 이하: 패널 하단으로 이동 */
@media (max-width: 800px) {
  .main-layout {
    flex-direction: column;
  }
  .agent-panel {
    width: 100%;
    height: 200px;
    border-left: none;
    border-top: 1px solid var(--border);
  }
}
```

## 애니메이션

```css
/* 상태 펄스 (waiting, error) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-dot--waiting,
.status-dot--error {
  animation: pulse 1.5s ease-in-out infinite;
}

/* 카드 진입 */
@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.agent-card--entering {
  animation: slideIn 0.3s ease-out;
}
```
