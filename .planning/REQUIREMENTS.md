# Requirements: Pixel Office

**Defined:** 2026-03-30
**Core Value:** AI 코딩 에이전트의 실시간 활동 상태를 픽셀 아트 캐릭터로 직관적으로 시각화

## v1.2 Requirements

Requirements for Dashboard & Polish milestone. Each maps to roadmap phases.

### Dashboard UI

- [x] **DASH-01**: 사이드 패널에 에이전트별 현재 상태와 활성 도구가 표시된다
- [x] **DASH-02**: 서브에이전트가 부모 아래 계층적으로 들여쓰기 표시된다
- [x] **DASH-03**: 에이전트별 세션 지속시간이 실시간으로 표시된다
- [x] **DASH-04**: 에이전트별 토큰 사용량과 예상 비용이 요약 표시된다
- [x] **DASH-05**: Canvas와 사이드 패널이 3열 레이아웃으로 공존하며 Canvas 크기가 안정적이다

### Token Tracking

- [x] **TOKEN-01**: JSONL assistant 엔트리의 message.usage 필드가 파싱되어 에이전트별로 누적된다
- [x] **TOKEN-02**: message.id 기반 중복제거로 병렬 도구 호출 시 이중 카운팅을 방지한다
- [x] **TOKEN-03**: 모델별 토큰 단가가 적용되어 USD 비용이 계산된다
- [x] **TOKEN-04**: 토큰/비용 데이터가 AgentState에 포함되어 WebSocket으로 클라이언트에 전달된다

### Asset Replacement

- [x] **ASSET-01**: PixelOffice 에셋팩의 스프라이트 좌표가 측정되어 asset-manifest.ts에 등록된다
- [ ] **ASSET-02**: 기존 MetroCity 가구가 PixelOffice 오피스 가구로 교체된다 (데스크, 의자, 소파 등)
- [x] **ASSET-03**: Pixel Life 소품이 회의실/작업공간에 보조 배치된다 (화이트보드, 차트 등)
- [ ] **ASSET-04**: office-layout.ts가 새 에셋에 맞게 재설계된다
- [ ] **ASSET-05**: 교체 후 기존 엔진(FSM/BFS/말풍선/서브에이전트)이 정상 동작한다

## v2 Requirements

Deferred to future release.

### Advanced Monitoring

- **ADV-01**: 세션 히스토리 브라우저 (과거 세션 검색/열람)
- **ADV-02**: 실시간 예산 알림 (임계치 초과 시 경고)
- **ADV-03**: Anthropic Console API 연동 (정확한 빌링 데이터)

### Layout Editor

- **EDIT-01**: 드래그 앤 드롭 가구 배치
- **EDIT-02**: 타일 타입 변경 (floor/wall/void)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Tauri/Electron 래핑 | 웹앱으로 충분 |
| CASS 검색 엔진 | AgentRoom 전용 |
| VS Code 확장 | 독립 웹앱 유지 |
| OAuth/인증 | 로컬 전용 도구 |
| Anthropic API 직접 호출 | 관찰자 원칙 (JSONL 읽기만) |
| office_assets_release 실사용 | 8px 스케일 호환 불확실, 참조만 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01 | Phase 11 | Complete |
| DASH-02 | Phase 11 | Complete |
| DASH-03 | Phase 11 | Complete |
| DASH-04 | Phase 12 | Complete |
| DASH-05 | Phase 11 | Complete |
| TOKEN-01 | Phase 12 | Complete |
| TOKEN-02 | Phase 12 | Complete |
| TOKEN-03 | Phase 12 | Complete |
| TOKEN-04 | Phase 12 | Complete |
| ASSET-01 | Phase 13 | Complete |
| ASSET-02 | Phase 13 | Pending |
| ASSET-03 | Phase 13 | Complete |
| ASSET-04 | Phase 13 | Pending |
| ASSET-05 | Phase 13 | Pending |

**Coverage:**
- v1.2 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after roadmap creation (v1.2)*
