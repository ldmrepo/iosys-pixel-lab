# Pixel Office — PROJECT

## Overview
AI 코딩 에이전트(Claude Code)를 픽셀 아트 캐릭터로 시각화하는 독립형 웹 앱.
JSONL 로그 감시 → 상태 머신 → WebSocket → Canvas 2D 렌더링 파이프라인.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express 5 + ws (WebSocket)
- **Rendering**: Canvas 2D (pure API, no external game libraries)
- **File Watch**: chokidar
- **Assets**: MetroCity CC0 pixel art

## Current State (pre-milestone)
- 20×15 tile office (320×240px), 2 desk pods + lounge
- 16 seats, 10 furniture types
- 3 character sprites (claude/codex/gemini, 32×32, 7 animation states)
- MetroCity Home/Hospital assets partially used (15/24 sheets)
- Known engine bugs: RAF leak, race conditions, missing walkableMasks

## Milestones

### v1.0 — Office Space Rebuild (current)
**Goal**: MetroCity 에셋을 체계적으로 활용하여 AI 에이전트 가상 사무실 공간 재구축
**Approach**: 기존 MetroCity CC0 에셋 활용 (외부 API/생성 도구 없음)
**Scope**:
- 30×24 확장 그리드 (6개 존: 서버룸/작업A/작업B/회의실/라운지/로비)
- 미사용 에셋 전량 활용 (Beds1→서버랙, DoorsHospital→유리문 등)
- TileMap 엔진 존 컬러 시스템 개선
- 전체 가구 walkableMask 보완
