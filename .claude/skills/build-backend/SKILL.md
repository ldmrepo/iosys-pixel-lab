---
name: build-backend
description: >
  Builds the Pixel Office Node.js backend server with JSONL file watching,
  Claude Code log parsing, agent state machine, and WebSocket real-time API.
  Triggers when server-side features need building or modification.
---

# Pixel Office Backend Builder

이 스킬은 Pixel Office의 백엔드 서버를 구축한다.

## Step 1: 세션 탐지 (`src/server/session-discovery.ts`)

Claude Code 세션을 자동으로 찾는다:

```
탐색 경로: ~/.claude/projects/
구조:
  ~/.claude/projects/{hash}/
    ├── .session.json
    └── sessions/
        └── {session-id}.jsonl
```

### 로직
1. `~/.claude/projects/` 스캔
2. 각 프로젝트 디렉토리의 `sessions/` 탐색
3. `.jsonl` 파일 수집
4. 최근 수정 시간 기준으로 활성/비활성 판단 (5분 이내 = 활성)
5. 주기적 재스캔 (10초 간격) — 새 세션 감지

### 출력
- 활성 세션 목록: `{ sessionId, projectPath, jsonlPath, lastModified }`

## Step 2: JSONL 파일 감시 (`src/server/watcher.ts`)

chokidar를 사용한 실시간 파일 감시:

### 로직
1. 활성 세션의 JSONL 파일 경로 수신
2. chokidar로 `change` 이벤트 감시
3. 파일 변경 시 마지막 읽은 위치 이후의 새 줄만 읽기 (tail 방식)
4. 새 줄을 `parser`에 전달
5. 세션 추가/제거 시 watcher 동적 추가/해제

### 주의사항
- 파일 오프셋 관리: 각 파일별 마지막 바이트 위치 기록
- 파일 truncation 감지: 파일 크기가 줄어들면 오프셋 리셋
- graceful shutdown: 프로세스 종료 시 모든 watcher 정리

## Step 3: 이벤트 파싱 (`src/server/parser.ts`)

JSONL 줄 → AgentEvent 변환:

### Claude Code JSONL 포맷 대응

```json
// assistant 메시지
{"type":"assistant","message":{"content":[{"type":"text","text":"..."}]},"timestamp":"2026-03-29T..."}

// tool 사용
{"type":"tool_use","name":"Read","input":{"file_path":"..."},"timestamp":"..."}
{"type":"tool_use","name":"Write","input":{"file_path":"...","content":"..."},"timestamp":"..."}
{"type":"tool_use","name":"Bash","input":{"command":"..."},"timestamp":"..."}

// tool 결과
{"type":"tool_result","content":"...","timestamp":"..."}

// user 메시지
{"type":"user","message":{"content":"..."},"timestamp":"..."}
```

### 파싱 로직
1. JSON.parse 시도 (실패 시 무시)
2. `type` 필드로 이벤트 종류 판별
3. `AgentEvent` 객체 생성:
   - `timestamp`: ISO → epoch ms 변환
   - `sessionId`: 파일명에서 추출
   - `type`: 원본 type 유지
   - `content`: tool 이름 또는 텍스트 요약 (최대 100자)

## Step 4: 상태 머신 (`src/server/state-machine.ts`)

AgentEvent → AgentStatus 변환:

### 상태 전이 규칙

| 이벤트 | → 상태 |
|--------|--------|
| `tool_use` name=Write/Edit | `typing` |
| `tool_use` name=Read/Glob/Grep | `reading` |
| `tool_use` name=Bash | `executing` |
| `tool_use` name=Agent | `executing` |
| `assistant` 텍스트 응답 | `typing` |
| `user` 메시지 수신 | 이전 상태 유지 (user가 응답했으므로) |
| 마지막 이벤트가 assistant이고 30초+ 무활동 | `waiting` |
| 60초+ 무활동 | `idle` |
| 세션 파일 5분+ 미변경 | `done` |

### 에이전트 이름 추출
- 세션 디렉토리 경로에서 프로젝트명 추출
- 형식: `Claude-{프로젝트명약어}-{번호}`
- 예: `Claude-pixel-1`, `Claude-api-2`

### 좌석 자동 배정
- 새 에이전트 감지 시 빈 좌석 자동 배정
- `OfficeLayout.seats` 에서 `assignedAgentId`가 없는 좌석 선택
- 에이전트 종료 시 좌석 해제

## Step 5: WebSocket 서버 (`src/server/index.ts`)

Express + ws 조합:

### 엔드포인트
- `GET /api/agents` — 현재 에이전트 목록 (REST)
- `GET /api/health` — 서버 상태
- `ws://localhost:3333/ws` — WebSocket 실시간 스트림

### WebSocket 프로토콜
```json
// 연결 시 전체 상태 전송
{ "type": "agent-update", "payload": [AgentState, ...] }

// 개별 에이전트 상태 변경
{ "type": "agent-update", "payload": AgentState }

// 새 에이전트 감지
{ "type": "agent-added", "payload": AgentState }

// 에이전트 세션 종료
{ "type": "agent-removed", "payload": AgentState }
```

### 서버 포트
- 기본: 3333
- 환경변수: `PIXEL_OFFICE_PORT`

## 품질 체크리스트

- [ ] `~/.claude/projects/` 없어도 서버가 정상 시작 (빈 목록)
- [ ] JSONL 파일 새 줄 추가 → WebSocket 메시지 전송 500ms 이내
- [ ] 5개 세션 동시 감시 가능
- [ ] 서버 재시작 시 기존 세션 자동 재탐지
- [ ] malformed JSON 줄은 무시 (크래시 없음)
- [ ] `src/shared/types.ts` 타입 엄격 준수
