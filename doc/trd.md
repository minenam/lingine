# Lingine TRD (Technical Requirements Document)

> 버전: 1.0 | 작성일: 2026-02-18 | 참조: [SRD](./srd.md), [PRD](./prd.md)

---

## 1. 개요

본 문서는 Lingine MVP의 기술 구현 명세를 정의한다.
RESTful API 엔드포인트 설계와 채점 알고리즘 상세를 포함한다.

- **기술 스택**: Next.js (App Router) + Supabase (PostgreSQL + Storage)
- **인증**: bcrypt + JWT (httpOnly cookie)
- **API 기본 경로**: `/api`

---

## 2. RESTful API 명세

### 공통 규칙

- 모든 API는 JWT 인증 필요 (로그인, 로그아웃 제외)
- **인증 방식**: Route-level Helper — 각 route handler에서 `getAuthUser()` 호출
  ```typescript
  // lib/auth.ts
  export async function getAuthUser(): Promise<{ userId: string }>;
  // 실패 시 AuthError throw → route에서 catch하여 401 응답
  ```
- 요청 형식: `Content-Type: application/json` (파일 업로드 제외)
- 에러 응답 형식: `{ "error": { "code": string, "message": string } }`
- 에러 코드: `UNAUTHORIZED` | `INVALID_PASSWORD` | `EMPTY_PASSWORD` | `NOT_FOUND` | `VALIDATION_ERROR` | `FILE_TOO_LARGE` | `INVALID_FILE_TYPE` | `INVALID_URL` | `SCORING_ERROR` | `INTERNAL_ERROR`

---

### 2-1. 인증 (FR-01, FR-08-1)

#### `POST /api/users/login`

로그인

**Request:**

```json
{
  "password": "string"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "role": "user",
    "description": null
  }
}
```

- JWT를 httpOnly cookie에 설정 (`Set-Cookie` 헤더)

**Error (400):**

```json
{
  "error": { "code": "EMPTY_PASSWORD", "message": "Password is required" }
}
```

**Error (401):**

```json
{
  "error": { "code": "INVALID_PASSWORD", "message": "Incorrect password" }
}
```

---

#### `POST /api/users/logout`

로그아웃

**Response (200):**

```json
{
  "message": "Logged out"
}
```

- httpOnly cookie 삭제

---

#### `PATCH /api/users/:id`

사용자 정보 수정 (비밀번호 변경 포함)

**Request:**

```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "description": "string | null"
}
```

