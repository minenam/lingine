---
name: doc-sync
description: >
  This skill should be used whenever code files in src/ are added, modified, or deleted.
  Activate when: a new feature is implemented, an API route is created or changed,
  a component is added, a DB schema is modified, a lib utility is written, or
  a task checklist item appears to be completed. This skill guides how to keep
  doc/ documentation in sync with the actual codebase.
version: 1.0.0
---

# Doc Sync — 코드 변경 시 문서 최신화 가이드

## 핵심 원칙

**코드가 진실(source of truth)이다.** 구현이 완료되거나 스펙에서 벗어날 경우, 문서를 코드에 맞게 업데이트한다.
단, PRD는 제품 의도를 담으므로 구현 편의상의 변경은 반영하지 않는다.

---

## Step 1 — 변경 파일을 FR 번호로 매핑

변경된 파일 경로를 보고 해당 FR과 업데이트할 문서를 식별한다.

| 변경 파일 경로 패턴                                             | FR    | Task 파일                           | 관련 스펙 문서             |
| --------------------------------------------------------------- | ----- | ----------------------------------- | -------------------------- |
| `src/lib/`, `src/types/`, 보일러플레이트                        | FR-00 | `doc/task/fr-00-initiation.md`      | -                          |
| `src/app/(auth)/`, `src/app/api/users/`                         | FR-01 | `doc/task/fr-01-auth.md`            | SRD §FR-01, TRD §2-1       |
| `src/app/dashboard/`, `src/app/api/day-records/`                | FR-02 | `doc/task/fr-02-dashboard.md`       | SRD §FR-02, TRD §2-2       |
| Module Hub 관련 페이지/컴포넌트                                 | FR-03 | `doc/task/fr-03-module-hub.md`      | SRD §FR-03                 |
| `src/app/api/audio-sources/`, Listening Setup 페이지            | FR-04 | `doc/task/fr-04-listening-setup.md` | SRD §FR-04, TRD §2-3       |
| `src/app/dictation/`, `src/app/api/dictation-sessions/` (PATCH) | FR-05 | `doc/task/fr-05-dictation.md`       | SRD §FR-05, TRD §2-4       |
| `src/app/api/dictation-sessions/[id]/answer/`, `/score/`        | FR-06 | `doc/task/fr-06-result-scoring.md`  | SRD §FR-06, TRD §2-5, §3   |
| `src/app/review/`                                               | FR-07 | `doc/task/fr-07-review.md`          | SRD §FR-07, TRD §2-4 (GET) |
| `src/app/settings/`, `src/app/api/backups/`                     | FR-08 | `doc/task/fr-08-settings.md`        | SRD §FR-08, TRD §2-6       |

---

## Step 2 — 업데이트 우선순위 판단

### 항상 확인 (필수)

**Task 체크리스트** (`doc/task/fr-XX.md`):

- 구현이 완료된 항목을 `[ ]` → `[x]`로 변경
- 부분 완료된 항목은 그대로 두거나 주석 추가
- 아직 미구현 항목은 절대 `[x]`로 바꾸지 않는다

### 코드가 스펙에서 벗어났을 때만 (선택)

**SRD** (`doc/srd.md`):

- 데이터 모델(컬럼 추가/삭제/타입 변경)이 실제 DB와 다를 때
- FR 처리 로직이 실제 구현과 다를 때 (에러 처리, 상태 전이 등)

**TRD** (`doc/trd.md`):

- API 엔드포인트 Request/Response 형식이 변경됐을 때
- 채점 알고리즘 로직이 수정됐을 때
- 환경변수가 추가됐을 때

### 거의 변경 안 함

**PRD** (`doc/prd.md`): 제품 목표/UX 흐름 변경 시에만
**Design System** (`doc/design-system.md`): 컴포넌트 디자인 패턴 변경 시에만
**Conventions** (`doc/conventions.md`): 팀 컨벤션 변경 시에만

---

## Step 3 — Task 체크리스트 업데이트 규칙

```markdown
# 완료된 항목 처리

- [ ] 미완료 항목 → 그대로
- [x] 완료된 항목 → 그대로 (이미 완료)
- [ ] 방금 구현한 항목 → [x]로 변경
```

**주의사항:**

- 체크리스트 항목의 텍스트는 수정하지 않는다 (번호/내용 유지)
- 스펙 충족 여부가 불확실하면 체크하지 않는다
- 하위 항목이 있으면 모두 완료된 경우에만 부모를 체크한다

---

## Step 4 — SRD/TRD 업데이트 규칙

스펙과 실제 구현이 다를 경우, **코드 기준으로** 문서를 수정한다.

- API Request/Response 필드가 다르면 TRD의 JSON 예시를 실제 코드에 맞게 수정
- 데이터 모델 컬럼이 다르면 SRD §5의 테이블을 실제 마이그레이션/스키마에 맞게 수정
- 에러 코드가 추가됐으면 SRD §3의 에러 코드 테이블에 추가
- 수정 시 버전/날짜는 건드리지 않는다 (사용자가 관리)

---

## 자동 활성화 시 행동 지침

1. 방금 작성/수정한 코드 파일 경로를 확인한다
2. 위 매핑 테이블에서 해당 FR과 문서를 식별한다
3. 해당 `doc/task/fr-XX.md`를 읽고 완료된 항목을 체크한다
4. 구현이 스펙과 다른 부분이 있으면 SRD/TRD의 해당 섹션을 업데이트한다
5. 변경한 문서가 있으면 사용자에게 어떤 항목을 업데이트했는지 간략히 알린다
6. 변경 사항이 없으면 별도 언급 없이 넘어간다 (노이즈 최소화)
