# Lingine 개발 컨벤션

> 버전: 1.0 | 작성일: 2026-02-18

---

## 1. Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/) 기반.

### 형식

```
<type>(<scope>): <Description>
```

- `type`: 필수
- `scope`: 선택 (도메인 단위)
- `Description`: 영문 대문자 시작, 마침표 없음

### Type

| type       | 용도                         |
| ---------- | ---------------------------- |
| `feat`     | 새 기능                      |
| `fix`      | 버그 수정                    |
| `docs`     | 문서 변경                    |
| `style`    | 포맷팅 (코드 동작 변경 없음) |
| `refactor` | 리팩토링                     |
| `test`     | 테스트 추가/수정             |
| `chore`    | 빌드, 설정, 의존성 등        |

### Scope

`auth`, `dashboard`, `dictation`, `review`, `settings`, `api`, `db`, `deps`

### 예시

```
feat(dictation): Implement auto-save for user input
fix(auth): Fix JWT expiration check on refresh
docs(srd): Update data model schema
style(ui): Apply consistent spacing to card components
refactor(api): Extract score calculation to separate module
test(score): Add edge case tests for empty input
chore(deps): Upgrade next to 15.x
```

---

## 2. 브랜치 전략

### 형식

```
<prefix>/<description>
```

### Prefix

| prefix   | 용도            |
| -------- | --------------- |
| `feat/`  | 새 기능         |
| `fix/`   | 버그 수정       |
| `docs/`  | 문서 변경       |
| `chore/` | 설정, 의존성 등 |

### 예시

```
feat/FR-01-auth
feat/FR-05-dictation
fix/login-jwt-expire
docs/update-trd
chore/eslint-setup
```

- SRD의 FR 번호가 있으면 포함 (추적용)
- `main` 브랜치에서 분기, 작업 완료 후 PR로 머지

---

## 3. Code Style

### 도구

| 도구                        | 역할                                                        |
| --------------------------- | ----------------------------------------------------------- |
| **ESLint**                  | 코드 품질 검사 (`next/core-web-vitals` + `next/typescript`) |
| **Prettier**                | 코드 포맷팅                                                 |
| **husky** + **lint-staged** | 커밋 시 자동 lint/format 실행                               |

### Prettier 설정

```jsonc
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80,
}
```

### lint-staged 설정

```jsonc
// .lintstagedrc
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"],
}
```

### Husky pre-commit

```sh
pnpm stabilize:next-env
git add next-env.d.ts
pnpm lint-staged
```

- `next-env.d.ts`의 `./.next/dev/types/routes.d.ts` 경로를 `./.next/types/routes.d.ts`로 커밋 전 정규화해 불필요한 diff를 줄인다.

---

## 4. Naming Convention

| 대상               | 규칙                     | 예시                                   |
| ------------------ | ------------------------ | -------------------------------------- |
| 컴포넌트 파일/폴더 | PascalCase               | `DictationInput.tsx`                   |
| 유틸/훅/API 파일   | camelCase                | `useAutoSave.ts`, `scoreCalculator.ts` |
| API 라우트 폴더    | kebab-case               | `app/api/dictation-sessions/route.ts`  |
| 변수/함수          | camelCase                | `totalScore`, `calculateLCS()`         |
| 타입/인터페이스    | PascalCase               | `DictationSession`, `ScoreResult`      |
| 상수               | UPPER_SNAKE_CASE         | `MAX_FILE_SIZE`, `JWT_EXPIRY`          |
| DB 컬럼            | snake_case               | `average_score`, `created_at`          |
| CSS 클래스         | kebab-case 또는 Tailwind | `card-wrapper`, `text-primary`         |

---

## 5. 디렉토리 구조

Next.js App Router 기반.

```
src/
├── app/                        # App Router 페이지
│   ├── (auth)/                 # 인증 레이아웃 그룹
│   │   └── login/
│   ├── dashboard/
│   ├── dictation/
│   ├── review/
│   ├── settings/
│   └── api/                    # API 라우트
│       ├── users/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── [id]/route.ts
│       ├── day-records/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── audio-sources/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── dictation-sessions/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── answer/route.ts
│       │       └── score/route.ts
│       └── backups/
│           └── route.ts
├── components/                 # 공통 UI 컴포넌트
│   ├── ui/                     # 기본 UI (Button, Card, Input 등)
│   └── layout/                 # 레이아웃 (BottomNav, Header 등)
├── hooks/                      # 커스텀 훅
├── lib/                        # 유틸리티, Supabase 클라이언트, 채점 로직
├── types/                      # TypeScript 타입 정의
└── styles/                     # 글로벌 스타일
```

---

## 6. 패키지 매니저

**pnpm** 사용.

- 디스크 효율적 의존성 관리
- strict node_modules 구조
- Next.js 공식 지원

---

## 7. 테스트

| 도구           | 용도                                 | 시기 |
| -------------- | ------------------------------------ | ---- |
| **Vitest**     | 유닛/통합 테스트 (채점 로직, API 등) | MVP  |
| **Playwright** | E2E 테스트                           | 추후 |

### 테스트 파일 위치

- `__tests__/` 폴더 또는 소스 파일 옆 `*.test.ts`
- 예: `lib/__tests__/scoreCalculator.test.ts`

### 테스트 네이밍

```typescript
describe('calculateLCS', () => {
  it('should return 100 for identical sentences', () => { ... });
  it('should return 0 for empty user input', () => { ... });
});
```

---

## 8. TypeScript

- `strict: true` 활성화
- `any` 사용 지양, 불가피한 경우 `// eslint-disable-next-line` + 사유 주석
- API 응답 타입은 `types/` 폴더에 도메인별 정의
