# Claude Code JSONL 로그 포맷 참조

## 파일 위치

```
~/.claude/projects/{project-path-hash}/
├── .session.json          ← 세션 메타 정보
└── sessions/
    └── {session-id}.jsonl ← 대화 로그 (이 파일을 감시)
```

### project-path-hash
프로젝트 경로를 해시한 디렉토리명. 예:
- `/Users/ldm/work/my-project` → `-Users-ldm-work-my-project`

## JSONL 줄 구조

각 줄은 독립적인 JSON 객체. 줄바꿈(\n)으로 구분.

### 메시지 타입별 구조

#### 1. assistant 메시지 (AI 응답)
```json
{
  "type": "assistant",
  "message": {
    "id": "msg_...",
    "type": "message",
    "role": "assistant",
    "content": [
      { "type": "text", "text": "파일을 읽어보겠습니다." }
    ],
    "model": "claude-sonnet-4-20250514",
    "usage": { "input_tokens": 1234, "output_tokens": 567 }
  },
  "timestamp": "2026-03-29T12:00:00.000Z"
}
```

#### 2. tool_use (도구 호출)
```json
{
  "type": "tool_use",
  "name": "Read",
  "input": { "file_path": "/path/to/file.ts" },
  "tool_use_id": "toolu_...",
  "timestamp": "2026-03-29T12:00:01.000Z"
}
```

주요 도구 이름:
- `Read` — 파일 읽기
- `Write` — 파일 쓰기
- `Edit` — 파일 수정
- `Bash` — 명령 실행
- `Glob` — 파일 검색
- `Grep` — 내용 검색
- `Agent` — 서브 에이전트 생성

#### 3. tool_result (도구 결과)
```json
{
  "type": "tool_result",
  "tool_use_id": "toolu_...",
  "content": "파일 내용...",
  "timestamp": "2026-03-29T12:00:02.000Z"
}
```

#### 4. user 메시지
```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": "이 파일을 수정해줘"
  },
  "timestamp": "2026-03-29T12:00:03.000Z"
}
```

## 상태 추론 규칙

| JSONL 이벤트 | 추론 상태 |
|-------------|-----------|
| `tool_use` + name=Write/Edit | `typing` (코드 작성 중) |
| `tool_use` + name=Read/Glob/Grep | `reading` (파일 탐색 중) |
| `tool_use` + name=Bash | `executing` (명령 실행 중) |
| `tool_use` + name=Agent | `executing` (서브에이전트 생성) |
| `assistant` + text content | `typing` (사고/응답 중) |
| 마지막 assistant 이후 30초+ | `waiting` (사용자 입력 대기) |
| 60초+ 무활동 | `idle` |
| 5분+ 파일 미변경 | `done` (세션 종료 추정) |

## 주의사항

- JSONL 파일은 append-only (줄 추가만 됨)
- 한 줄이 매우 길 수 있음 (tool_result에 파일 전체 내용 포함 가능)
- 인코딩: UTF-8
- 세션 중간에 malformed 줄이 올 수 있음 (무시해야 함)
