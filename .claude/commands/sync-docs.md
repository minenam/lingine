---
description: doc/ 문서를 코드 변경 사항에 맞게 전체 동기화
allowed-tools: Read, Edit, Glob, Grep, Bash(git diff *), Bash(git diff), Bash(git log *)
---

# Doc Sync — 전체 문서 동기화

## 현재 코드 변경 컨텍스트

최근 변경된 파일 목록:
!`git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD 2>/dev/null || echo "변경 파일 없음"`

전체 변경 요약:
!`git diff --stat HEAD~1 HEAD 2>/dev/null || git diff --stat HEAD 2>/dev/null || echo "변경 없음"`

현재 브랜치:
!`git branch --show-current`

---

## 수행할 작업

다음 순서대로 `doc/` 문서를 코드 현황에 맞게 동기화한다.

### 1. 변경 파일 분석

위 변경 파일 목록을 보고, 아래 매핑에 따라 영향받는 FR과 문서를 식별한다.

| 파일 경로 패턴                                          | FR    | Task 파일                           |
| ------------------------------------------------------- | ----- | ----------------------------------- |
| `src/lib/`, `src/types/`                                | FR-00 | `doc/task/fr-00-initiation.md`      |
| `src/app/(auth)/`, `src/app/api/users/`                 | FR-01 | `doc/task/fr-01-auth.md`            |
| `src/app/dashboard/`, `src/app/api/day-records/`        | FR-02 | `doc/task/fr-02-dashboard.md`       |
| Module Hub 관련                                         | FR-03 | `doc/task/fr-03-module-hub.md`      |
| `src/app/api/audio-sources/`, Listening Setup           | FR-04 | `doc/task/fr-04-listening-setup.md` |
| `src/app/dictation/`, `src/app/api/dictation-sessions/` | FR-05 | `doc/task/fr-05-dictation.md`       |
| `.../dictation-sessions/[id]/answer/`, `/score/`        | FR-06 | `doc/task/fr-06-result-scoring.md`  |
| `src/app/review/`                                       | FR-07 | `doc/task/fr-07-review.md`          |
| `src/app/settings/`, `src/app/api/backups/`             | FR-08 | `doc/task/fr-08-settings.md`        |

변경 파일이 없거나 `src/` 외부만 변경됐으면 Task 체크리스트 업데이트를 건너뛴다.

### 2. Task 체크리스트 업데이트 (`doc/task/`)

영향받는 각 `fr-XX.md` 파일에 대해:

1. 파일을 읽는다
2. 각 `[ ]` 항목이 현재 `src/` 코드에 실제로 구현되어 있는지 확인한다
   - 해당 파일/함수/로직이 실제로 존재하면 → `[x]`로 변경
   - 아직 없거나 불완전하면 → `[ ]` 그대로 유지
3. 이미 `[x]`인 항목은 건드리지 않는다
4. 항목 텍스트는 절대 수정하지 않는다

### 3. SRD 업데이트 확인 (`doc/srd.md`)

다음 중 하나라도 해당하면 `doc/srd.md`의 관련 섹션을 수정한다:

- 데이터 모델(§5)이 실제 DB 스키마/마이그레이션과 다른 경우
- FR 처리 로직, 에러 코드(§3)가 실제 구현과 다른 경우
- 비기능 요구사항(§4)이 실제 설정과 다른 경우

코드가 스펙 그대로 구현됐으면 SRD는 수정하지 않는다.

### 4. TRD 업데이트 확인 (`doc/trd.md`)

다음 중 하나라도 해당하면 `doc/trd.md`의 관련 섹션을 수정한다:

- API Request/Response 필드가 실제 route handler와 다른 경우
- 채점 알고리즘(§3)이 실제 `lib/` 구현과 다른 경우
- 환경변수(§4)가 추가/변경된 경우

코드가 스펙 그대로 구현됐으면 TRD는 수정하지 않는다.

### 5. 결과 보고

업데이트 작업이 끝나면 다음 형식으로 간략히 보고한다:

```
## Doc Sync 완료

### 업데이트된 파일
- doc/task/fr-01-auth.md — [x] 3개 항목 완료 처리
- doc/trd.md — POST /api/users/login Response 형식 수정

### 변경 없음
- doc/task/fr-02-dashboard.md — 관련 코드 변경 없음
- doc/srd.md — 스펙 일치 확인

### 미완료 항목 (참고)
- doc/task/fr-01-auth.md: [ ] 아직 미구현 항목 2개
```

변경된 파일이 하나도 없으면 "모든 문서가 최신 상태입니다." 라고만 출력한다.
