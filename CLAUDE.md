# Lingine - Project Instructions

## 프로젝트 개요

영어 듣기 Dictation 학습 웹앱 (Mobile-First PWA)

- 기술 스택: Next.js (App Router) + TypeScript + Supabase
- 패키지 매니저: pnpm
- 상세 문서: `doc/` 폴더 참조 (PRD, SRD, TRD, Design System)

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

### 브랜치

```
<prefix>/<description>  (예: feat/FR-01-auth, fix/login-jwt-expire)
```

### 테스트

- Vitest (유닛/통합)
- 파일 위치: `__tests__/` 또는 `*.test.ts`
