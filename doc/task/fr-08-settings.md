# FR-08 Settings

> 기준: `doc/srd.md` FR-08, `doc/trd.md` 2-1/2-6

## 기능 단위 체크리스트

### A. 사용자 수정 API

- [x] `PATCH /api/users/:id` 구현(비밀번호 변경/description 수정)
- [x] 현재 비밀번호 검증 실패 시 `INVALID_PASSWORD` 처리
- [x] 새 비밀번호 bcrypt 해싱 저장

### B. 백업 API

- [x] `POST /api/backups` 구현
- [x] day_records/dictation_sessions/sentences/audio_sources 데이터 수집
- [x] 파일명 규칙 `lingine-backup-{YYYY-MM-DD}.json` 반영

### C. Settings 화면

- [x] Change Password 폼 구현(현재/새 비밀번호/확인)
- [x] Description 수정 입력/저장 UI 구현
- [x] Data Backup 버튼 + 다운로드 트리거 구현
- [x] App Info(PWA Install Guide, Version) 섹션 구현

### D. 피드백 UX

- [x] 비밀번호 변경 성공/실패 피드백 메시지
- [x] 백업 성공/실패 메시지 처리

### E. 검증

- [x] 비밀번호 변경 후 재로그인 플로우 구현(`passwordChanged=1` 안내)
- [x] 백업 JSON 구조/다운로드 동작 확인

### F. 로그아웃

- [x] App Info 섹션 아래 Logout 버튼 추가 (빨간 테두리 스타일)
- [x] confirm 다이얼로그 후 `POST /api/users/logout` 호출
- [x] 로그아웃 후 `/login` 리다이렉트
- [x] `isLoggingOut` 상태로 중복 클릭 방지
