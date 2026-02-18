---
description: main 대비 현재 브랜치 커밋을 분석하여 PR 생성
allowed-tools: Bash(git log *), Bash(git diff *), Bash(git branch *), Bash(git fetch *), Bash(git push *), Bash(git status *), Bash(gh pr create *), Bash(gh pr view *), Bash(gh pr list *)
---

# PR 템플릿 생성

## 참고 파일

@.github/pull_request_template.md

## 현재 컨텍스트

현재 브랜치: !`git branch --show-current`

remote main 최신화:
!`git fetch origin main --quiet 2>&1 || echo "fetch 실패 (오프라인 또는 권한 없음)"`

origin/main 대비 커밋 목록:
!`git log origin/main..HEAD --oneline`

커밋 상세 (type, scope, 메시지):
!`git log origin/main..HEAD --pretty=format:"%s"`

변경 파일 목록:
!`git diff origin/main...HEAD --name-only`

원격 브랜치 push 여부:
!`git status -sb | head -2`

---

## 수행할 작업

위 커밋 목록과 변경 파일을 분석하여 아래 형식으로 PR 제목과 본문을 출력한다.

### PR 제목 작성 규칙

- 전체 변경사항을 대표하는 단 하나의 conventional commit 형식
- 형식: `<type>(<scope>): <Description>` — scope가 단일이면 포함, 여러 개면 생략
- Description: 한국어, 마침표 없음, 변경사항 전체를 간결하게 요약
- type: 커밋들 중 가장 비중이 높은 type으로 결정

### PR 본문 작성 규칙

위에서 참조한 `.github/pull_request_template.md` 구조를 그대로 사용하되, 실제 변경사항만 채워서 작성한다.

**Summary**:

- 이번 PR에서 무엇을 했는지 2-3줄로 설명
- 구현한 기능, 해결한 문제, 주요 변경사항 위주로 작성
- 한국어 문장

**Type of Change**:

- 커밋 목록에서 실제로 사용된 type만 남기고 나머지는 삭제
- 각 type 옆에 괄호로 해당 변경의 구체적 내용을 한국어로 추가
- 예: `- feat: FR-01 인증 API 및 로그인 페이지 구현`

**Scope**:

- 커밋의 scope와 변경 파일 경로를 기반으로 실제 영향받은 scope만 남김
- 프로젝트 컨벤션 scope: `auth`, `dashboard`, `dictation`, `review`, `settings`, `api`, `db`, `deps`
- 해당 없으면 `docs`, `config` 등 의미 있는 값 사용

**Notes**:

- 리뷰어가 알아야 할 특이사항, 주의점, 테스트 방법 등이 있으면 작성
- 없으면 섹션 자체를 제거

### 출력 형식

```
**PR 제목**
<제목>

**PR 본문**
<본문>
```

### PR 생성

PR 제목과 본문을 출력한 뒤 아래 순서로 진행한다.

1. **원격 브랜치 확인**: `git status -sb` 결과에 `origin/`이 없거나 ahead 상태면 `git push -u origin <브랜치명>`을 실행한다.
2. **사용자 확인**: 위 내용으로 GitHub PR을 생성할지 사용자에게 확인한다.
3. **PR 생성**: 승인 시 아래 형식으로 PR을 생성한다.

```bash
gh pr create --base main \
  --title "<PR 제목>" \
  --body "$(cat <<'EOF'
<PR 본문>
EOF
)"
```

4. **결과 출력**: 생성된 PR URL을 출력한다.
