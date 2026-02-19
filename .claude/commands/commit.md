---
description: staged 변경사항을 분석하여 컨벤션에 맞는 커밋 메시지 생성 후 커밋
allowed-tools: Bash(git diff *), Bash(git status *), Bash(git log *), Bash(git commit *)
---

# 커밋 메시지 자동 생성

## 참고 파일

@doc/conventions.md
@commitlint.config.cjs

## 현재 컨텍스트

Staged 변경사항 (diff):
!`git diff --staged`

Staged 파일 목록:
!`git diff --staged --name-only`

Unstaged / Untracked 현황:
!`git status -s`

최근 커밋 3개 (스타일 참고):
!`git log --oneline -3`

---

## 수행할 작업

위 staged 변경사항을 분석하여 아래 규칙에 따라 커밋 메시지를 생성한다.

### 커밋 메시지 작성 규칙

**형식**

```
<type>(<scope>): <Description>
```

**type** — 아래 중 변경 성격에 가장 맞는 하나를 선택한다:

| type       | 용도                         |
| ---------- | ---------------------------- |
| `feat`     | 새 기능                      |
| `fix`      | 버그 수정                    |
| `docs`     | 문서 변경                    |
| `style`    | 포맷팅 (코드 동작 변경 없음) |
| `refactor` | 리팩토링                     |
| `test`     | 테스트 추가/수정             |
| `chore`    | 빌드, 설정, 의존성 등        |

**scope** — 아래 중 영향받는 도메인에 맞는 것 선택 (선택 사항, 복수면 생략):

`auth`, `dashboard`, `dictation`, `review`, `settings`, `api`, `db`, `deps`

**Description 규칙**:

- 영문: 대문자 시작, 마침표 없음
- 한국어: 사용 가능, 마침표 없음
- 변경의 "무엇"이 아닌 "의도/목적"을 간결하게
- 최대 100자 (header 전체 기준)

### staged 파일이 없는 경우

`git diff --staged --name-only` 결과가 비어있으면 아래 메시지만 출력하고 종료한다:

```
staged 파일이 없습니다. git add 후 다시 실행하세요.
```

### 출력 형식

커밋 메시지 후보를 1~3개 제안한다 (변경량이 적으면 1개):

```
**제안 커밋 메시지**

1. <type>(<scope>): <Description>
2. <type>(<scope>): <Description>  ← 대안 (있는 경우)

**선택 이유**
- type 선택 근거: ...
- scope 선택 근거: ...
```

### 커밋 실행

제안 후 아래 순서로 진행한다:

1. **사용자 확인**: 위 메시지 중 하나로 커밋할지, 또는 직접 수정할 메시지를 입력받는다.
2. **커밋 실행**: 확인된 메시지로 커밋한다.

```bash
git commit -m "$(cat <<'EOF'
<확정된 커밋 메시지>
EOF
)"
```

3. **결과 출력**: 커밋 해시와 메시지를 출력한다.
