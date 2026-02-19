# Lingine 디자인 시스템 및 가이드

> iPhone 15 Pro 기준 High-Fidelity Mobile UI Design Proposal
> Hi-Fi 목업 이미지 기준 (asset/ 폴더 참고)

## 컨셉 방향

- ingoDeer의 여백 중심 미니멀리즘
- Habitify의 구조 안정성
- Grammarly의 차분한 피드백 톤
- 흑백 기반 + 초록 포인트 컬러 (피드백/상태 영역)

### Visual Identity 키워드

- Calm
- Focused
- Neutral
- Structured
- Academic but modern

### 컬러 시스템

- **Primary**: Dark Navy (~#1A1A2E) — 버튼, 강조
- **Accent**: Green 계열 — 진행 상태, 채점 결과, 완료 버튼
- **Background**: Pure White (#FFFFFF), Soft Gray (#F7F7F7)
- **Text**: #111111 (Primary), #888 (Secondary), #999 (Disabled)
- **Status**: Green (높음), Orange (중간), Red (낮음)

---

## Screen 01 — Login

- **배경**: Pure White (#FFFFFF)
- **로고**: 초록 새싹 아이콘 (라운드 사각형 배경)
- **타이틀**: Lingine / Font: 22 / SemiBold / Tracking -1%
- **서브타이틀**: "Daily Modular Learning" / 연한 회색
- **입력 필드**:
  - Height: 52, Radius: ~20
  - 연한 회색 배경 fill
  - 좌측 자물쇠 아이콘
  - 내부 Padding: 16
- **버튼**:
  - Height: 52, Radius: ~20
  - Background: Dark Navy (~#1A1A2E), Text: White
  - Disabled: #EAEAEA + text #999
- **PWA 유도**: 하단에 "App to Home Screen" 텍스트 + 다운로드 아이콘
- **레이아웃**: 위아래 여백 크게 (시각적 안정감)

---

## Screen 02 — Dashboard (Calendar)

### 상단

- "Hello, Learner" 인사말 / Bold
- 우측: 통계 아이콘 + 설정(톱니바퀴) 아이콘

### 캘린더

- **기본**: 주간 뷰 (1주일만 표시)
- **토글**: 월/연 텍스트("February 2026") 탭 시 월간 뷰로 전환 (전체 날짜 표시)
- `< February 2026 >` / 18 / SemiBold
- 요일 헤더: S M T W T F S
- 오늘 날짜: 검정 원형 배경 + 흰색 텍스트

### 상태 표현

- 날짜 아래 작은 컬러 dot으로 표시

| 상태    | 표현 방식          |
| ------- | ------------------ |
| Success | 초록 dot           |
| Low     | 레드 dot           |
| Empty   | 회색 dot 또는 없음 |

### 월간 정확도

- 카드 형태: White, Radius 16, 연한 배경
- "MONTHLY ACCURACY" 캡션 + 큰 숫자 (92%)
- 우측: 원형 프로그레스 링 + "Good" 라벨

### 학습 시작 카드

- White 카드, Radius 16, Subtle shadow
- "TO DO" 뱃지 (연한 초록)
- "Start Learning" 텍스트 + "Keep your streak alive!" 서브텍스트
- 우측: **">" 화살표 버튼** (원형, 검정)

### Bottom Nav

- Height 64
- 3개 탭: Home / Review / Settings
- Active 탭: 아이콘 채움 + 텍스트 진하게
- Inactive: #888
- 적용 화면: Login/Dashboard 제외 주요 화면(Module Hub, Listening Setup, Dictation, Result, Review)

### 공통 헤더

- Dashboard 제외 주요 화면은 상단 `<` 뒤로가기 헤더를 사용
- 뒤로가기는 직전 학습 흐름(허브/대시보드)으로 복귀 가능해야 함

---

## Screen 03 — Module Hub

- **배경**: Soft Gray #F7F7F7
- **상단**: "< Feb 13, 2026" + "Select a module to start" 서브텍스트

### Listening Card (Active)

- White 카드, Radius 18, Shadow 매우 약하게
- 좌측: 초록 배경 원형 마이크 아이콘
- "Listening" + "In Progress (92%)" (초록 텍스트)
- 우측 상단: 초록 dot (활성 표시)
- 프로그레스 바 없음

### Disabled Cards (Vocabulary / Reading / Writing)

- 배경: 연한 회색, 텍스트 #999
- 각 모듈별 회색 outline 아이콘
- "Coming Soon" 또는 "Locked" 라벨
- 우측: 잠금 아이콘
- 클릭 불가
- 카드 간격 16, 여백 넉넉하게

---

## Screen 04 — Listening Setup (별도 화면)

Module Hub에서 Listening 선택 시 진입하는 소스 등록 화면.

### 헤더

- "< Listening Setup" (중앙 정렬)

### 소스 선택 초기 상태

- "Select Audio Source" 타이틀 + "Choose a file or link to start dictation." 서브텍스트
- **Upload Audio File 카드**: 업로드 아이콘 + "MP3, WAV, M4A" 지원 형식 표시
- **YouTube Link 카드**: 빨간 재생 아이콘 + "Paste video URL"

### 파일 업로드 선택 시

- Upload Audio File 카드 확장
- 점선 드래그 영역: "Tap to browse files"
- "Start Learning" 버튼 (Dark Navy)

### 다중 파일 업로드 상태

- "Upload Audio Files" + "Support multiple files"
- 파일 리스트: 파일명 + 삭제(휴지통) 아이콘
- 점선 "Add Audio File" 추가 영역
- "Start Learning (N)" 버튼 (파일 개수 표시)

### YouTube 선택 시

- YouTube Link 카드 확장
- URL 입력 필드: 링크 아이콘 + placeholder "https://youtu.be/..."
- "Load Video" 버튼 (Dark Navy)

---

## Screen 05 — Dictation (핵심 학습 화면)

### 헤더

- "< Full Dictation"
- 우측: 난이도 Pill 버튼 (Easy / Med / Hard)
  - Height 32, Radius 16
  - Selected: Black bg + White text
  - Unselected: 연한 회색 배경

### 오디오 플레이어 (Sticky)

- 단일 파일: 기본 오디오 플레이어 (재생/일시정지, 탐색바, 재생 속도)
- **다중 파일**: 파일 선택 탭 UI (파일명 축약 표시, 선택된 파일 하단 border 강조) + 해당 파일 플레이어
  - 탭 높이: 36, 가로 스크롤 가능
  - Selected 탭: 하단 2px Dark Navy border + 텍스트 진하게
  - Unselected 탭: 텍스트 #888
- YouTube: iframe 임베드

### Dictation 입력

- White 카드, Radius 18, Padding 20
- 큰 Textarea: 자동 저장 (Auto Save)
- 모바일 키보드 최적화

### 정답 등록

- 탭 전환 UI: "Direct Input" / "PDF Upload"
- Selected 탭: Border bottom 강조
- 직접 입력: 텍스트 입력창
- PDF 업로드: 파일 선택 + 뷰어 제공

---

## Screen 06 — Result UI

### Result Card

- 초록 계열 테마
- White 카드, Radius 20, Padding 24, 연한 초록 배경
- 좌측: "Excellent!" + 파티 이모지 + "Almost perfect!" 서브텍스트
- 우측: **원형 프로그레스 링** 안에 점수 (96%)

### 문장별 점수

- 연한 초록 배경 행
- 좌: "Sentence 1" / 우: "92%" (SemiBold)
- 점수 색상: 기본 검정 (초록 배경 위)

### 완료 버튼

- **초록색 버튼** "Complete & Save"
- Full width, Radius 16

---

## Screen 07 — Review

### 헤더

- "Review Notes" / Bold

### 필터

- Pill 버튼 5개: **All / Incorrect / Hard / Med / Easy**
- Radius 16
- Selected: Black background + White text
- Unselected: 연한 회색 배경 + border

### 리스트 카드

- White 카드, Radius 16, Padding 16
- 좌측: 날짜 (Feb 12) + 정확도 badge (60%, 75%, 40%)
- 우측: 모듈 태그 (Listening) + 난이도 태그 (Hard)
- 하단: 문장 미리보기 ("The subway was very crowded.")
- 정확도 색상:
  - 70% 이상: Green
  - 50~69%: Orange
  - 50% 미만: Red

---

## Micro-Interaction Spec

| 요소           | 애니메이션            |
| -------------- | --------------------- |
| 카드 클릭      | scale 0.98 (120ms)    |
| 버튼 활성화    | opacity fade          |
| 결과 표시      | slide up + fade       |
| 난이도 선택    | background transition |
| 캘린더 뷰 토글 | slide down / up       |
| 소스 카드 확장 | slide down + fade in  |

- 모든 애니메이션: 200ms 이하, ease-out, bounce 금지

---

## 전체 디자인 톤 요약

**Lingine은:**

- 조용한 집중
- 기록 중심
- 숫자 중심 피드백 + 초록 계열 긍정 피드백
- 확장 가능한 모듈 구조
- 흑백 기반 + 초록 포인트 컬러

### 완성도 체크

- iPhone 15 Pro 기준
- Hi-Fi 목업 이미지 반영
- 컴포넌트 기반 구조
- 확장 대비 설계
