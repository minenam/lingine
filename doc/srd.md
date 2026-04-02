# Lingine SRD (Software Requirements Document)

> 버전: 1.0 | 작성일: 2026-02-18 | 참조: [PRD](./prd.md), [Design System](./design-system.md)

---

## 1. 개요

본 문서는 Lingine MVP의 소프트웨어 요구사항을 정의한다. AI 에이전트가 이 문서만으로 구현에 착수할 수 있는 수준을 목표로 한다.

- **MVP 범위**: 영어 듣기 Dictation 모듈 (Listening) 단일 기능
- **플랫폼**: Mobile-First 반응형 웹 + PWA
- **사용자**: 단일 사용자 (다중 사용자 미지원)
- **기술 스택**: Next.js (App Router) + Supabase (PostgreSQL + Storage)

---

## 2. 기능 요구사항

### FR-01 인증 (Login)

**입력**:

- 비밀번호 텍스트 (마스킹 처리)

**처리**:

1. `users` 테이블에서 단일 사용자 레코드 조회
2. 입력 비밀번호를 bcrypt로 해싱하여 저장된 해시와 비교
3. 일치 시 JWT 토큰 발급 (payload: `{ userId, iat, exp }`)
4. 토큰을 httpOnly cookie에 저장

**출력**:

- 성공: Dashboard로 리다이렉트
- 실패: "Incorrect password" 에러 메시지 표시

**세부 규칙**:

- 세션 유지: JWT 만료 전까지 자동 로그인 (재방문 시 비밀번호 입력 불필요)
- JWT 만료: 7일
- 비밀번호 미입력 시 Login 버튼 비활성화 (disabled 스타일 적용)
- PWA 설치 유도: 하단 "App to Home Screen" 텍스트 표시

---

### FR-02 대시보드 (Dashboard)

**입력**:

- 현재 날짜 (자동)
- 캘린더 월 이동: `<` / `>` 버튼
- 캘린더 뷰 토글: 월/연 텍스트 탭 시 주간 ↔ 월간 전환

**처리**:

1. 현재 월의 `day_records` 조회
2. 각 날짜별 상태 dot 색상 결정:
   - `average_score >= 70`: 초록 dot
   - `average_score < 70`: 레드 dot
   - 기록 없음: dot 없음
3. 월간 정확도 계산: 해당 월 전체 `day_records`의 `average_score` 평균

**출력**:

- 상단 인사말: "Hello, Learner"
- 캘린더: 기본 주간 뷰 (1주), 오늘 날짜 강조 (검정 원형 배경 + 흰색 텍스트)
- 월간 정확도 카드: 퍼센트 숫자 + 원형 프로그레스 링 + 피드백 라벨
- 학습 시작 카드: 오늘 학습 미완료 시 "TO DO" + "Start Learning", 완료 시 "DONE" + 점수 표시
- Bottom Nav: Home (활성) / Review / Settings

**피드백 라벨 매핑**:
| 점수 범위 | 라벨 |
|-----------|-------|
| 90-100% | Excellent |
| 70-89% | Good |
| 50-69% | Average |
| 0-49% | Needs Work |

**인터랙션**:

- 날짜 클릭 → Module Hub (해당 날짜)
- "Start Learning" 클릭 → Module Hub (오늘 날짜)

---

### FR-03 모듈 허브 (Module Hub)

**입력**:

- 선택된 날짜 (Dashboard에서 전달)

**처리**:

1. 해당 날짜의 `day_records` 조회 — **없으면 자동 생성 (upsert)**
2. 관련 `dictation_sessions` 조회
3. Listening 모듈 상태 결정:
   - 세션 없음: "Not Started"
   - 세션 있고 미채점: "In Progress"
   - 채점 완료: "Completed (N%)" (점수 표시)

**출력**:

- 헤더: `< Feb 13, 2026` (뒤로 가기 + 날짜)
- 서브텍스트: "Select a module to start"
- Listening 카드: 활성 상태 (White 카드, 초록 마이크 아이콘, 초록 dot, 상태 텍스트)
- Vocabulary / Reading / Writing 카드: 비활성 (회색 카드, 잠금 아이콘, 클릭 불가)

**인터랙션**:

- Listening 카드 클릭:
  - 완료 세션 존재 시 해당 세션 Result로 이동
  - 진행 중 세션 존재 시 해당 세션 Dictation으로 이동
  - 세션 없음 시 Listening Setup으로 이동

**day_records 자동 생성 규칙**:

- Module Hub 진입 시 해당 날짜의 day_record가 없으면 `POST /api/day-records` (upsert) 호출
- 초기 상태: `status: 'pending'`, `average_score: null`

