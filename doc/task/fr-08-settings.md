# FR-08 Settings

> 기준: `doc/srd.md` FR-08, `doc/trd.md` 2-1/2-6

## 기능 단위 체크리스트

### A. 사용자 수정 API
- [ ] `PATCH /api/users/:id` 구현(비밀번호 변경/description 수정)
- [ ] 현재 비밀번호 검증 실패 시 `INVALID_PASSWORD` 처리
- [ ] 새 비밀번호 bcrypt 해싱 저장

### B. 백업 API
- [ ] `POST /api/backups` 구현
- [ ] day_records/dictation_sessions/sentences/audio_sources 데이터 수집
- [ ] 파일명 규칙 `lingine-backup-{YYYY-MM-DD}.json` 반영

### C. Settings 화면
- [ ] Change Password 폼 구현(현재/새 비밀번호/확인)
- [ ] Data Backup 버튼 + 다운로드 트리거 구현
- [ ] App Info(PWA Install Guide, Version) 섹션 구현

### D. 피드백 UX
- [ ] 비밀번호 변경 성공/실패 토스트 메시지
- [ ] 백업 성공/실패 메시지 처리

### E. 검증
- [ ] 비밀번호 변경 후 재로그인 검증
- [ ] 백업 JSON 구조/다운로드 동작 확인
