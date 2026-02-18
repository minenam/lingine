# FR-06 Result & Scoring

> 기준: `doc/srd.md` FR-06, `doc/trd.md` 2-5, 채점 알고리즘 섹션

## 기능 단위 체크리스트

### A. 정답 업로드 API
- [ ] `POST /api/dictation-sessions/:id/answer` manual 분기 구현
- [ ] `POST /api/dictation-sessions/:id/answer` pdf 분기 구현
- [ ] PDF 업로드(10MB 제한) + `answer_pdf_path` 저장

### B. 채점 API
- [ ] `POST /api/dictation-sessions/:id/score` 구현
- [ ] `GET /api/dictation-sessions/:id/score` 구현
- [ ] `DELETE /api/dictation-sessions/:id/score` 구현
- [ ] `answerKey` 비어있을 때 `SCORING_ERROR`(422) 처리

### C. 채점 엔진
- [ ] 정규화(normalization) 단계 구현(축약형/하이픈/구두점/공백)
- [ ] 문장 매칭 규칙 구현(부족분 빈 문자열, 초과분 무시)
- [ ] LCS 기반 문장 점수 계산 구현
- [ ] 총점/피드백 매핑 구현
- [ ] sentence 결과 저장 + session 점수/상태 갱신

### D. 일자 집계 연동
- [ ] 채점 후 `day_records.average_score` 재계산
- [ ] 채점 완료 세션 존재 시 `day_records.status=completed` 반영
- [ ] 점수 삭제 시 day_record 재계산 복원

### E. Result UI
- [ ] Direct Input / PDF Upload 탭 UI 구현
- [ ] Check Answer 버튼/결과 카드/문장별 점수 렌더링
- [ ] Complete & Save 버튼(채점 전 비활성화) 구현
- [ ] 재채점 플로우 UI 연결

### F. 검증
- [ ] 엣지 케이스(빈 입력/빈 정답/축약형/하이픈) 점검
- [ ] 피드백 메시지/이모지 구간 일치 확인
