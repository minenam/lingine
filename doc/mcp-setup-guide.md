# Claude Code MCP 서버 설정 가이드

## 개요

Claude Code에서 외부 도구를 연결하는 MCP(Model Context Protocol) 서버 3종을 등록한다.
세 개 모두 **API 키 없이 무료**로 사용 가능하며, `--scope user`로 등록하여 모든 프로젝트에서 공유한다.

## 등록 명령어

```bash
# 1. Context7 — 라이브러리 공식 문서 실시간 검색
claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp

# 2. Grep App — GitHub 공개 저장소 코드 검색
claude mcp add --scope user --transport http grep-app https://mcp.grep.app

# 3. Exa Web Search — 웹 검색 (무료 플랜, rate limit 있음)
claude mcp add --scope user --transport http websearch https://mcp.exa.ai/mcp
```

## 서버 요약

| 이름      | 전송 방식 | 엔드포인트                    | 용도                                        |
| --------- | --------- | ----------------------------- | ------------------------------------------- |
| context7  | stdio     | `@upstash/context7-mcp` (npx) | React, Next.js 등 라이브러리 최신 문서 조회 |
| grep-app  | http      | `https://mcp.grep.app`        | 수백만 GitHub 저장소에서 코드 패턴 검색     |
| websearch | http      | `https://mcp.exa.ai/mcp`      | 일반 웹 검색 (Exa AI 기반)                  |

## 관리 명령어

```bash
claude mcp list            # 등록된 서버 목록 확인
claude mcp get <이름>       # 특정 서버 상세 정보
claude mcp remove <이름>    # 서버 제거
```

Claude Code 세션 내에서 `/mcp` 입력 시 연결 상태를 확인할 수 있다.

## 설정 파일 위치

- **user scope** → `~/.claude.json`의 최상위 `mcpServers` 필드 (모든 프로젝트 공통)
- **project scope** → `~/.claude.json`의 `projects.<경로>.mcpServers` (특정 프로젝트만)
- **team 공유** → 프로젝트 루트 `.mcp.json` (git 커밋하여 팀원과 공유)

## 참고

- stdio 서버(context7)는 Node.js 런타임 필요 (`npx` 사용)
- http 서버(grep-app, websearch)는 원격 호스팅이므로 별도 설치 불필요
- Exa 무료 플랜은 rate limit 존재 — 고빈도 사용 시 [exa.ai](https://exa.ai)에서 API 키 발급 후 `--env EXA_API_KEY=<key>` 추가