---

### FR-04 Listening Setup (음원 소스 등록)

**입력**:

- 오디오 파일 업로드 (MP3, WAV, M4A) — 다중 파일 지원
- YouTube URL 입력

**처리 — 파일 업로드**:

1. 파일 형식 검증 (MIME type: `audio/mpeg`, `audio/wav`, `audio/x-m4a`)
2. 파일 크기 검증 (최대 50MB per file)
3. Supabase Storage에 업로드 (`audio/{userId}/{date}/{filename}`)
4. `audio_sources` 테이블에 레코드 생성 (type: `file`, storage_path, file_name, file_type)
5. Storage 접근: **Public URL** 사용 (bucket을 public으로 설정)

**처리 — YouTube**:

1. URL 형식 검증 — 허용 패턴:
   - `youtube.com/watch?v=`
   - `youtu.be/`
   - `youtube.com/embed/`
   - `youtube.com/shorts/`
   - 정규식: `/^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/`
2. `audio_sources` 테이블에 레코드 생성 (type: `youtube`, url)
3. YouTube iframe embed용 video ID 추출 (11자리)

**출력**:

- 초기 상태: 소스 선택 카드 2개 (Upload Audio File / YouTube Link)
- 파일 업로드 선택 시: 드래그 영역 + 파일 리스트 (파일명 + 삭제 버튼) + "Add Audio File" 추가 영역 + "Start Learning (N)" 버튼
- YouTube 선택 시: URL 입력 필드 + "Load Video" 버튼

**인터랙션**:

- "Start Learning" / "Load Video" 클릭 → Dictation 화면으로 이동
- 파일 삭제 버튼: Storage에서 파일 삭제 + `audio_sources` 레코드 삭제

---

### FR-05 Dictation (받아쓰기)

**입력**:

- 난이도 선택: Easy / Med / Hard (Pill 버튼, 기본값: Med)
- 텍스트 입력: 단일 textarea (`\n`으로 문장 구분)
- 키워드 입력: 단일 input (`keyword`, nullable)
- 오디오 재생 컨트롤

**처리**:

1. Dictation 화면 진입 시 `dictation_sessions` 레코드 생성 (status: `in_progress`)
2. 오디오 소스 로드:
   - 파일: Supabase Storage URL로 `<audio>` 태그 재생
   - YouTube: iframe embed 재생 (YouTube IFrame API)
3. 자동 저장: 텍스트 입력 변경 시 debounce 3초 후 `dictation_sessions.user_input` 업데이트
   - **실패 시 재시도**: 네트워크 실패 시 3초 간격으로 최대 3회 조용히 재시도, 3회 모두 실패 시 다음 debounce에서 재시도
4. 난이도 변경 시 `dictation_sessions.difficulty` 업데이트 (완료 상태에서도 수정 가능)
5. 키워드 변경 시 `dictation_sessions.keyword` 업데이트 (완료 상태에서도 수정 가능)

**출력**:

- 헤더: `<` 뒤로 가기 + "Full Dictation" + 난이도 Pill 버튼
- 오디오 플레이어: Sticky 위치 (스크롤 시에도 접근 가능)
  - 파일: 기본 오디오 플레이어 (재생/일시정지, 탐색바, 재생 속도)
  - 다중 파일: **파일별 개별 재생** — 파일 리스트에서 선택하면 해당 파일 재생 (프론트에서 현재 선택 파일 관리)
  - YouTube: iframe 임베드
- 텍스트 입력 영역: White 카드, 큰 textarea, placeholder "Type what you hear..."
- 하단: 정답 등록 & 채점 영역 (FR-06)

**난이도 정의** (태그/분류 목적, 학습 방식은 동일):
| 난이도 | 설명 |
|--------|------|
| Easy | 쉬운 소재 |
| Med | 보통 소재 |
| Hard | 어려운 소재 |

---

### FR-06 정답 등록 & 채점 (Result)

**입력**:

- 정답 텍스트: Direct Input (textarea, `\n`으로 문장 구분)
- 정답 PDF: 파일 업로드
- "Check Answer" 버튼 (Direct Input 시)

**처리 — Direct Input**:

1. 정답 텍스트를 `dictation_sessions.answer_key`에 저장
2. 채점 API 호출: `POST /api/dictation-sessions/:id/score`
   - Path Param: `id` (채점 대상 session ID)
   - Request Body: 없음 (세션에 저장된 `user_input`, `answer_key` 사용)
   - 채점 로직: 하단 섹션 5 "채점 알고리즘 명세" 참조
   - Response: `{ totalScore, sentenceScores[], feedback }`
