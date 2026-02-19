# FR-06 Result & Scoring

> 기준: `doc/srd.md` FR-06, `doc/trd.md` 2-5, 채점 알고리즘 섹션

## 기능 단위 체크리스트

### A. 정답 업로드 API

- [x] `POST /api/dictation-sessions/:id/answer` manual 분기 구현
- [x] `POST /api/dictation-sessions/:id/answer` pdf 분기 구현
- [x] PDF 업로드(10MB 제한) + `answer_pdf_path` 저장

### B. 채점 API

- [x] `POST /api/dictation-sessions/:id/score` 구현
- [x] `GET /api/dictation-sessions/:id/score` 구현
- [x] `DELETE /api/dictation-sessions/:id/score` 구현
- [x] `answerKey` 비어있을 때 `SCORING_ERROR`(422) 처리

### C. 채점 엔진

- [x] 정규화(normalization) 단계 구현(축약형/하이픈/구두점/공백)
- [x] 문장 매칭 규칙 구현(부족분 빈 문자열, 초과분 무시)
- [x] LCS 기반 문장 점수 계산 구현
- [x] 총점/피드백 매핑 구현
- [x] sentence 결과 저장 + session 점수/상태 갱신

### D. 일자 집계 연동

- [x] 채점 후 `day_records.average_score` 재계산
- [x] 채점 완료 세션 존재 시 `day_records.status=completed` 반영
- [x] 점수 삭제 시 day_record 재계산 복원

### E. Result UI

- [x] Direct Input / PDF Upload 탭 UI 구현
- [x] Check Answer 버튼/결과 카드/문장별 점수 렌더링
- [x] Complete & Save 버튼(채점 전 비활성화) 구현
- [x] Result 화면에서 `keyword` 수정 UI 구현(완료 상태 포함)
- [x] 완료 세션 잠금(정답/PDF/채점 비활성, `difficulty`/`keyword`만 수정 가능) 적용

### F. 검증

- [x] 엣지 케이스(빈 입력/빈 정답/축약형/하이픈) 점검
- [x] 피드백 메시지/이모지 구간 일치 확인
- [x] `keyword` 변경이 채점 결과에 영향 없음을 확인(채점 제외)
