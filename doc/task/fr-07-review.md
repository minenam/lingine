# FR-07 Review

> 기준: `doc/srd.md` FR-07, `doc/trd.md` 2-4 (목록 API)

## 기능 단위 체크리스트

### A. 목록 조회 API
- [ ] `GET /api/dictation-sessions` 구현(기본 status=completed)
- [ ] 필터 파라미터 처리(`difficulty`, `maxScore`)
- [ ] 페이지네이션 처리(`page`, `limit`)
- [ ] 미리보기 텍스트(`previewText`) 생성 규칙 반영

### B. Review 필터 UI
- [ ] All/Incorrect/Hard/Med/Easy 필터 Pill 구현
- [ ] Incorrect 필터를 `total_score < 70`로 연결
- [ ] 필터 변경 시 목록 재조회 연결

### C. 카드 리스트 UI
- [ ] 날짜/정확도 배지/모듈 태그/난이도 태그 표시
- [ ] 정확도 색상 규칙 반영(Green/Orange/Red)
- [ ] 미리보기 문장 표시(첫 문장 30자)

### D. 상세 이동
- [ ] 카드 클릭 시 해당 세션 상세(Dictation+Result) 이동 연결

### E. 검증
- [ ] 필터 조합별 결과 정확성 확인
- [ ] 페이지 이동 시 중복/누락 없이 로딩 확인
