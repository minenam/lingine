# FR-00 Initiation (Boilerplate + 필수 패키지)

> 목적: FR-01~FR-08 구현 전에, 실행 가능한 기본 골격과 필수 라이브러리를 먼저 준비한다.
> 기준: `doc/srd.md`, `doc/trd.md`, `doc/conventions.md`

## 기능 단위 체크리스트

### A. 프로젝트 보일러플레이트

- [x] Next.js App Router + TypeScript(strict) 프로젝트 골격 준비
- [x] `src/app`, `src/components`, `src/lib`, `src/types`, `src/hooks`, `src/styles` 기본 디렉토리 구성
- [x] 기본 레이아웃(`app/layout.tsx`) 및 글로벌 스타일 연결
- [x] `.env.example`에 필수 환경 변수 키 정의

### B. 필수 런타임 패키지

- [x] `@supabase/supabase-js` 설치 (DB/Storage 연동)
- [x] `bcryptjs` 설치 (비밀번호 해시/검증)
- [x] `jsonwebtoken` 설치 (JWT 발급/검증)
- [x] `zod` 설치 (API 입력 검증)
- [x] `clsx` 설치 (UI 클래스 조합)

### C. 필수 타입 패키지

- [x] `@types/jsonwebtoken` 설치
- [x] `@types/bcryptjs` 설치 여부 확인 및 필요 시 설치
- [x] Node/React 기본 타입 패키지 상태 점검

### D. 개발 품질 도구

- [x] `eslint`, `eslint-config-next` 설정 점검
- [x] `prettier` 설정 반영 (`semi`, `singleQuote`, `tabWidth:2`, `trailingComma:all`)
- [x] `husky` + `lint-staged` 구성
- [x] `lint-staged`에 `*.{ts,tsx}`와 `*.{json,md}` 규칙 반영
- [x] `commitlint` + `@commitlint/config-conventional` 구성
- [x] Husky `commit-msg` 훅에서 `pnpm commitlint --edit $1` 실행 연결

### E. 테스트/검증 기반

- [x] `vitest` + `@vitest/coverage-v8` + `@testing-library/react` 설치
- [x] 기본 테스트 스크립트 추가 (`test`, `test:watch`, `test:coverage`)
- [x] 최소 스모크 테스트 1개 추가 (유틸 또는 API 단위)

### F. 공통 인프라 유틸

- [x] `src/lib/supabase.ts` (client/server 사용 경계 포함) 초안 작성
- [x] `src/lib/auth.ts` (`getAuthUser`, JWT 쿠키 처리) 초안 작성
- [x] `src/lib/errors.ts` (표준 에러 코드/응답 포맷) 초안 작성
- [x] `src/types/api.ts` (공통 API 타입) 초안 작성

### G. PWA 최소 세팅

- [x] `manifest.json` 생성 (`display: standalone`, 앱 이름, 테마색)
- [x] `start_url: "/dashboard"` 설정 (PWA 실행 시 대시보드 직접 진입, 미인증 시 `/login` redirect)
- [x] 아이콘 에셋 연결(최소 192/512)
- [x] Service Worker 캐싱 전략: navigation → Network-First, 정적 자산 → Cache-First

### H. 실행 스크립트/문서

- [x] `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test` 동작 확인
- [x] `README` 또는 `doc/task/`에 로컬 실행 절차 5줄 이내 정리

### I. 완료 기준

- [x] 새 환경에서 `pnpm install` 후 `pnpm dev` 즉시 실행 가능
- [x] 린트/빌드/테스트 명령이 최소 1회 성공
- [x] FR-01(Auth) 구현을 바로 시작할 수 있는 공통 유틸/구조 준비 완료

### J. Supabase DB 필수 세팅

- [x] `doc/task/fr-00-supabase-schema.sql` 실행으로 테이블 생성
- [x] Storage bucket 생성: `audio`(public), `pdf`(public)
- [x] 단일 사용자 seed 데이터 삽입 (`users` 1건)
- [x] seed 비밀번호 bcrypt 해시 생성 후 `password_hash`에 저장
- [x] 로그인 API 호출로 `users` 조회/비밀번호 검증 정상 동작 확인

#### seed 참고 명령

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

```sql
insert into users (password_hash, description, role)
values ('<bcrypt-hash>', null, 'user');
```