3. 채점 결과를 `dictation_sessions`에 저장 (total_score, status: `completed`)
4. 문장별 결과를 `sentences` 테이블에 저장

**처리 — PDF Upload**:

1. PDF 파일을 Supabase Storage에 업로드 (`pdf/{userId}/{date}/{filename}`)
2. `dictation_sessions.answer_pdf_path`에 경로 저장
3. **PDF는 뷰어로만 제공** — 텍스트 자동 추출/채점 없음
4. 채점하려면 사용자가 PDF를 보면서 Direct Input 탭에 정답을 직접 입력해야 함

**출력**:

- 탭 전환 UI: "Direct Input" / "PDF Upload" (선택 탭 하단 border 강조)
- Direct Input: textarea + "Check Answer" 버튼
- PDF Upload: 파일 선택 영역 + 업로드된 PDF 뷰어
- 채점 결과 카드 (초록 계열):
  - 피드백 메시지 + 이모지 (섹션 5 채점 알고리즘 명세 참조)
  - 원형 프로그레스 링 (총점 %)
  - 문장별 점수 리스트 (연한 초록 배경 행)
- "Complete & Save" 버튼 (초록색, 채점 전 비활성화)
- Result 화면에서도 `keyword` 수정 가능 (nullable, 미입력 시 숨김)

**채점 결과 저장 후**:

- `day_records` 업데이트: 해당 날짜의 모든 세션 평균 점수를 `average_score`에 반영
- **day_records.status 전이**: 세션 하나라도 채점 완료(`completed`) 시 day_record도 `completed`로 전환
- 완료 후 정답/PDF/채점은 수정 불가 (잠금), `difficulty`/`keyword`만 수정 가능
- `keyword`는 메타데이터 필드이며 채점 로직(`user_input`, `answer_key`)에서 제외

---

### FR-07 복습 (Review)

**입력**:

- 필터 선택: All / Incorrect / Hard / Med / Easy (Pill 버튼, 기본값: All)
- 키워드 검색: contains 매칭 (`keyword` nullable, 미입력 제외)

**처리**:

1. `dictation_sessions` + `audio_sources` 조인 조회 (status: `completed`)
2. 필터 적용:
   - All: 전체
   - Incorrect: `total_score < 70`
   - Hard / Med / Easy: `difficulty` 필터
   - Keyword: `keyword` contains 필터 (`ILIKE '%keyword%'`)
3. 최신순 정렬 (created_at DESC)
4. **offset 기반 페이지네이션**: `page` (기본 1), `limit` (기본 20)

**출력**:

- 헤더: "Review Notes"
- 필터 Pill 버튼 (5개)
- 카드 리스트:
  - 날짜 + 정확도 badge (점수 %)
  - 모듈 태그 ("Listening") + 난이도 태그
  - 키워드 태그 (`keyword`가 있을 때만 표시, null/빈 값은 숨김)
  - 문장 미리보기 (첫 문장의 첫 30자 + "...")
  - 정확도 색상: >= 70% Green, 50-69% Orange, < 50% Red

**인터랙션**:

- 카드 클릭 → 해당 세션 Result 화면으로 이동

---

### FR-08 설정 (Settings)

**FR-08-1 비밀번호 변경**:

- 입력: 현재 비밀번호, 새 비밀번호, 새 비밀번호 확인
- 처리: 현재 비밀번호 bcrypt 검증 → 새 비밀번호 bcrypt 해싱 → `users.password_hash` 업데이트
- 출력: 성공/실패 피드백 메시지

**FR-08-1b 사용자 메모(description) 수정**:

- 입력: Description 텍스트 (빈 문자열 허용, 빈 값은 `null` 저장)
- 처리: `PATCH /api/users/:id`로 `users.description` 업데이트
- 출력: 저장 성공/실패 피드백 메시지

**FR-08-2 데이터 백업 (JSON Export)**:

- 입력: "Export Data" 버튼
- 처리: 전체 데이터 조회 (day_records, dictation_sessions, sentences, audio_sources 메타데이터)
- 출력: JSON 파일 다운로드 (`lingine-backup-{YYYY-MM-DD}.json`)

**FR-08-3 앱 정보**:

- PWA Install Guide: 브라우저별 홈 화면 추가 안내
- Version: 앱 버전 표시

**FR-08-4 로그아웃**:

- 입력: "Logout" 버튼 클릭 → confirm 다이얼로그 확인
- 처리: `POST /api/users/logout` 호출 (httpOnly 쿠키 삭제)
- 출력: `/login` 페이지로 리다이렉트

---

## 3. 공통 기술 규칙

### 환경 변수

