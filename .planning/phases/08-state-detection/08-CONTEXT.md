# Phase 8: State Detection - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

서버가 JSONL 스트림에서 턴 종료·권한 요청·백그라운드 에이전트 상태를 확정적으로 감지한다. 현재 서버는 기본 타임아웃(30s/60s/5m)만 사용 — turn_duration 파싱, permission 타이머, background agent 추적, text-idle 감지가 모두 새로 필요하다.

</domain>

<decisions>
## Implementation Decisions

### Permission 면제 도구
- **Pixel Agents 동일**: Task, Agent, AskUserQuestion 면제
- 나머지 도구(Read, Write, Edit, Bash, Grep, Glob 등)는 7초 무응답 시 permission 상태

### AgentStatus 확장 방식
- **별도 필드로 관리**: AgentState에 `permissionPending: boolean` 추가
- AgentStatus 유니온은 변경하지 않음 — 기존 애니메이션 시스템 영향 최소화
- permission은 시각적 overlay(말풍선) — 상태 자체가 아닌 메타데이터

### WebSocket 메시지 전달
- **기존 agent-update 확장**: AgentState에 permissionPending 필드 추가, agent-update로 전달
- 새 메시지 타입 불필요 — 클라이언트가 AgentState.permissionPending 변경을 감지

### turn_duration 처리
- parser.ts에서 `system` 타입 skip을 제거하고, `subtype: 'turn_duration'` 레코드 파싱
- turn_duration 수신 → 즉시 waiting 상태 + 모든 활성 타이머 취소
- Pixel Agents의 "확정적 턴 종료 신호" 패턴 적용

### Claude's Discretion
- 타이머 아키텍처 (setTimeout per agent vs 중앙 타이머 매니저)
- text-idle 5초 타이머의 정확한 구현 방식
- queue-operation 파싱 세부 구조
- background agent 추적 데이터 구조
- 기존 checkTimeouts() 5초 폴링과 새 타이머의 공존 방식

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 수정 대상 서버 코드
- `src/server/state-machine.ts` — AgentStateMachine: processEvent, deriveStatus, checkTimeouts (전면 확장 대상)
- `src/server/parser.ts` — parseJSONLLine: line 55에서 system 타입 skip 중 (수정 필요)
- `src/server/watcher.ts` — JSONLWatcher: 이벤트 발행 로직
- `src/server/index.ts` — 서버 진입점: StateMachine 이벤트 → WebSocket 브로드캐스트

### 수정 대상 공유 타입
- `src/shared/types.ts` — AgentState 인터페이스에 permissionPending 필드 추가

### 참조 구현 (Pixel Agents)
- `/tmp/pixel-agents/src/transcriptParser.ts` — turn_duration 처리 (lines 232-275), permission 타이머 (7초), text-idle (5초), background agent 추적 (queue-operation)
- `/tmp/pixel-agents/src/constants.ts` — PERMISSION_TIMER_DELAY_MS=7000, TEXT_IDLE_DELAY_MS=5000
- `/tmp/pixel-agents/src/types.ts` — AgentState: permissionSent, isWaiting, hadToolsInTurn, backgroundAgentToolIds

### 클라이언트 연동
- `src/client/hooks/useWebSocket.ts` — WebSocket 메시지 수신
- `src/client/hooks/useAgentState.ts` — AgentState 동기화

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AgentStateMachine`: processEvent/deriveStatus/checkTimeouts 프레임워크. 타이머 추가 시 확장 가능
- `parseJSONLLine`: assistant/user/tool_result 파싱 완성. system/progress 타입 추가만 하면 됨
- WebSocket 브로드캐스트: agent-update 이벤트 이미 동작 중 — AgentState 확장하면 자동 전파

### Established Patterns
- `processEvent()` → `deriveStatus()` → `emit('agent-update')` 체인
- `checkTimeouts()` 5초 폴링: WAITING_TIMEOUT(30s), IDLE_TIMEOUT(60s), DONE_TIMEOUT(5m)
- parser가 type별 분기 후 AgentEvent 반환

### Integration Points
- parser.ts:55 — `system` 타입 skip → turn_duration 파싱 추가 지점
- state-machine.ts:83-101 — processEvent() → 타이머 시작/취소 로직 추가 지점
- state-machine.ts:262-284 — checkTimeouts() → permission/text-idle 타이머와 공존 필요
- types.ts — AgentState 인터페이스 확장 (permissionPending)

### Key Differences from Pixel Agents
- Pixel Agents는 VS Code 확장 (Extension↔Webview 메시징). 우리는 WebSocket 기반
- Pixel Agents는 per-agent 타이머 (setTimeout). 우리도 같은 패턴 적용 예정
- Pixel Agents는 별도 timerManager.ts. 우리는 state-machine.ts 내부에서 관리 가능 (규모가 작으므로)

</code_context>

<specifics>
## Specific Ideas

- Pixel Agents의 transcriptParser.ts가 가장 중요한 참조 — turn_duration, permission 타이머, text-idle, background agent 패턴 모두 포함
- permission은 상태가 아니라 메타데이터 — 말풍선으로만 표시 (Phase 9에서 시각화)
- 기존 타임아웃(30s/60s/5m)은 새 타이머 시스템과 공존해야 함 — 폴백 역할

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-state-detection*
*Context gathered: 2026-03-30*
