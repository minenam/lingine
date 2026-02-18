# Lingine PRD (Product Requirements Document)

## 1. 프로젝트 개요

- **서비스명**: Lingine (링진 = Language + Engine)
- **슬로건**: Daily Modular Learning Workspace
- **핵심 기능**: 영어 듣기 Dictation 학습 기록 및 관리
- **플랫폼 전략**:
  - 1단계: 모바일 웹 우선 (Mobile First Responsive) + PWA
  - 2단계: React Native 앱 전환 (API 중심 설계를 통한 유연한 확장)

---

## 2. UX/UI 핵심 철학

1. **Daily Modular System**: 단순 듣기 앱이 아닌, '듣기', '어휘', '독해' 등 모듈을 확장할 수 있는 허브 구조
2. **Uninterrupted Flow (끊김 없는 흐름)**: 입력 도중 화면 전환을 최소화 (스크롤 기반 학습)
3. **Sticky & Accessibility**: 오디오 플레이어는 항상 접근 가능해야 하며(Sticky), 입력창은 키보드에 가려지지 않아야 함
4. **Minimalism**: 버튼 최소화. 학습 → 채점 → 완료의 과정이 직관적이어야 함
5. **Speed**: 하루 5분 내 학습 완료 목표

---

## 3. 전체 화면 흐름도 (User Flow)

```
[1. Login] (단일 사용자/세션 유지)
    ↓
[2. Dashboard] (주간 캘린더 뷰, 학습 현황 확인)
    ↓ (날짜 클릭 또는 Start Learning)
[3. Module Hub] (모듈 선택)
    ├── [🎧 Listening] (활성) → [4. Listening Setup]
    ├── [📖 Vocabulary] (Coming Soon)
    ├── [👁 Reading] (Locked)
    └── [✍️ Writing] (Locked)
    ↓
[4. Listening Setup] (음원 소스 등록)
    ├── Upload Audio File (다중 파일 지원)
    └── YouTube Link
    ↓
[5. Dictation] (받아쓰기 + 난이도 선택)
    ↓
[6. Result] (채점 결과 + 완료 저장)
    ↓
[7. Review] (복습 리스트, 필터링)
```

---

## 4. 상세 화면 & 기능 정의

### 4-1. Login

```
+---------------------------------------+
|         [🌱 새싹 로고]               |
|          Lingine                      |
|     Daily Modular Learning            |
|                                       |
|     +---------------------------+     |
|     | 🔒 ••••••                |     |
|     +---------------------------+     |
|                                       |
|     [       Login       ]             |
|                                       |
|                                       |
|      ↓ App to Home Screen             |
+---------------------------------------+
```

**UX 포인트:**

- 단일 사용자 구조 (이메일 없음)
- 비밀번호 인증 (자물쇠 아이콘 + 마스킹)
- PWA 설치 유도: 하단 "App to Home Screen" 텍스트
- 세션 유지 기능 (Auto Login)
- 인증 구현: bcrypt 해싱 저장, JWT 세션 (7일 만료), Supabase Auth 미사용 (추후 확장 시 도입)

---

### 4-2. Dashboard (캘린더 화면)

```
+---------------------------------------+
|  Hello, Learner          📊  ⚙️      |
|                                       |
|     < February 2026 >                 |
|   S   M   T   W   T   F   S          |
|   8   9  10  11  12 [13] 14          |
|   🟢  🔴  🟢  🔴  🟢  ⚪  ⚪         |
|                                       |
|  +-------------------------------+    |
|  | MONTHLY ACCURACY              |    |
|  | 92%              ◯ Good       |    |
|  +-------------------------------+    |
|                                       |
|  Today's Task                         |
|  +-------------------------------+    |
|  | TO DO                         |    |
|  | Start Learning            [>] |    |
|  | Keep your streak alive! 🔥    |    |
|  +-------------------------------+    |
|                                       |
| [🏠 Home]  [📖 Review]  [⚙️ Setting]|
+---------------------------------------+
```

**기능:**