| 변수명                          | 용도                                |
| ------------------------------- | ----------------------------------- |
| `JWT_SECRET`                    | JWT 서명 키 (HS256)                 |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase 프로젝트 URL               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 (클라이언트용)     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase 서비스 역할 키 (서버 전용) |

### 인증 방식

- **Route-level Helper 패턴**: `lib/auth.ts`에 `getAuthUser()` 함수 구현
- Node.js Runtime에서 `jsonwebtoken` 라이브러리로 JWT 검증
- 각 API route handler에서 `getAuthUser()` 호출하여 인증
- 반환값: `{ userId: string }`
- 인증 실패 시 `AuthError` throw → route에서 401 응답

### 에러 코드 체계

| 코드                | HTTP | 설명                                   |
| ------------------- | ---- | -------------------------------------- |
| `UNAUTHORIZED`      | 401  | JWT 없음 또는 만료                     |
| `INVALID_PASSWORD`  | 401  | 비밀번호 불일치                        |
| `EMPTY_PASSWORD`    | 400  | 비밀번호 미입력                        |
| `NOT_FOUND`         | 404  | 리소스 없음                            |
| `VALIDATION_ERROR`  | 400  | 입력값 유효성 실패                     |
| `FILE_TOO_LARGE`    | 413  | 파일 크기 초과 (오디오 50MB, PDF 10MB) |
| `INVALID_FILE_TYPE` | 400  | 허용되지 않은 파일 형식                |
| `INVALID_URL`       | 400  | YouTube URL 형식 오류                  |
| `SCORING_ERROR`     | 422  | 채점 불가 (정답 비어있음 등)           |
| `INTERNAL_ERROR`    | 500  | 서버 내부 오류                         |

에러 응답 형식:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

## 4. 비기능 요구사항

### NFR-01 성능

- API 응답 시간: 500ms 이내 (채점 API 포함)
- 오디오 파일 최대 크기: 50MB
- PDF 파일 최대 크기: 10MB
- 자동 저장 debounce: 3초

### NFR-02 보안

- 비밀번호: bcrypt 해싱 (salt rounds: 10)
- JWT: httpOnly cookie, 만료 7일, HS256 서명
- API 라우트: Route-level `getAuthUser()` helper로 JWT 검증
- 파일 업로드: MIME type 검증 + 확장자 검증

### NFR-03 PWA

