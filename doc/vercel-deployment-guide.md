# Vercel 배포 가이드

Lingine(Next.js 16 + Supabase) 프로젝트를 Vercel에 배포하는 절차를 정리한다.

## 1. 사전 준비

- GitHub 저장소에 현재 코드가 푸시되어 있어야 한다.
- Supabase 프로젝트가 생성되어 있어야 한다.
- Vercel 계정이 있어야 한다.

## 2. 환경변수 정리

Vercel `Project Settings > Environment Variables`에 아래 값을 등록한다.

| Key                             | Required | 설명                                       |
| ------------------------------- | -------- | ------------------------------------------ |
| `JWT_SECRET`                    | Yes      | 로그인 JWT 서명 키 (충분히 긴 랜덤 문자열) |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase 프로젝트 URL                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anon key                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Supabase service role key (서버 전용)      |
| `NOTION_API_KEY`                | Optional | Notion 연동 기능 사용 시                   |

`JWT_SECRET` 생성 예시:

```bash
openssl rand -base64 48
```

보안 주의사항:

- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트 코드에 노출하면 안 된다.
- 환경변수는 최소 `Production`과 `Preview` 둘 다 등록하는 것을 권장한다.

## 3. Vercel 프로젝트 생성

1. [https://vercel.com/new](https://vercel.com/new) 접속
2. GitHub의 `lingine` 저장소 Import
3. Framework Preset: `Next.js` 확인
4. Root Directory: 프로젝트 루트(`./`) 확인
5. Build & Output 기본값 유지

권장 빌드 설정:

- Install Command: `pnpm install`
- Build Command: `pnpm build`
- Output Directory: 자동 감지(비워둠)

## 4. 첫 배포 실행

1. `Deploy` 클릭
2. 빌드 로그에서 에러 여부 확인
3. 발급된 Production URL 접속

기본 점검 항목:

- `/login` 접근 가능 여부
- 로그인 후 대시보드 진입 여부
- Dictation 세션 생성/조회 API 정상 동작 여부

## 5. 도메인 연결 (선택)

1. `Project Settings > Domains`
2. 커스텀 도메인 추가
3. DNS 레코드(CNAME/A) 연결
4. SSL 발급 완료 확인

## 6. Preview 배포 활용

- GitHub PR 생성 시 Vercel Preview URL이 자동 생성된다.
- PR 리뷰 시 Preview에서 회귀 테스트 후 머지한다.
- Preview에도 Supabase 관련 환경변수가 설정되어 있어야 한다.

## 7. 배포 후 운영 체크리스트

- Vercel Functions 로그에서 API 에러 확인
- Supabase 로그에서 인증/쿼리 에러 확인
- `JWT_SECRET` 주기적 교체 정책 수립
- 필요 시 Vercel Analytics, Speed Insights 활성화

## 8. 트러블슈팅

### 환경변수 누락으로 500 오류 발생

- Vercel 대시보드에서 환경변수 키/값 확인
- 수정 후 `Redeploy` 실행

### 로그인은 되지만 API 인증 실패

- `JWT_SECRET`이 로컬/배포 환경에서 다르게 설정되었는지 확인
- 쿠키 도메인/보안 옵션(HTTPS) 확인

### Supabase 접근 실패

- `NEXT_PUBLIC_SUPABASE_URL` 오타 확인
- `SUPABASE_SERVICE_ROLE_KEY`가 만료/재발급되었는지 확인

## 9. 로컬과 동일 명령으로 사전 검증

배포 전 아래 명령으로 최소 품질 검증을 권장한다.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

문제가 없으면 PR 머지 후 Vercel Production 배포를 진행한다.
