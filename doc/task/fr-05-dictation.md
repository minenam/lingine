# FR-05 Dictation

> 기준: `doc/srd.md` FR-05, `doc/trd.md` 2-4

## 기능 단위 체크리스트

### A. 세션 생성/조회/수정 API

- [x] `POST /api/dictation-sessions` 구현(세션 생성 + audioSourceIds 연결)
- [x] `GET /api/dictation-sessions/:id` 구현
- [x] `PATCH /api/dictation-sessions/:id` 구현(`userInput`, `difficulty`, `keyword`)

### B. Dictation 화면 구성

- [x] 헤더 + 난이도 Pill(Easy/Med/Hard) 구현
- [x] Sticky 오디오 플레이어 영역 구현
- [x] 텍스트 입력 textarea 구성(placeholder 포함)
- [x] 키워드 입력 input 구성(nullable, 미입력 허용)

### C. 오디오 재생 분기

- [x] 파일 소스: `<audio>` 재생 연결
- [x] 다중 파일: 파일 선택 탭 + 선택 파일 재생
- [x] YouTube 소스: iframe 임베드 재생
- [x] 반복 재생 토글(파일/YouTube 공통)

### D. 자동 저장

- [x] 입력 변경 debounce 3초 적용
- [x] 네트워크 실패 시 3초 간격 최대 3회 조용히 재시도
- [x] 난이도 변경 시 즉시 PATCH 반영
- [x] 키워드 변경 시 즉시 PATCH 반영(완료 상태 포함)

### E. 검증

- [ ] 입력 복원/저장 타이밍 확인
- [ ] 난이도/오디오 소스 전환 동작 확인