- `manifest.json`: `display: standalone`, `start_url: "/dashboard"`, 앱 아이콘, 테마 색상 (Dark Navy #1A1A2E)
- Service Worker 캐싱 전략:
  - **Navigation 요청(HTML 페이지)**: Network-First (네트워크 우선 → 실패 시 캐시 fallback)
  - **정적 자산(JS, CSS, 이미지 등)**: Cache-First (캐시 우선 → 미스 시 네트워크 fetch 후 캐싱)
- 오프라인: 기본 UI skeleton 표시 (데이터 기능은 온라인 필수)

### NFR-04 호환성

- 모바일 브라우저: Chrome (Android), Safari (iOS)
- 뷰포트: iPhone 15 Pro 기준 (393 x 852)
- 키보드 최적화: textarea 입력 시 키보드에 가려지지 않도록 스크롤 조정

### NFR-05 접근성

- 오디오 플레이어: Sticky 고정 (스크롤 시에도 항상 접근 가능)
- 버튼 최소 터치 영역: 44x44px

### NFR-06 내비게이션 일관성

- Dashboard를 제외한 주요 학습 화면(Module Hub, Listening Setup, Dictation, Result, Review)은 상단 `<` 뒤로가기 헤더를 제공
- Login/Dashboard를 제외한 주요 화면에 Bottom Nav(Home/Review/Settings)를 제공

---

## 5. 데이터 모델

### users

| Column        | Type         | Constraints                   | Description            |
| ------------- | ------------ | ----------------------------- | ---------------------- |
| id            | uuid         | PK, default gen_random_uuid() | 사용자 ID              |
| password_hash | text         | NOT NULL                      | bcrypt 해싱된 비밀번호 |
| description   | varchar(255) | nullable                      | 사용자 메모            |
| role          | varchar(50)  | NOT NULL, default 'user'      | 사용자 역할            |
| created_at    | timestamptz  | default now()                 | 생성일                 |
| updated_at    | timestamptz  | default now()                 | 수정일                 |

### day_records

| Column        | Type        | Constraints                     | Description              |
| ------------- | ----------- | ------------------------------- | ------------------------ |
| id            | uuid        | PK, default gen_random_uuid()   | 레코드 ID                |
| user_id       | uuid        | FK → users.id, NOT NULL         | 사용자 ID                |
| date          | date        | NOT NULL, UNIQUE(user_id, date) | 학습 날짜                |
| average_score | integer     | nullable, 0-100                 | 해당 날짜 평균 점수      |
| status        | text        | NOT NULL, default 'pending'     | 'pending' \| 'completed' |
| created_at    | timestamptz | default now()                   | 생성일                   |

### audio_sources

| Column        | Type        | Constraints                   | Description                  |
| ------------- | ----------- | ----------------------------- | ---------------------------- |
| id            | uuid        | PK, default gen_random_uuid() | 소스 ID                      |
| day_record_id | uuid        | FK → day_records.id, NOT NULL | 소속 day_record              |
| type          | text        | NOT NULL                      | 'file' \| 'youtube'          |
| storage_path  | text        | nullable                      | Supabase Storage 경로 (file) |
| url           | text        | nullable                      | YouTube URL                  |
| file_name     | text        | nullable                      | 원본 파일명                  |
| file_type     | text        | nullable                      | 'mp3' \| 'wav' \| 'm4a'      |
| created_at    | timestamptz | default now()                 | 생성일                       |

### dictation_sessions

| Column          | Type        | Constraints                     | Description                        |
| --------------- | ----------- | ------------------------------- | ---------------------------------- |
| id              | uuid        | PK, default gen_random_uuid()   | 세션 ID                            |
| day_record_id   | uuid        | FK → day_records.id, NOT NULL   | 소속 day_record                    |
| difficulty      | text        | NOT NULL, default 'med'         | 'easy' \| 'med' \| 'hard'          |
| user_input      | text        | nullable                        | 사용자 받아쓰기 입력               |
| answer_key      | text        | nullable                        | 정답 텍스트                        |
| keyword         | text        | nullable                        | 세션 키워드(메타데이터, 채점 제외) |
| answer_pdf_path | text        | nullable                        | 정답 PDF Storage 경로              |
| total_score     | integer     | nullable, 0-100                 | 총점                               |
| status          | text        | NOT NULL, default 'in_progress' | 'in_progress' \| 'completed'       |
| created_at      | timestamptz | default now()                   | 생성일                             |
| updated_at      | timestamptz | default now()                   | 수정일                             |

### session_audio_sources (중간 테이블)

| Column          | Type        | Constraints                          | Description    |
| --------------- | ----------- | ------------------------------------ | -------------- |
| id              | uuid        | PK, default gen_random_uuid()        | ID             |
| session_id      | uuid        | FK → dictation_sessions.id, NOT NULL | 세션 ID        |
| audio_source_id | uuid        | FK → audio_sources.id, NOT NULL      | 오디오 소스 ID |
| created_at      | timestamptz | default now()                        | 생성일         |

- UNIQUE(session_id, audio_source_id) 복합 유니크 제약

### sentences

| Column         | Type        | Constraints                          | Description         |
| -------------- | ----------- | ------------------------------------ | ------------------- |
| id             | uuid        | PK, default gen_random_uuid()        | 문장 ID             |
| session_id     | uuid        | FK → dictation_sessions.id, NOT NULL | 소속 세션           |
| sentence_index | integer     | NOT NULL                             | 문장 순서 (1-based) |
| user_text      | text        | NOT NULL                             | 사용자 입력 문장    |
| answer_text    | text        | NOT NULL                             | 정답 문장           |
| score          | integer     | NOT NULL, 0-100                      | 문장별 점수         |
| created_at     | timestamptz | default now()                        | 생성일              |

### 테이블 관계

```
users (1) → (N) day_records (1) → (N) audio_sources
                             (1) → (N) dictation_sessions (1) → (N) sentences
                                            (N) ↔ (N) audio_sources
                                          [session_audio_sources 중간 테이블]
```

---

> API 명세 및 채점 알고리즘은 [TRD](./trd.md) 참조

---

## 6. 제약사항 & MVP 제외 범위

### MVP 제외

- Vocabulary / Reading / Writing 모듈 (UI 카드만 표시, 기능 없음)
- 다중 사용자 / 회원가입
- 오프라인 학습 (오프라인 시 skeleton UI만 표시)
- AI 기반 채점 (추후 확장 고려, 현재는 LCS 단어 매칭)
- 오디오 구간 반복 재생 / 구간 북마크
- YouTube 오디오 추출 (iframe 임베드 재생만 지원)

### 기술 제약

- Supabase Storage 무료 티어: 1GB
- Supabase Database 무료 티어: 500MB
- YouTube iframe: 모바일 브라우저 자동 재생 제한 (사용자 인터랙션 필요)