- **캘린더**: 기본 주간 뷰 (1주일 표시). "February 2026" 탭 시 월간 뷰로 전환
- **상태 표현**: 날짜 아래 컬러 dot (초록: 높음 / 레드: 낮음)
- **월간 정확도**: 원형 프로그레스 링 + "Good" 라벨
- **학습 시작 카드**: "TO DO" 뱃지 + "Start Learning" + ">" 화살표 버튼
- **Interaction**: 날짜 클릭 또는 Start Learning 클릭 시 Module Hub로 이동

---

### 4-3. Module Hub (모듈 선택)

```
+---------------------------------------+
|  < Feb 13, 2026                       |
|    Select a module to start           |
|                                       |
|  +-------------------------------+    |
|  | 🎙 Listening           🟢    |    |
|  |    In Progress (92%)          |    |
|  +-------------------------------+    |
|                                       |
|  +-------------------------------+    |
|  | 📖 Vocabulary          🔒    |    |
|  |    Coming Soon                |    |
|  +-------------------------------+    |
|                                       |
|  +-------------------------------+    |
|  | 📄 Reading             🔒    |    |
|  |    Locked                     |    |
|  +-------------------------------+    |
|                                       |
|  +-------------------------------+    |
|  | ✍️ Writing             🔒    |    |
|  |    Locked                     |    |
|  +-------------------------------+    |
|                                       |
| [🏠 Home]  [📖 Review]  [⚙️ Setting]|
+---------------------------------------+
```

**Design:**

- Listening: White 카드, Shadow, 초록 마이크 아이콘, 초록 dot 활성 표시, 진행률 텍스트
- Disabled: 연한 회색 카드, 잠금 아이콘, 클릭 불가
- 추후 기능 추가 시 UI 변경 없이 카드 상태만 변경

---

### 4-4. Listening Setup (음원 소스 등록)

Module Hub에서 Listening 선택 시 진입하는 별도 화면.

```
+---------------------------------------+
|  < Listening Setup                    |
|                                       |
|     Select Audio Source               |
|  Choose a file or link to start       |
|  dictation.                           |
|                                       |
|  +-------------------------------+    |
|  | ⬆ Upload Audio File          |    |
|  |   MP3, WAV, M4A              |    |
|  +-------------------------------+    |
|                                       |
|  +-------------------------------+    |
|  | ▶ YouTube Link               |    |
|  |   Paste video URL            |    |
|  +-------------------------------+    |
+---------------------------------------+
```

**기능:**

- **Upload Audio File 선택 시**:
  - 드래그 영역 표시: "Tap to browse files"
  - 다중 파일 지원 (파일 리스트 + 삭제 버튼 + "Add Audio File" 추가 영역)
  - "Start Learning (N)" 버튼 (업로드된 파일 수 표시)
- **YouTube Link 선택 시**:
  - URL 입력 필드 확장: placeholder "https://youtu.be/..."
  - "Load Video" 버튼
  - YouTube iframe 임베드 재생 (오디오 추출 없음)
- 지원 형식: MP3, WAV, M4A

---

### 4-5. Dictation (받아쓰기)

핵심 학습 화면.

```
+---------------------------------------+
| <                                     |
| Full Dictation     [Easy][Med][Hard]  |
|                                       |
|  +-------------------------------+    |
|  |                               |    |
|  | I have a dream that one day   |    |
|  | this nation will rise up and  |    |
|  | live out the true meaning of  |    |
|  | its creed.                    |    |
|  |                               |    |
|  +-------------------------------+    |
+---------------------------------------+
```

**기능:**

- **난이도 선택**: 상단 우측 Pill 버튼 (Easy / Med / Hard) — 난이도는 태그/분류 목적이며, 학습 방식(전체 받아쓰기)은 동일
- **Dictation 입력**: 큰 White 카드 Textarea, 자동 저장 (Auto Save)
- 모바일 키보드 최적화
- 단일 textarea 입력 (줄바꿈으로 문장 구분)

---

### 4-6. 정답 등록 & 채점 (Result)

Dictation 하단에 이어지는 영역.

