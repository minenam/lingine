# FR-04 Listening Setup

> 기준: `doc/srd.md` FR-04, `doc/trd.md` 2-3

## 기능 단위 체크리스트

### A. 오디오 소스 등록 API

- [x] `POST /api/audio-sources` 파일 업로드 분기 구현 (`multipart/form-data`)
- [x] `POST /api/audio-sources` YouTube 분기 구현 (`application/json`)
- [x] 파일 MIME/크기 검증 (`audio/mpeg`, `audio/wav`, `audio/x-m4a`, 50MB)
- [x] YouTube URL 검증 + video ID 추출
- [x] Supabase Storage 업로드 + `audio_sources` 레코드 저장

### B. 오디오 소스 삭제 API

- [x] `DELETE /api/audio-sources/:id` 구현
- [x] 파일 소스 삭제 시 Storage + DB 동시 정리

### C. 업로드 UI

- [x] Upload Audio File / YouTube Link 선택 카드 구현
- [x] 파일 다중 업로드 목록 UI(삭제 버튼 포함)
- [x] Add Audio File 추가 업로드 UI
- [x] Start Learning(N) 버튼 동작 연결

### D. YouTube UI

- [x] URL 입력 필드 + Load Video 버튼 구현
- [x] 잘못된 URL 에러 표시 (`INVALID_URL`)

### E. 검증

- [ ] 파일/YouTube 각각 Dictation 화면 이동 확인
- [ ] 파일 삭제 시 실제 데이터/스토리지 정리 확인
