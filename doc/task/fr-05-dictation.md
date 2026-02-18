# FR-05 Dictation

> 기준: `doc/srd.md` FR-05, `doc/trd.md` 2-4

## 기능 단위 체크리스트

### A. 세션 생성/조회/수정 API
- [ ] `POST /api/dictation-sessions` 구현(세션 생성 + audioSourceIds 연결)
- [ ] `GET /api/dictation-sessions/:id` 구현
- [ ] `PATCH /api/dictation-sessions/:id` 구현(`userInput`, `difficulty`)

### B. Dictation 화면 구성
- [ ] 헤더 + 난이도 Pill(Easy/Med/Hard) 구현
- [ ] Sticky 오디오 플레이어 영역 구현
- [ ] 텍스트 입력 textarea 구성(placeholder 포함)

### C. 오디오 재생 분기
- [ ] 파일 소스: `<audio>` 재생 연결
- [ ] 다중 파일: 파일 선택 탭 + 선택 파일 재생
- [ ] YouTube 소스: iframe 임베드 재생

### D. 자동 저장
- [ ] 입력 변경 debounce 3초 적용
- [ ] 네트워크 실패 시 3초 간격 최대 3회 조용히 재시도
- [ ] 난이도 변경 시 즉시 PATCH 반영

### E. 검증
- [ ] 입력 복원/저장 타이밍 확인
- [ ] 난이도/오디오 소스 전환 동작 확인
