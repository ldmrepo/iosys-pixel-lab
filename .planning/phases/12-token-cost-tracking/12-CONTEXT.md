# Phase 12: Token & Cost Tracking - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

서버가 JSONL turn_duration 엔트리에서 토큰 사용량을 누적·중복제거하여 USD 비용으로 변환하고, 에이전트 카드에 실시간 표시한다. Phase 8에서 turn_duration 파싱 인프라가 구축되었으므로, usage 필드 추출 + 누적 + pricing + UI 표시가 핵심.

</domain>

<decisions>
## Implementation Decisions

### 비용 표시 포맷
- **USD + 토큰 요약**: `$0.42 · 12.3K tokens` 형태
- 비용이 먼저, 토큰은 요약된 수치 (K 단위)
- Phase 11에서 확보한 `.agent-card-token-placeholder` div에 렌더

### 모델 가격 테이블
- **하드코드 테이블**: `pricing.ts`에 Claude 모델별 단가 하드코딩
- 지원 모델: claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5 (+ 이전 버전)
- 가격 변경 시 수동 업데이트 (설정 파일 불필요)

### 토큰 데이터 소스 (prior decision)
- **JSONL `system/turn_duration` 엔트리의 usage 필드** (streaming assistant 엔트리 불사용)
- `costUSD` JSONL 필드 사용 금지 (v1.0.9 이후 삭제)
- Phase 8에서 turn_end 이벤트 파싱 이미 구현 — usage 필드 추출만 추가

### 중복제거 (prior decision)
- **message.id 기반**: per-session `Set<string>`으로 이미 처리한 메시지 추적
- turn_end마다 Set 리셋 불필요 (누적 추적이므로)

### AgentState 확장 (prior decision)
- `tokenUsage?: TokenUsage` 옵셔널 필드
- TokenUsage: inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens, costUSD
- 기존 agent-update WebSocket으로 자동 전달

### Claude's Discretion
- turn_duration 엔트리의 정확한 usage JSON 경로 (raw.usage vs raw.message.usage)
- K/M 단위 변환 임계치 (1000 이상 → K, 1M 이상 → M)
- 에이전트 카드 내 토큰/비용 배치 위치
- 알 수 없는 모델의 폴백 가격 처리

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 수정 대상 서버 코드
- `src/server/state-machine.ts` — processEvent, turn_end 핸들러 (usage 누적 추가)
- `src/server/parser.ts` — parseJSONLLine (turn_duration usage 추출 추가)
- `src/shared/types.ts` — AgentState.tokenUsage 필드 추가, TokenUsage 인터페이스 정의

### 수정 대상 클라이언트 코드
- `src/client/components/AgentPanel.tsx` — `.agent-card-token-placeholder`를 실제 비용 표시로 교체
- `src/client/styles/index.css` — 토큰/비용 표시 스타일

### Phase 8 인프라
- `src/server/state-machine.ts` — turn_end 이벤트 핸들러 (lines 121-128): 여기에 usage 누적 추가
- `src/server/parser.ts` — system/turn_duration 파싱 (lines 65-70): raw.usage 접근 지점

### 리서치
- `.planning/research/STACK.md` — JSONL input_tokens 100~174x 과소산정 분석
- `.planning/research/FEATURES.md` — token tracking pipeline 설계
- `.planning/research/ARCHITECTURE.md` — 서버→클라이언트 데이터 흐름

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `turn_end` 핸들러: Phase 8에서 구현. 즉시 waiting 설정 + 타이머 취소. usage 누적 로직 추가 지점
- `AgentPanel.tsx`: Phase 11에서 enriched cards 구현. `.agent-card-token-placeholder` div 대기 중
- `AgentState.lastUpdated`: 서버→클라이언트 자동 전파 패턴 — tokenUsage도 동일 경로

### Established Patterns
- 서버 side: processEvent → deriveStatus/turn_end → emit('agent-update') → WebSocket
- 클라이언트 side: useWebSocket → useAgentState → AgentPanel render
- 타입 확장: orchestrator only (types.ts)

### Integration Points
- parser.ts: turn_duration raw 객체에서 usage 추출 → AgentEvent에 포함
- state-machine.ts: turn_end 핸들러에서 usage → agent.tokenUsage 누적
- AgentPanel.tsx: agent.tokenUsage → formatCost/formatTokens 표시

</code_context>

<specifics>
## Specific Ideas

- ccusage 프로젝트 참조 — JSONL 토큰 누적 패턴
- input_tokens 부정확 알림: UI에 "approximate" 표시 또는 tooltip으로 설명
- 브라우저 재접속 시 서버 상태 기반으로 누적값 유지 (서버가 source of truth)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-token-cost-tracking*
*Context gathered: 2026-03-30*
