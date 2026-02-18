# FR-00 Initiation (Boilerplate + 필수 패키지)

> 목적: FR-01~FR-08 구현 전에, 실행 가능한 기본 골격과 필수 라이브러리를 먼저 준비한다.
> 기준: `doc/srd.md`, `doc/trd.md`, `doc/conventions.md`

## 기능 단위 체크리스트

### A. 프로젝트 보일러플레이트
- [ ] Next.js App Router + TypeScript(strict) 프로젝트 골격 준비
- [ ] `src/app`, `src/components`, `src/lib`, `src/types`, `src/hooks`, `src/styles` 기본 디렉토리 구성
- [ ] 기본 레이아웃(`app/layout.tsx`) 및 글로벌 스타일 연결
- [ ] `.env.example`에 필수 환경 변수 키 정의

### B. 필수 런타임 패키지
- [ ] `@supabase/supabase-js` 설치 (DB/Storage 연동)
- [ ] `bcryptjs` 설치 (비밀번호 해시/검증)
- [ ] `jsonwebtoken` 설치 (JWT 발급/검증)
- [ ] `zod` 설치 (API 입력 검증)
- [ ] `clsx` 설치 (UI 클래스 조합)

### C. 필수 타입 패키지
- [ ] `@types/jsonwebtoken` 설치
- [ ] `@types/bcryptjs` 설치 여부 확인 및 필요 시 설치
- [ ] Node/React 기본 타입 패키지 상태 점검

### D. 개발 품질 도구
- [ ] `eslint`, `eslint-config-next` 설정 점검
- [ ] `prettier` 설정 반영 (`semi`, `singleQuote`, `tabWidth:2`, `trailingComma:all`)
- [ ] `husky` + `lint-staged` 구성
- [ ] `lint-staged`에 `*.{ts,tsx}`와 `*.{json,md}` 규칙 반영

### E. 테스트/검증 기반
- [ ] `vitest` + `@vitest/coverage-v8` + `@testing-library/react` 설치
- [ ] 기본 테스트 스크립트 추가 (`test`, `test:watch`, `test:coverage`)
- [ ] 최소 스모크 테스트 1개 추가 (유틸 또는 API 단위)

### F. 공통 인프라 유틸
- [ ] `src/lib/supabase.ts` (client/server 사용 경계 포함) 초안 작성
- [ ] `src/lib/auth.ts` (`getAuthUser`, JWT 쿠키 처리) 초안 작성
- [ ] `src/lib/errors.ts` (표준 에러 코드/응답 포맷) 초안 작성
- [ ] `src/types/api.ts` (공통 API 타입) 초안 작성

### G. PWA 최소 세팅
- [ ] `manifest.json` 생성 (`display: standalone`, 앱 이름, 테마색)
- [ ] 아이콘 에셋 연결(최소 192/512)
- [ ] App Shell 수준 기본 캐싱 전략 초안 반영

### H. 실행 스크립트/문서
- [ ] `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test` 동작 확인
- [ ] `README` 또는 `doc/task/`에 로컬 실행 절차 5줄 이내 정리

### I. 완료 기준
- [ ] 새 환경에서 `pnpm install` 후 `pnpm dev` 즉시 실행 가능
- [ ] 린트/빌드/테스트 명령이 최소 1회 성공
- [ ] FR-01(Auth) 구현을 바로 시작할 수 있는 공통 유틸/구조 준비 완료
