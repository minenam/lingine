# FR-03 Module Hub

> 기준: `doc/srd.md` FR-03

## 기능 단위 체크리스트

### A. day_record 업서트
- [ ] `POST /api/day-records` 구현(upsert)
- [ ] 동일 user/date 재요청 시 기존 레코드 반환
- [ ] 신규 생성 시 `status: pending`, `average_score: null` 보장

### B. 허브 진입 데이터 로딩
- [ ] 선택 날짜 day_record 조회
- [ ] day_record 없으면 자동 생성 후 재조회
- [ ] 해당 날짜 dictation_sessions 조회 연결

### C. Listening 상태 계산
- [ ] 세션 없음: Not Started
- [ ] 세션 있고 미채점: In Progress
- [ ] 채점 완료: Completed (N%)

### D. 모듈 카드 UI
- [ ] Listening 활성 카드 구현(상태 텍스트 포함)
- [ ] Vocabulary/Reading/Writing 비활성 카드 구현(잠금/클릭 불가)
- [ ] Listening 클릭 시 Listening Setup 이동

### E. 검증
- [ ] 날짜 변경 시 상태 계산 정확성 확인
- [ ] day_record 자동 생성/재사용 플로우 확인