- 비밀번호 변경 시: `currentPassword` + `newPassword` 필수
- 메모 수정 시: `description`만 전달

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "role": "user",
    "description": "updated memo"
  }
}
```

**Error (401):**

```json
{
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "Current password is incorrect"
  }
}
```

---

### 2-2. 학습 기록 (FR-02, FR-03)

#### `POST /api/day-records`

학습 기록 생성 (upsert — 해당 날짜에 이미 있으면 기존 레코드 반환)

**Request:**

```json
{
  "date": "2026-02-13"
}
```

**Response (201 | 200):**

```json
{
  "dayRecord": {
    "id": "uuid",
    "date": "2026-02-13",
    "averageScore": null,
    "status": "pending"
  }
}
```

- 201: 새로 생성됨
- 200: 기존 레코드 반환 (이미 존재)

---

#### `GET /api/day-records?from=YYYY-MM-DD&to=YYYY-MM-DD`

기간별 학습 기록 조회

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| from | date | Yes | 시작 날짜 (YYYY-MM-DD) |
| to | date | Yes | 종료 날짜 (YYYY-MM-DD) |

**Response (200):**

```json
{
  "dayRecords": [
    {
      "id": "uuid",
      "date": "2026-02-13",
      "averageScore": 85,
      "status": "completed"
    }
  ]
}
```

---

#### `GET /api/day-records/:id`

특정 일자 학습 기록 조회 (세션 상세 포함)

**Response (200):**

```json
{
  "dayRecord": {
    "id": "uuid",
    "date": "2026-02-13",
    "averageScore": 85,
    "status": "completed",
    "sessions": [
      {
        "id": "uuid",
        "difficulty": "med",
        "totalScore": 85,
        "status": "completed",
        "audioSources": [
          { "id": "uuid", "type": "file", "fileName": "lecture01.mp3" },
          { "id": "uuid", "type": "file", "fileName": "lecture02.mp3" }
        ]
      }
    ]
  }
}
```

---

### 2-3. 오디오 소스 (FR-04)

#### `POST /api/audio-sources`

오디오 소스 등록

**파일 업로드 — Request (`multipart/form-data`):**
| Field | Type | Description |
|-------|------|-------------|
| dayRecordId | string | 소속 day_record ID |
| type | string | `"file"` |
| files | File[] | 오디오 파일 (MP3, WAV, M4A / 최대 50MB per file) |

**YouTube — Request (`application/json`):**

```json
{
  "dayRecordId": "uuid",
  "type": "youtube",
  "url": "https://youtu.be/xxxxx"
}
```

**Response (201):**

```json
{
  "audioSources": [
    {
      "id": "uuid",
      "type": "file",
      "fileName": "lecture01.mp3",
      "fileType": "mp3"
    }
  ]
}
```

**Validation:**

- 파일: MIME type (`audio/mpeg`, `audio/wav`, `audio/x-m4a`) + 50MB 제한
- YouTube: URL 정규식 — `/^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/`
- 에러: `FILE_TOO_LARGE` (413), `INVALID_FILE_TYPE` (400), `INVALID_URL` (400)

---

#### `GET /api/audio-sources/:id`

특정 오디오 소스 조회

**Response (200):**

```json
{
  "audioSource": {
    "id": "uuid",
    "type": "file",
    "storagePath": "audio/userId/2026-02-13/lecture01.mp3",
    "fileName": "lecture01.mp3",
    "fileType": "mp3",
    "createdAt": "2026-02-13T09:00:00Z"
  }
}
```

---

#### `DELETE /api/audio-sources/:id`

특정 오디오 소스 삭제

- Supabase Storage 파일 삭제 + DB 레코드 삭제

**Response (200):**

```json
{
  "message": "Audio source deleted"
}
```

---

### 2-4. Dictation 세션 (FR-05, FR-07)

#### `GET /api/dictation-sessions`

Dictation 세션 목록 조회 (Review 페이지용)

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| status | string | No | `completed` | 세션 상태 필터 |
| difficulty | string | No | - | `easy` \| `med` \| `hard` |
| keyword | string | No | - | `keyword` contains 검색 |
| maxScore | integer | No | - | 이 점수 미만 필터 (Incorrect: `maxScore=70`) |
| page | integer | No | 1 | 페이지 번호 (1-based) |
| limit | integer | No | 20 | 페이지당 항목 수 |

**Response (200):**

```json
{
  "sessions": [
    {
      "id": "uuid",
      "difficulty": "hard",
      "totalScore": 60,
      "status": "completed",
      "createdAt": "2026-02-12T09:00:00Z",
      "keyword": "cut it short",
      "audioSources": [
        { "id": "uuid", "type": "file", "fileName": "lecture01.mp3" }
      ],
      "previewText": "The subway was very..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

#### `POST /api/dictation-sessions`

Dictation 세션 생성

- 파일 N개 → 세션 1개 (session_audio_sources 중간 테이블로 연결)

**Request:**

```json
{
  "dayRecordId": "uuid",
  "audioSourceIds": ["uuid", "uuid"],
  "difficulty": "med",
  "keyword": "cut it short"
}
```

**Response (201):**

```json
{
  "session": {
    "id": "uuid",
    "dayRecordId": "uuid",
    "difficulty": "med",
    "status": "in_progress",
    "keyword": "cut it short",
    "audioSources": [
      { "id": "uuid", "type": "file", "fileName": "lecture01.mp3" },
      { "id": "uuid", "type": "file", "fileName": "lecture02.mp3" }
    ]
  }
}
```

---

#### `GET /api/dictation-sessions/:id`

특정 Dictation 세션 조회

**Response (200):**

```json
{
  "session": {
    "id": "uuid",
    "difficulty": "med",
    "userInput": "I have a dream...",
    "answerKey": "I have a dream that...",
    "keyword": "cut it short",
    "answerPdfPath": null,
    "totalScore": 92,
    "status": "completed",
    "audioSources": [
      {
        "id": "uuid",
        "type": "file",
        "fileName": "speech.mp3",
        "fileType": "mp3",
        "sourceUrl": "https://<supabase-url>/storage/v1/object/public/audio/..."
      }
    ],
    "sentences": [
      {
        "sentenceIndex": 1,
        "userText": "...",
        "answerText": "...",
        "score": 92
      }
    ]
  }
}
```

---

#### `PATCH /api/dictation-sessions/:id`

Dictation 세션 수정

**Request:**

```json
{
  "userInput": "updated text...",
  "difficulty": "hard",
  "keyword": "cut sth in half"
}
```

- `userInput`: 자동 저장 (debounce 3초, 실패 시 3초 간격 최대 3회 조용히 재시도)
- `difficulty`: 난이도 변경
- `keyword`: nullable 키워드 수정 (완료 상태에서도 수정 가능)

**Response (200):**

```json
{
  "session": {
    "id": "uuid",
    "userInput": "updated text...",
    "difficulty": "hard",
    "keyword": "cut sth in half",
    "updatedAt": "2026-02-13T09:05:00Z"
  }
}
```

---

#### `DELETE /api/dictation-sessions/:id`

특정 Dictation 세션 삭제

- 관련 sentences 레코드도 함께 삭제 (cascade)

**Response (200):**

```json
{
  "message": "Session deleted"
}
```

---

### 2-5. 채점 (FR-06)

#### `POST /api/dictation-sessions/:id/answer`

정답 데이터 업로드

**Direct Input — Request:**

```json
{
  "type": "manual",
  "answerKey": "I have a dream that one day..."
}
```

**PDF Upload — Request (`multipart/form-data`):**
| Field | Type | Description |
|-------|------|-------------|
| type | string | `"pdf"` |
| file | File | 정답 PDF 파일 (최대 10MB) |

- **PDF는 뷰어 전용**: 텍스트 자동 추출/채점 없음. 채점하려면 Direct Input으로 정답을 별도 입력해야 함

**Response (200):**

```json
{
  "session": {
    "id": "uuid",
    "answerKey": null,
    "answerPdfPath": "pdf/userId/2026-02-13/answer.pdf"
  }
}
```

---

#### `POST /api/dictation-sessions/:id/score`

채점 결과 생성

- 내부적으로 `userInput`과 `answerKey`를 사용하여 채점 알고리즘(섹션 3) 실행
- `keyword`는 메타데이터 필드이며 채점 입력에 포함하지 않음
- 결과를 `dictation_sessions` + `sentences` 테이블에 저장
- `day_records.average_score` 업데이트 (해당 날짜 전체 세션 평균)
- **day_records.status 전이**: 세션 하나라도 채점 완료 시 `completed`로 전환
- `answerKey`가 비어있으면 `SCORING_ERROR` (422) 반환

**Response (201):**

```json
{
  "result": {
    "totalScore": 92,
    "feedback": {
      "message": "Excellent!",
      "emoji": "🎉",
      "sub": "Almost perfect!"
    },
    "sentenceScores": [
      { "sentenceIndex": 1, "score": 92 },
      { "sentenceIndex": 2, "score": 100 }
    ]
  }
}
```

---

#### `GET /api/dictation-sessions/:id/score`

특정 세션 채점 결과 조회

**Response (200):**

```json
{
  "result": {
    "totalScore": 92,
    "feedback": {
      "message": "Excellent!",
      "emoji": "🎉",
      "sub": "Almost perfect!"
    },
    "sentenceScores": [
      {
        "sentenceIndex": 1,
        "userText": "...",
        "answerText": "...",
        "score": 92
      },
      {
        "sentenceIndex": 2,
        "userText": "...",
        "answerText": "...",
        "score": 100
      }
    ]
  }
}
```

---

#### `DELETE /api/dictation-sessions/:id/score`

특정 세션 채점 결과 삭제

- `sentences` 레코드 삭제
- `dictation_sessions.total_score` → null, `status` → `in_progress`로 복원
- `day_records.average_score` 재계산

**Response (200):**

```json
{
  "message": "Score deleted"
}
```

---

### 2-6. 데이터 백업 (FR-08-2)

#### `POST /api/backups`

전체 데이터 JSON 내보내기

**Response (200):**

```json
{
  "backup": {
    "exportedAt": "2026-02-13T09:00:00Z",
    "data": {
      "dayRecords": [],
      "dictationSessions": [],
      "sentences": [],
      "audioSources": []
    }
  }
}
```

- 파일 다운로드: `lingine-backup-YYYY-MM-DD.json`

---

## 3. 채점 알고리즘 명세

### 3-1. 전처리 (Normalization)

입력 텍스트(사용자 입력 & 정답) 각각에 동일 전처리 적용:

1. 줄바꿈(`\n`)으로 문장 분리
2. 각 문장에 대해:
   - 소문자 변환 (`toLowerCase`)
   - **축약형(contraction)**: 아포스트로피 제거 후 붙여쓰기 (`don't` → `dont`, `it's` → `its`, `I'm` → `im`)
   - **하이픈 단어**: 하이픈 제거 후 붙여쓰기 (`well-known` → `wellknown`, `e-mail` → `email`)
   - 구두점 제거 (`.`, `,`, `!`, `?`, `"`, `:`, `;` 등)
   - 특수문자 필터링 — 영숫자(a-z, 0-9)와 공백만 유지
   - 연속 공백을 단일 공백으로 정규화, 앞뒤 공백 제거 (`trim`)
3. 공백 기준으로 단어 배열 생성

**전처리 순서 중요**: 축약형/하이픈 처리 → 구두점 제거 → 특수문자 필터링 순서로 적용해야 `don't`이 `dont`(1단어)이 됨. 순서가 바뀌면 `don t`(2단어)이 되어 채점 결과가 달라짐.

### 3-2. 문장 매칭

- 정답 문장 수 기준으로 1:1 매칭 (순서대로)
- 사용자 입력 문장 수 < 정답 문장 수: 부족분은 빈 문자열(`""`)로 채움 → 해당 문장 0점
- 사용자 입력 문장 수 > 정답 문장 수: 초과분 무시

### 3-3. 단어 비교 (LCS 기반)

각 문장 쌍에 대해 LCS(Longest Common Subsequence) 알고리즘 적용:

- 단위: 단어 (공백 분리 토큰)
- 순서 보존: 사용자 입력에서 정답 단어가 올바른 순서로 등장하는 최대 개수
- 문장 점수 = `(LCS 매칭 단어 수 / 정답 단어 수) × 100` (반올림, 정수 %)

### 3-4. 총점 계산

- 전체 문장 점수의 단순 평균 (반올림, 정수 %)

### 3-5. 피드백 매핑

| 점수 구간 | 메시지      | 이모지 | 부가 텍스트                 |
| --------- | ----------- | ------ | --------------------------- |
| 90~100%   | Excellent!  | 🎉     | Almost perfect!             |
| 70~89%    | Great Job!  | 👏     | You missed a few nuances.   |
| 50~69%    | Keep Going! | 💪     | Review the tricky parts.    |
| 0~49%     | Try Again   | 📝     | Listen carefully and retry. |

### 3-6. 엣지 케이스

| 케이스                 | 처리                                                    |
| ---------------------- | ------------------------------------------------------- |
| 사용자 입력 비어있음   | 총점 0%, 피드백 "Try Again"                             |
| 정답 비어있음          | 채점 불가, `SCORING_ERROR` (422) 반환                   |
| 정답 단어 0개 (공백만) | 해당 문장 100% (비교 대상 없음)                         |
| 축약형 불일치          | `don't` vs `dont` — 전처리 후 동일하므로 100%           |
| 하이픈 불일치          | `well-known` vs `wellknown` — 전처리 후 동일하므로 100% |

---

## 4. 환경 변수

```env
# JWT
JWT_SECRET=                          # JWT 서명 키 (HS256)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=            # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # Supabase 익명 키 (클라이언트용)
SUPABASE_SERVICE_ROLE_KEY=           # Supabase 서비스 역할 키 (서버 전용)
```

---

## 5. Supabase Storage 설정

- **Bucket**: `audio` (public), `pdf` (public)
- **접근 방식**: Public URL (signed URL 미사용)
- **경로 규칙**:
  - 오디오: `audio/{userId}/{date}/{filename}`
  - PDF: `pdf/{userId}/{date}/{filename}`
- **용량 제한**: 오디오 50MB/file, PDF 10MB/file
