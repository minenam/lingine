# FR-02 Dashboard

> 기준: `doc/srd.md` FR-02, `doc/design-system.md` Screen 02

## 기능 단위 체크리스트

### A. 대시보드 데이터 조회 API

- [x] `GET /api/day-records?from=YYYY-MM-DD&to=YYYY-MM-DD` 구현
- [x] 기간 파라미터 검증(필수값/형식)
- [x] 월간 평균 정확도 계산 데이터 준비

### B. 캘린더 표시 로직

- [x] 주간 뷰 기본 렌더링
- [x] 월/연 탭 클릭 시 주간↔월간 토글
- [x] 날짜별 dot 색상 규칙 반영 (`>=70` 초록, `<70` 빨강)
- [x] 오늘 날짜 강조 스타일 반영

### C. 월간 정확도 카드

- [x] 월간 정확도 퍼센트 표시
- [x] 피드백 라벨 매핑 표시(Excellent/Good/Average/Needs Work)
- [x] 프로그레스 링 UI 연결

### D. 오늘 학습 카드 + 네비게이션

- [x] TO DO/DONE 상태 분기 표시
- [x] Start Learning 버튼 동작 연결
- [x] 날짜 클릭/Start Learning 클릭 시 Module Hub 이동
- [x] Bottom Nav(Home/Review/Settings) UI 반영

### E. 검증

- [ ] 기록 없음/기록 있음/완료 상태별 렌더링 확인
- [ ] 캘린더 토글 및 이동 이벤트 동작 확인
