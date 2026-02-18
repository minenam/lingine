# FR-01 Auth (Login)

> 기준: `doc/srd.md` FR-01, `doc/trd.md` 2-1

## 기능 단위 체크리스트

### A. 인증 API

- [x] `POST /api/users/login` 구현
- [x] 비밀번호 미입력 검증 (`EMPTY_PASSWORD`)
- [x] bcrypt 비교 로직 구현 (`INVALID_PASSWORD`)
- [x] JWT 발급(7일 만료) + httpOnly cookie 설정
- [x] 성공 응답 user payload 반환

### B. 세션 종료 API

- [x] `POST /api/users/logout` 구현
- [x] 로그아웃 시 auth cookie 삭제

### C. 로그인 화면 동작

- [x] 비밀번호 입력 필드 + 마스킹 UI
- [x] 비밀번호 미입력 시 Login 버튼 비활성화
- [x] 로그인 실패 시 에러 메시지 노출
- [x] JWT 유효 시 자동 로그인(대시보드 리다이렉트)

### D. 공통 인증 유틸

- [x] `lib/auth.ts` `getAuthUser()` 구현
- [x] 인증 실패 시 `UNAUTHORIZED` 표준 에러 포맷 반환

### E. 검증

- [ ] 정상 로그인/실패 로그인/로그아웃 수동 검증
- [ ] 인증 관련 API 응답 포맷 SRD/TRD 일치 확인
