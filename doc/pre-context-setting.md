# 5분 컨텍스트 설정 가이드

기존 Notion 문서와 ChatGPT, Gemini 대화 내역을 Claude Code/OpenCode 환경으로 가져와서 개발 컨텍스트를 동기화한다.

---

## 1. Notion MCP 서버 설정 (환경변수 관리)

API 키를 코드에 직접 노출하지 않고 `.env` 파일로 안전하게 관리한다.

### Step 1: `.env` 파일 생성
프로젝트 루트에 `.env` 파일을 생성하고 API 키를 추가한다.

```bash
# .env 파일 생성
NOTION_API_KEY=ntn_your_api_key_here
```

### Step 2: `.gitignore`에 `.env` 추가
`.env` 파일이 버전 관리에 포함되지 않도록 설정한다.

```bash
# .gitignore에 추가
.env
```

### Step 3: `.env.example` 템플릿 생성
팀원이나 새로운 환경에서 참고할 수 있도록 템플릿을 제공한다.

```bash
# .env.example (버전 관리 대상)
NOTION_API_KEY=your_notion_api_key_here
```

### Step 4: .mcp.json 설정
OpenCode 설정 파일에 아래 내용을 추가한다. `env` 필드는 `.env` 파일의 변수를 사용한다.

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-notion"],
      "env": {
        "NOTION_API_KEY": "${NOTION_API_KEY}"
      }
    }
  }
}
```

- [ ] Notion Integration 생성 및 내부 통합 토큰 확보 완료
- [ ] 데이터베이스/페이지에 '연결 추가'로 권한 부여 완료
- [ ] `.env` 파일 생성 완료
- [ ] `.gitignore`에 `.env` 추가 완료


## 2. ChatGPT 대화 내역 가져오기

가장 빠르고 정확한 방법인 **공유 링크** 방식을 사용한다.

1. ChatGPT 대화창 우측 상단의 'Share' 버튼 클릭.
2. 'Create link' 클릭 후 URL 복사.
3. OpenCode에게 아래 명령과 함께 링크 전달.

```text
아래 ChatGPT 대화 내역을 읽고 핵심 요구사항을 요약해줘.
URL: https://chatgpt.com/share/xxxx-xxxx
```

- [ ] 공유 링크 생성 완료
- [ ] `webfetch` 툴로 링크 내용 읽기 확인

---

## 3. Gemini 대화 내역 가져오기

Gemini는 대화 내역을 파일로 저장하여 로컬 컨텍스트로 활용한다.

### 방법: 수동 복사 및 파일 저장
1. Gemini 대화 내용을 전체 선택하여 복사한다.
2. 프로젝트 내 `./temp/gemini-context.md` 파일을 생성하고 붙여넣는다.
3. OpenCode에게 해당 파일을 읽으라고 지시한다.

```bash
# 파일 생성 예시
mkdir -p temp
# 복사한 내용을 붙여넣어 저장한다.
```

- [ ] `./temp/gemini-context.md` 생성 완료
- [ ] 파일 내에 주요 대화 맥락 포함 확인

---

## 4. 최종 체크리스트

- [ ] Notion MCP가 정상 작동하여 페이지 목록을 불러오는가? (`ls` 툴 사용)
- [ ] 환경변수에 실제 API 키가 노출되지 않았는가?
- [ ] ChatGPT 공유 링크가 외부 접근 가능한 상태인가?
- [ ] 로컬에 저장한 Gemini 내역이 최신인가?
