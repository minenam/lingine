# FR-07 Review

> 기준: `doc/srd.md` FR-07, `doc/trd.md` 2-4 (목록 API)

## 기능 단위 체크리스트

### A. 목록 조회 API

- [x] `GET /api/dictation-sessions` 구현(기본 status=completed)
- [x] 필터 파라미터 처리(`difficulty`, `maxScore`, `keyword` contains)
- [x] 페이지네이션 처리(`page`, `limit`)
- [x] 미리보기 텍스트(`previewText`) 생성 규칙 반영

### B. Review 필터 UI

- [x] All/Incorrect/Hard/Med/Easy 필터 Pill 구현
- [x] Incorrect 필터를 `total_score < 70`로 연결
- [x] 키워드 contains 검색 input 구현
- [x] 필터 변경 시 목록 재조회 연결

### C. 카드 리스트 UI

- [ ] 날짜/정확도 배지/모듈 태그/난이도 태그 표시
- [ ] 정확도 색상 규칙 반영(Green/Orange/Red)
- [x] 키워드 태그 표시(`keyword`가 있을 때만 노출, null/빈 값 숨김)
- [x] 미리보기 문장 표시(첫 문장 30자)

### D. 상세 이동

- [x] 카드 클릭 시 해당 세션 Result 이동 연결

### E. 검증

- [ ] 필터 조합별 결과 정확성 확인
- [ ] 페이지 이동 시 중복/누락 없이 로딩 확인
