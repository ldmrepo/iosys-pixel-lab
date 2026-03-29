# 픽셀 오피스 (Pixel Office / Pixel Agents) 리서치 보고서

> 작성일: 2026-03-29  
> 목적: AI 에이전트 시각화 도구 검토 및 IOSYS 도입 가능성 분석

---

## 목차

1. [개요](#1-개요)
2. [탄생 배경 — 해결하는 문제](#2-탄생-배경--해결하는-문제)
3. [동작 원리](#3-동작-원리)
4. [주요 프로젝트 비교](#4-주요-프로젝트-비교)
   - 4.1 [Pixel Agents (원본)](#41-pixel-agents-원본)
   - 4.2 [AgentRoom](#42-agentroom)
   - 4.3 [기타 파생 프로젝트](#43-기타-파생-프로젝트)
5. [에셋 — MetroCity (JIK-A-4)](#5-에셋--metrocity-jik-a-4)
6. [독립 서비스 구축 가능성](#6-독립-서비스-구축-가능성)
7. [직접 구축 방법](#7-직접-구축-방법)
   - 7.1 [Pixel Agents — VS Code 확장 설치](#71-pixel-agents--vs-code-확장-설치)
   - 7.2 [AgentRoom — 독립 데스크탑 앱 구축](#72-agentroom--독립-데스크탑-앱-구축)
8. [IOSYS 도입 관점 검토](#8-iosys-도입-관점-검토)
9. [참고 링크](#9-참고-링크)

---

## 1. 개요

**픽셀 오피스(Pixel Office)**는 AI 코딩 에이전트(Claude Code, Codex, Gemini 등)를 픽셀 아트 캐릭터로 시각화하여, 가상 오피스 공간에서 각 에이전트의 실시간 활동 상태를 한눈에 파악할 수 있게 해주는 도구입니다.

대표 프로젝트인 **Pixel Agents**는 VS Code 확장으로 시작되었으며, 이후 커뮤니티 포크를 통해 독립형 데스크탑 앱(**AgentRoom**), 독립형 웹앱(**pixel-agents-standalone**) 등으로 발전하고 있습니다.

| 항목 | 내용 |
|---|---|
| 원본 프로젝트 | Pixel Agents (pablodelucca) |
| 라이선스 | MIT (오픈소스) |
| 현재 형태 | VS Code 확장 / 독립 데스크탑 앱(파생) |
| 지원 에이전트 | Claude Code, Codex, Gemini CLI 등 |
| GitHub Stars | 3,600+ (원본 기준) |

---

## 2. 탄생 배경 — 해결하는 문제

Claude Code로 여러 AI 세션을 동시에 운영할 때 다음과 같은 UX 문제가 존재합니다.

- 각 터미널 탭에서 **무한히 흐르는 로그** 속에서 현재 상태 파악이 어려움
- 에이전트가 **사용자 입력을 대기** 중이어도 수 분~수 시간 동안 모르고 지나칠 수 있음
- 여러 에이전트가 동시에 실행될 때 **누가 무엇을 하는지** 직관적으로 알 수 없음

픽셀 오피스는 이 문제를 "에이전트마다 픽셀 아트 캐릭터를 부여하고, 행동에 따라 실시간 애니메이션"으로 해결합니다.

> 개발자의 비전: *"The Sims를 하는 것처럼 AI 에이전트를 관리하는 인터페이스"*

---

## 3. 동작 원리

픽셀 오피스는 Claude Code를 직접 수정하지 않는 **순수 관찰자(Silent Observer)** 방식으로 동작합니다.

```
Claude Code 실행
    │
    ▼
~/.claude/projects/ 에 JSONL 로그 파일 생성
(모든 행동을 타임스탬프와 함께 기록)
    │
    ▼
Pixel Agents / AgentRoom이 JSONL 파일 실시간 감시
(JS 폴링 또는 Rust notify crate)
    │
    ▼
캐릭터 상태 머신 업데이트
idle → walk → type / read / wait
    │
    ▼
Canvas 2D 게임 루프로 렌더링
(BFS 경로탐색 + 캐릭터 애니메이션)
```

### 캐릭터 상태별 애니메이션

| 에이전트 행동 | 캐릭터 애니메이션 |
|---|---|
| 코드 작성 중 | 책상에 앉아 타이핑 |
| 파일 검색 중 | 독서/탐색 모션 |
| 명령어 실행 중 | 활동적 동작 |
| 사용자 입력 대기 | 말풍선 표시 |
| 작업 완료 | 알림음 + 유휴 상태 |
| 서브 에이전트 생성 | 새 캐릭터 스폰 (부모와 연결선) |

---

## 4. 주요 프로젝트 비교

### 4.1 Pixel Agents (원본)

- **형태**: VS Code 확장 프로그램
- **개발자**: Pablo de Lucca (pablodelucca)
- **라이선스**: MIT
- **링크**: https://github.com/pablodelucca/pixel-agents

#### 주요 기능

- 1 Claude Code 터미널 = 1 픽셀 캐릭터
- 실시간 행동 기반 애니메이션
- 오피스 레이아웃 에디터 (최대 64×64 타일)
- 서브 에이전트 시각화 (Task tool 연동)
- 말풍선 / 소리 알림
- 캐릭터 6종 제공
- 퍼시스턴트 레이아웃 (VS Code 창 간 공유)

#### 기술 스택

```
Frontend : TypeScript + VS Code Webview API
Bundler  : esbuild
렌더링   : Canvas 2D (게임 루프)
경로탐색 : BFS (Breadth-First Search)
로그 감시: JS 폴링 방식 (JSONL 파일)
```

#### 한계

- VS Code에 종속 (독립 실행 불가)
- 에이전트-터미널 동기화가 간혹 어긋남
- 상태 감지가 휴리스틱 기반 (타이머/이벤트 추정)

---

### 4.2 AgentRoom

- **형태**: 독립 데스크탑 앱 (Tauri + Rust + React)
- **개발자**: liuyixin-louis (Lehigh University PhD)
- **라이선스**: 오픈소스
- **링크**: https://github.com/liuyixin-louis/agentroom

Pixel Agents의 게임 엔진을 포팅하여 VS Code 없이 독립 실행 가능한 데스크탑 앱으로 발전시킨 프로젝트입니다.

#### Pixel Agents 대비 추가 기능

| 기능 | Pixel Agents | AgentRoom |
|---|---|---|
| 실행 형태 | VS Code 확장 | **독립 데스크탑 앱** |
| 지원 에이전트 | Claude Code 중심 | Claude Code + Codex + **Gemini** |
| 파일 감시 | JS 폴링 | **Rust notify crate (실시간)** |
| 세션 검색 | ❌ | ✅ **CASS 검색엔진 (sub-10ms)** |
| 토큰 대시보드 | 기본 | ✅ **실시간 비용 추적** |
| AI 세션 태깅 | ❌ | ✅ **자동 요약 및 카테고리화** |
| 웹 모니터링 | ❌ | ✅ `localhost:3000` 대시보드 |
| 트랜스크립트 뷰어 | ❌ | ✅ 인앱 전체 대화 열람 |
| Work/Break 룸 | ❌ | ✅ 활동 중/유휴 공간 분리 |
| 터미널 포커스 | ❌ | ✅ 캐릭터 클릭 → 터미널 포커스 |

#### 기술 아키텍처

```
JSONL 파일 (Claude / Codex / Gemini)
    │
    ▼
Rust 파일 감시 (notify + tokio)
    │
    ▼
AgentStateManager (이벤트 중복 제거 + 상태 추적)
    │
    ▼
Tauri 이벤트 버스
    │
    ▼
React useAgentEvents hook
    │
    ▼
OfficeState → Canvas 2D 게임 엔진 렌더링
```

#### CASS 검색 엔진 구조

AgentRoom에는 **CASS (Coding Agent Session Search)** 라는 자체 검색 엔진이 내장되어 있습니다.

```
search-backend/
├── cass/               # 검색엔진 + 대화형 TUI
├── asupersync/         # 비동기 런타임
├── frankentui/         # 터미널 UI 프레임워크
├── frankensearch/      # 어휘/의미/퓨전 검색
├── franken_agent_detection/  # 에이전트 자동 감지 (11종)
└── toon_rust/          # 공통 유틸리티
```

```bash
# CASS 주요 명령어
cass index --full                          # 전체 인덱스 재구축
cass search "auth error"                   # 키워드 검색
cass search "rate limiting" --mode hybrid  # 어휘 + 의미 검색
cass timeline --since 7d                   # 최근 7일 활동
cass tui                                   # 대화형 터미널 UI
cass health --json                         # 인덱스 상태 확인
```

---

### 4.3 기타 파생 프로젝트

| 프로젝트 | 특징 |
|---|---|
| pixel-agents-standalone | VS Code 없이 동작하는 독립 웹앱 (rolandal) |
| pixel-agent-desk | Electron 기반 데스크탑 앱, 활동 히트맵 + 토큰 분석 포함 (Mgpixelart) |
| DigiSpace | 멀티 에이전트 픽셀 오케스트레이션 VS Code 확장 (byhdn) |
| Ctrl/Cubicles | 웹 대시보드 공유 기능 포함 VS Code 확장 |
| Claude Pixel Quest | Claude 에이전트를 채광/낚시/나무벌목 캐릭터로 시각화 |

---

## 5. 에셋 — MetroCity (JIK-A-4)

Pixel Agents 원본도 사용하는 픽셀 아트 에셋입니다.

- **링크**: https://jik-a-4.itch.io/metrocity
- **라이선스**: **CC0 1.0 Universal (퍼블릭 도메인)**

### CC0 라이선스 의미

| 항목 | 내용 |
|---|---|
| 상업적 이용 | ✅ 가능 |
| 수정 / 편집 | ✅ 가능 |
| 재배포 | ✅ 가능 |
| 크레딧 표기 | 선택사항 (권장) |
| AI 생성 여부 | ❌ 순수 수작업 |
| 가격 | 무료 (Pay what you want) |

### 포함 에셋

- **홈 에셋**: 타일, 침대, 안락의자, 주방 소품 등
- **병원 에셋**: 타일, 의료용 침대, 안락의자 등

### 관련 에셋 팩 (동일 작가)

| 팩 이름 | 용도 |
|---|---|
| MetroCity - Free Top Down Character Pack | 캐릭터 스프라이트 |
| MetroCity - Free Top Down Cars Pack | 자동차 |
| MetroCity - Free External Top Down Environment | 외부 환경 |

> **결론**: CC0 라이선스이므로 상업적 서비스, 내부 도구, 커스터마이징 등 제한 없이 활용 가능합니다.

---

## 6. 독립 서비스 구축 가능성

### 현황 요약

| 구분 | 상태 |
|---|---|
| 공식 Pixel Agents 독립 앱 | 로드맵에 있으나 **미출시** |
| AgentRoom (커뮤니티) | **Tauri 기반 독립 앱 — 현재 사용 가능** |
| pixel-agents-standalone | 독립 웹앱 — 초기 단계 |

### 독립 서비스화의 핵심 기술 제약

픽셀 오피스의 핵심은 **로컬 파일시스템 접근**입니다.

```
Claude Code → ~/.claude/projects/ → JSONL 로그 파일
```

이 로컬 파일을 실시간으로 감시하는 것이 핵심이므로, 웹 서비스로 완전히 분리하려면 **파일 감시 브릿지(WebSocket/HTTP API)**가 추가로 필요합니다.

### 자체 구축 시 필요 컴포넌트

| 레이어 | 기술 | 난이도 |
|---|---|---|
| 파일 감시 브릿지 | Node.js `fs.watch` + WebSocket 서버 | 낮음 |
| 렌더링 엔진 | Canvas 2D 게임 루프 (기존 코드 재활용) | 낮음 |
| 독립 앱 래핑 | Tauri (Rust) 또는 Electron | 중간 |
| 에이전트 연동 | JSONL 트랜스크립트 파싱 (기존 로직 재활용) | 낮음 |
| 검색 엔진 | CASS (AgentRoom 내장) 또는 자체 구현 | 높음 |

---

## 7. 직접 구축 방법

### 7.1 Pixel Agents — VS Code 확장 설치

#### 방법 1: VS Code Marketplace에서 설치 (권장)

1. VS Code 실행
2. 확장 탭 (`Ctrl+Shift+X`) → `pixel-agents` 검색
3. **Pixel Agents** (pablodelucca) 설치

또는 명령어:
```bash
code --install-extension pablodelucca.pixel-agents
```

#### 방법 2: 소스 빌드

```bash
git clone https://github.com/pablodelucca/pixel-agents.git
cd pixel-agents
npm install
cd webview-ui && npm install && cd ..
npm run build
# VS Code에서 F5 → Extension Development Host 실행
```

#### 사용 방법

1. VS Code 하단 패널에서 **Pixel Agents** 탭 열기
2. `+ Agent` 클릭 → 새 Claude Code 터미널 + 캐릭터 생성
3. Claude Code로 작업 시작 → 캐릭터 실시간 반응 확인
4. 캐릭터 클릭 후 좌석 클릭 → 자리 배치 변경
5. `Layout` 버튼 → 오피스 레이아웃 커스터마이징

#### 전제 조건

- VS Code 설치
- Claude Code 설치 (`npm install -g @anthropic-ai/claude-code`)

---

### 7.2 AgentRoom — 독립 데스크탑 앱 구축

#### 전제 조건

| 필수 항목 | 설치 방법 |
|---|---|
| Rust | https://rustup.rs |
| Node.js 18+ | https://nodejs.org (LTS) |
| macOS: Xcode CLI | `xcode-select --install` |
| Linux: webkit2gtk 등 | 아래 명령어 참조 |

---

#### macOS 전체 설치 순서

```bash
# 1. Rust 설치
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.zshrc

# 2. Xcode CLI 도구
xcode-select --install

# 3. Node.js (Homebrew 사용 시)
brew install node

# 4. 저장소 클론 (--recursive 필수: 서브모듈 포함)
git clone --recursive https://github.com/liuyixin-louis/agentroom.git
cd agentroom

# 5. CASS 검색엔진 빌드 (최초 1회, 약 5분 소요)
./scripts/install-cass.sh
source ~/.zshrc

# 6. 세션 인덱싱
cass index --full

# 7. 앱 의존성 설치 및 실행
npm install
npm run tauri dev
```

---

#### Linux (Ubuntu / Debian) 전체 설치 순서

```bash
# 1. 시스템 의존성 설치
sudo apt update && sudo apt install -y \
  build-essential curl wget git \
  libwebkit2gtk-4.1-dev libgtk-3-dev \
  libappindicator3-dev librsvg2-dev \
  patchelf libssl-dev

# 2. Rust 설치
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.bashrc

# 3. Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. 저장소 클론
git clone --recursive https://github.com/liuyixin-louis/agentroom.git
cd agentroom

# 5. CASS 빌드
./scripts/install-cass.sh
source ~/.bashrc

# 6. 세션 인덱싱
cass index --full

# 7. 실행
npm install
npm run tauri dev
```

---

#### Linux (Fedora / RHEL) 시스템 의존성

```bash
sudo dnf install -y \
  gcc gcc-c++ make curl wget git \
  webkit2gtk4.1-devel gtk3-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel openssl-devel
```

---

#### Windows (WSL2 환경)

AgentRoom은 Windows 네이티브 빌드를 공식 지원하지 않습니다.  
**WSL2 + Ubuntu** 환경에서 Linux 방식으로 구축하는 것을 권장합니다.

```bash
# WSL2 Ubuntu에서 Linux 설치 순서와 동일하게 진행
# GUI 앱 실행을 위해 WSLg 필요 (Windows 11 기본 포함)
# Windows 10의 경우 VcXsrv 등 X서버 별도 설치 필요
```

---

#### 개발 모드 vs 프로덕션 빌드

```bash
# 개발 모드 — 핫 리로드 지원
npm run tauri dev

# 프로덕션 빌드 — 배포용 바이너리 생성
npm run tauri build
# 결과물: src-tauri/target/release/bundle/
# macOS  : .app / .dmg
# Linux  : .deb / .AppImage
```

---

#### 주요 주의사항

| 항목 | 내용 |
|---|---|
| `--recursive` 클론 | 빠뜨리면 CASS 서브모듈 누락 → 검색 기능 불가 |
| CASS 빌드 시간 | Rust 최초 컴파일로 약 5분 소요 (이후 빠름) |
| `source ~/.zshrc` | PATH 적용 필수 — 빠뜨리면 `cass` 명령어 인식 불가 |
| Claude Code 필요 | `~/.claude/projects/` 경로에 JSONL 파일 존재해야 시각화 가능 |
| Claude Code 스킬 연동 | `skills/searching-agent-sessions` → `~/.claude/skills/` 복사 시 인앱 세션 검색 가능 |

---

#### Claude Code 스킬 연동 (선택)

AgentRoom은 Claude Code 스킬을 제공하여, 데스크탑 앱 없이도 Claude Code 대화 중 과거 세션을 자연어로 검색할 수 있습니다.

```bash
# 스킬 설치 (1회)
cp -r skills/searching-agent-sessions ~/.claude/skills/

# 이후 Claude Code 세션에서 자연어로 검색 가능
# 예: "authentication 관련 세션 찾아줘"
# 예: "rate limiting 관련 gemini 세션 보여줘"
```

---

## 8. IOSYS 도입 관점 검토

### 활용 시나리오

IOSYS에서 진행 중인 멀티 에이전트 프로젝트(수학 교육과정 지식그래프 4단계 파이프라인, QTI3 마이그레이션, 한국어 철자검사기 등)에서 여러 Claude Code 서브에이전트가 동시 실행될 때 활용 가능합니다.

| 시나리오 | 효과 |
|---|---|
| 4단계 AI 파이프라인 모니터링 | 각 단계 에이전트 상태 실시간 확인 |
| 병렬 서브에이전트 관리 | 어떤 에이전트가 대기/실행 중인지 시각화 |
| 토큰 비용 추적 | 프로젝트별 API 사용량 모니터링 |
| 세션 히스토리 검색 | 과거 작업 내용 빠른 검색 (CASS) |

### 도구 선택 기준

| 상황 | 권장 도구 |
|---|---|
| VS Code 안에서 간단히 확인 | **Pixel Agents** (VS Code 확장) |
| VS Code 없이 독립 모니터링 | **AgentRoom** (Tauri 데스크탑 앱) |
| 세션 히스토리 검색 필요 | **AgentRoom** |
| 팀 단위 공유 대시보드 필요 | **Ctrl/Cubicles** (웹 대시보드 포함) |
| 자체 커스터마이징 목적 | MIT 라이선스 — 포크 후 자유 수정 가능 |

### 에셋 활용 전략

MetroCity 에셋(CC0)을 활용하여 **IOSYS 브랜딩이 적용된 커스텀 오피스** 구성이 가능합니다.

- 오피스 타일셋: MetroCity Interior + MetroCity External 조합
- 캐릭터: MetroCity Character Pack (6종 기본 제공)
- 커스텀 스프라이트: 자체 제작 후 External Asset Directory로 로드 가능

---

## 9. 참고 링크

### 공식 프로젝트

| 프로젝트 | 링크 |
|---|---|
| Pixel Agents (원본) | https://github.com/pablodelucca/pixel-agents |
| Pixel Agents VS Code Marketplace | https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents |
| AgentRoom | https://github.com/liuyixin-louis/agentroom |
| pixel-agents-standalone | https://github.com/rolandal/pixel-agents-standalone |
| pixel-agent-desk (Electron) | https://github.com/Mgpixelart/pixel-agent-desk |

### 에셋

| 에셋 | 링크 |
|---|---|
| MetroCity Interior (CC0) | https://jik-a-4.itch.io/metrocity |
| MetroCity Character Pack (CC0) | https://jik-a-4.itch.io/metrocity-free-topdown-character-pack |
| MetroCity Cars Pack (CC0) | https://jik-a-4.itch.io/metrocity-free-top-down-cars-pack |
| MetroCity External Environment (CC0) | https://jik-a-4.itch.io/metro |

### 관련 기술 문서

| 항목 | 링크 |
|---|---|
| Tauri 공식 문서 | https://v2.tauri.app |
| Tauri 사전 요구사항 | https://v2.tauri.app/start/prerequisites/ |
| Rust 설치 | https://rustup.rs |
| Node.js 공식 사이트 | https://nodejs.org |

### 참고 기사

| 제목 | 링크 |
|---|---|
| Fast Company — Pixel Agents 소개 기사 | https://www.fastcompany.com/91497413/this-charming-pixel-art-game-solves-one-of-ai-codings-most-annoying-ux-problems |

---

*본 문서는 2026년 3월 29일 기준으로 작성되었습니다. 오픈소스 프로젝트의 특성상 내용이 빠르게 변경될 수 있으므로, 최신 정보는 각 GitHub 저장소를 직접 확인하시기 바랍니다.*