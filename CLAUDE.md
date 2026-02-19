# Lingine - Project Instructions

## 프로젝트 개요

영어 듣기 Dictation 학습 웹앱 (Mobile-First PWA)

- 기술 스택: Next.js 16 (App Router) + TypeScript (strict) + Supabase (PostgreSQL + Storage)
- 인증: bcrypt + JWT (httpOnly cookie, 7일)
- 패키지 매니저: pnpm
- 테스트: Vitest

## 문서 맵

| 문서                   | 내용                                       |
| ---------------------- | ------------------------------------------ |
| `doc/prd.md`           | 화면 흐름, UX 정의, 데이터 구조 개요       |
| `doc/srd.md`           | FR별 입력/처리/출력 명세, 데이터 모델 (§5) |
| `doc/trd.md`           | REST API 명세, 채점 알고리즘 (§3)          |
| `doc/design-system.md` | 컬러, 컴포넌트 스타일, 마이크로인터랙션    |
| `doc/conventions.md`   | 네이밍, 디렉토리 구조, 테스트 규칙         |
| `doc/task/fr-XX.md`    | FR별 구현 체크리스트 (FR-00 ~ FR-08)       |

## 핵심 데이터 모델

```
users → day_records → audio_sources
                    → dictation_sessions → sentences
                         ↕ (N:N)
                      session_audio_sources
```

주요 필드: `dictation_sessions.keyword` (nullable, 채점 제외 메타데이터)

## 디렉토리 구조

```
src/
├── app/
│   ├── (auth)/login/          # FR-01 로그인 페이지
│   ├── dashboard/             # FR-02 대시보드
│   ├── dictation/[id]/        # FR-05 받아쓰기
│   │   └── result/            # FR-06 채점 결과
│   ├── review/                # FR-07 복습
│   ├── settings/              # FR-08 설정
│   └── api/
│       ├── users/             # login, logout, [id]
│       ├── day-records/       # FR-02, FR-03
│       ├── audio-sources/     # FR-04
│       ├── dictation-sessions/# FR-05 ~ FR-07
│       │   └── [id]/answer, score
│       └── backups/           # FR-08
├── components/
│   ├── auth/                  # LoginForm
│   ├── dictation/             # DictationEditor
│   ├── result/                # ResultKeywordEditor
│   ├── review/                # ReviewSessions
│   ├── layout/                # BottomNav, Header 등
│   └── ui/                    # 기본 UI 컴포넌트
├── lib/
│   ├── auth.ts                # getAuthUser() — JWT 검증
│   ├── supabase.ts            # client/server Supabase 인스턴스
│   ├── errors.ts              # 표준 에러 코드/응답
│   ├── env.ts                 # 환경변수
│   ├── dateUtils.ts           # 날짜 유틸 함수
│   └── services/              # API 라우트에서 분리된 DB 쿼리/비즈니스 로직
└── types/api.ts               # 공통 API 타입

## 아키텍처 원칙

### Server / Client 경계

- `'use client'` 범위를 최소화한다. 데이터 fetch는 Server Component(`page.tsx`)에서, 인터랙션·상태만 Client Component로 위임한다.
- Server Component에서 fetch한 초기 데이터는 props(`initialData`)로 Client에 주입한다.
- Server fetch 실패 시 crash 금지 — try/catch로 감싸고 `initialData={undefined}`로 Client에 위임한다.

### Client 컴포넌트 구조

- 상태 + fetch 로직 → `useXxx` 커스텀 훅 (`components/<feature>/useXxx.ts`)
- 순수 유틸 함수 → `lib/` (예: `lib/dateUtils.ts`)
- 반복되는 JSX 블록 → 하위 컴포넌트로 추출

### API 라우트 구조

- `route.ts`는 **검증 → 서비스 호출 → 응답 반환**만 담당한다.
- DB 쿼리 / 비즈니스 로직은 `lib/services/<name>.ts`로 분리한다.

---

## 핵심 컨벤션

> 상세: [doc/conventions.md](./doc/conventions.md)

### Commit

```

<type>(<scope>): <Description>

```

- type: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- scope: `auth`, `dashboard`, `dictation`, `review`, `settings`, `api`, `db`, `deps`
- Description: 영문 대문자 시작, 마침표 없음

### Naming

| 대상 | 규칙 |
|------|------|
| 컴포넌트 파일 | PascalCase (`DictationInput.tsx`) |
| 유틸/훅 파일 | camelCase (`useAutoSave.ts`) |
| API 라우트 | kebab-case (`dictation-sessions/route.ts`) |
| 변수/함수 | camelCase |
| 타입/인터페이스 | PascalCase |
| 상수 | UPPER_SNAKE_CASE |
| DB 컬럼 | snake_case |

### Code Style

- Prettier: 세미콜론, 싱글 쿼트, 2칸 들여쓰기, trailing comma
- ESLint: `next/core-web-vitals` + `next/typescript`
- TypeScript `strict: true`, `any` 지양

### 파일 크기 제한

파일이 아래 기준을 초과하면 **반드시 분리**한다:

| 파일 종류 | 최대 줄 수 | 분리 방법 |
|-----------|-----------|-----------|
| 컴포넌트 (`.tsx`) | 300줄 | 하위 컴포넌트로 추출, 로직은 커스텀 훅으로 분리 |
| API 라우트 (`route.ts`) | 150줄 | 핸들러 함수를 `lib/` 또는 별도 서비스 모듈로 분리 |
| 유틸/훅 (`.ts`) | 150줄 | 책임 단위로 파일 분리 |

**분리 우선순위**:
1. 반복되는 JSX 블록 → 하위 컴포넌트
2. `useState` + 관련 로직 덩어리 → `useXxx` 커스텀 훅
3. API 호출/비즈니스 로직 → `lib/` 함수로 추출

### 브랜치

```

<prefix>/<description> (예: feat/FR-01-auth, fix/login-jwt-expire)

```

### 테스트

- Vitest (유닛/통합)
- 파일 위치: `__tests__/` 또는 `*.test.ts`
```