```
+---------------------------------------+
|  [Direct Input]  [PDF Upload]         |
|                                       |
|  +-------------------------------+    |
|  | Excellent! 🎉          ◯96%  |    |
|  | You missed a few nuances.    |    |
|  |                               |    |
|  |  Sentence 1           92%    |    |
|  |  Sentence 2          100%    |    |
|  |                               |    |
|  | [ Complete & Save ]           |    |
|  +-------------------------------+    |
+---------------------------------------+
```

**기능:**

- **정답 등록**: 탭 전환 UI (Direct Input / PDF Upload)
  - Direct Input: 텍스트 입력, DB 저장, 자동 채점 연결
  - PDF Upload: 파일 영구 저장, 뷰어 제공, 재조회 가능
- **채점 결과**: 초록 계열 테마
  - 원형 프로그레스 링 (총점)
  - "Excellent!" + 이모지 피드백
  - 문장별 점수 (연한 초록 배경 행)
- **완료 버튼**: 초록색 "Complete & Save"
- 채점 전 완료 버튼 비활성화
- 완료 후 재채점 가능
- 채점 로직: 서버 사이드 API (추후 AI 채점 확장 고려) — 단순 단어 매칭 (대소문자/구두점 무시, 정규화 후 비교), LCS 기반 순서 보존 매칭

---

### 4-7. Review (복습)

```
+---------------------------------------+
|  Review Notes                         |
|                                       |
|  [All][Incorrect][Hard][Med][Easy]    |
|                                       |
|  +-------------------------------+    |
|  | Feb 12    Listening  Hard     |    |
|  | 60%  "The subway was very..." |    |
|  +-------------------------------+    |
|                                       |
|  +-------------------------------+    |
|  | Feb 10    Listening           |    |
|  | 75%  "It's already late..."   |    |
|  +-------------------------------+    |
|                                       |
|  +-------------------------------+    |
|  | Feb 09    Listening  Hard     |    |
|  | 40%  "It's usually crowded..." |   |
|  +-------------------------------+    |
|                                       |
| [🏠 Home]  [📖 Review]  [⚙️ Setting]|
+---------------------------------------+
```

**기능:**

- **필터**: 5개 Pill 버튼 — All / Incorrect / Hard / Med / Easy
- **카드 정보**: 날짜 + 정확도 badge + 모듈 태그 + 난이도 태그 + 문장 미리보기
- **정확도 색상**: Orange (60~75%), Red (40% 이하)
- 리스트 클릭 시 해당 문장의 오디오 구간과 입력/정답 확인
- MVP는 단순 리스트 구조

---

### 4-8. Settings (설정)

```
+---------------------------------------+
|  Settings                             |
|                                       |
|  Account: Admin                       |
|  - Change Password                >   |
|                                       |
|  Data                                 |
|  - Data Backup (JSON)             >   |
|                                       |
|  App Info                             |
|  - PWA Install Guide              >   |
|  - Version v1.0.0                 >   |
+---------------------------------------+
```

---

## 5. 기술 및 구현 가이드

### PWA (Progressive Web App)

- 하단 탭바 고정, 홈 화면 추가 유도
- **Manifest**: 앱 아이콘, 이름, 테마 색상 지정. `display: standalone` 설정 필수
- **Offline**: 오프라인 시에도 기본 UI(Skeleton)는 로드되도록 Service Worker 캐싱 전략 수립

### 데이터 저장소

- **Supabase** (PostgreSQL + Storage)
- 오디오/PDF 파일은 Supabase Storage에 저장

### 확장성 고려 (React Native 대비)

- **API First**: 비즈니스 로직(채점, 데이터 저장, 불러오기)은 모두 REST API로 분리
- **State Management**: 프론트엔드 상태는 UI 표시에만 집중
- **Component**: `AudioPlayer`, `DictationInput`, `ModuleCard`, `SourceSelector` 등 재사용 가능한 컴포넌트 단위로 개발

### 데이터 구조 (간소화)

- **User**: (Single) ID, PW
- **DayRecord**: Date, Status(Done/Fail), AverageScore
- **Sentence**: AudioSource(URL/File), UserInput, AnswerKey, Difficulty, Score
- **AudioFile**: FileName, FileType(MP3/WAV/M4A), FileURL, UploadedAt
