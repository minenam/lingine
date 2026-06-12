# React Query Migration Plan

> 목적: Lingine의 서버 상태 관리를 TanStack Query(React Query) 기반으로 전환한다. 이 문서는 어떤 LLM/개발자가 보더라도 현재 코드베이스에서 바로 작업을 시작할 수 있도록 구현 순서, 파일 범위, 쿼리 키, mutation invalidation, 검증 기준을 정의한다.

## 1. 배경

현재 프로젝트는 서버 데이터를 각 client component에서 직접 `fetch`하고, `isLoading`, `errorMessage`, `reloadToken`, stale data 유지, retry 등을 화면별로 수동 관리한다.

대표 파일:

- `src/components/dashboard/useDashboard.ts`
- `src/components/review/ReviewSessions.tsx`
- `src/components/module-hub/useModuleHub.ts`
- `src/components/listening/useListeningSetup.ts`
- `src/components/dictation/DictationEditor.tsx`
- `src/components/result/ResultKeywordEditor.tsx`

이 방식은 기능은 동작하지만 다음 문제가 있다.

- 화면 이동 시 서버 상태 캐시가 보존되지 않는다.
- 동일 API 호출 로직과 에러 처리가 중복된다.
- mutation 이후 관련 목록/상세 갱신이 명시적으로 연결되어 있지 않다.
- loading과 background fetching 구분이 약하다.
- PWA 환경에서는 Service Worker/API 캐시 정책과 client state 정책을 분리해 관리해야 한다.

이미 수행된 보수적 최신성 조치:

- `public/sw.js`에서 `/api/*` 요청은 Service Worker 캐시를 우회한다.
- 주요 GET API는 `Cache-Control: no-store` 응답을 사용한다.
- 주요 client GET fetch에는 `cache: 'no-store'`가 붙어 있다.

React Query 도입 후에도 위 조치는 유지한다. React Query는 앱 메모리 캐시이고, Service Worker는 네트워크 계층 캐시이므로 역할이 다르다.

## 2. 목표

### 2-1. 기능 목표

- Dashboard, Review, Module Hub, Listening Setup, Dictation, Result의 서버 데이터 조회를 `useQuery`로 전환한다.
- 생성/수정/삭제/업로드/채점 API 호출을 `useMutation`으로 전환한다.
- mutation 성공 시 관련 query를 정확히 invalidate한다.
- 이전 데이터를 유지한 상태에서 background refetch가 가능하게 한다.
- 수동 `reloadToken` 기반 retry를 제거하고 `refetch()`를 사용한다.
- API 에러 파싱과 `cache: 'no-store'` 설정을 공통화한다.

### 2-2. 비목표

- Redux/Zustand 같은 client global state store 도입은 하지 않는다.
- textarea 입력값, 현재 선택 탭, 파일 선택값 같은 즉시 UI state는 React Query로 옮기지 않는다.
- Service Worker 전략을 React Query로 대체하지 않는다.
- API route의 도메인 로직을 대규모 리팩터링하지 않는다.

## 3. 설치 패키지

필수:

```bash
pnpm add @tanstack/react-query
```

선택:

```bash
pnpm add -D @tanstack/react-query-devtools
```

Devtools는 개발 편의용이다. MVP 전환에서는 필수가 아니다.

## 4. 권장 파일 구조

추가할 파일:

```txt
src/
├── app/
│   └── providers.tsx
├── lib/
│   ├── apiClient.ts
│   └── queryKeys.ts
├── hooks/
│   ├── queries/
│   │   ├── useAudioSourcesQuery.ts
│   │   ├── useDayRecordsQuery.ts
│   │   ├── useDictationSessionQuery.ts
│   │   ├── useModuleHubQuery.ts
│   │   └── useReviewSessionsQuery.ts
│   └── mutations/
│       ├── useAudioSourceMutations.ts
│       ├── useDayRecordMutations.ts
│       ├── useDictationSessionMutations.ts
│       └── useScoreMutations.ts
```

기존 파일에서 단계적으로 제거/축소할 것:

- `src/components/dashboard/useDashboard.ts`
- `src/components/module-hub/useModuleHub.ts`
- `src/components/listening/useListeningSetup.ts`
- `src/components/review/ReviewSessions.tsx` 내부 fetch 로직
- `src/components/dictation/DictationEditor.tsx` 내부 상세 fetch/update fetch 로직
- `src/components/result/ResultKeywordEditor.tsx` 내부 상세 fetch/update/score fetch 로직

## 5. Provider 설정

### 5-1. `src/app/providers.tsx`

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            gcTime: 1000 * 60 * 10,
            retry: 1,
            refetchOnMount: 'always',
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### 5-2. `src/app/layout.tsx`

`PwaRegister`는 유지하고, `Providers`로 children을 감싼다.

```tsx
<body>
  <PwaRegister />
  <Providers>{children}</Providers>
</body>
```

주의:

- provider는 client component여야 한다.
- `QueryClient`를 render마다 새로 만들지 않도록 `useState(() => new QueryClient(...))`를 사용한다.

## 6. API Client

### 6-1. `src/lib/apiClient.ts`

역할:

- 모든 client fetch에 `cache: 'no-store'` 기본 적용
- JSON 파싱 통일
- `{ error: { message } }` 응답을 `ApiError`로 변환

권장 구현:

```ts
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(input, {
    cache: 'no-store',
    ...init,
    headers: {
      ...init.headers,
    },
  });

  const payload = (await response.json()) as T | ApiErrorPayload;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload;
    throw new ApiError(
      errorPayload.error?.message ?? 'Request failed',
      response.status,
      errorPayload.error?.code,
    );
  }

  return payload as T;
}
```

주의:

- `FormData` 요청에는 `Content-Type`을 직접 지정하지 않는다.
- JSON mutation에서만 `Content-Type: application/json`을 명시한다.

## 7. Query Keys

### 7-1. `src/lib/queryKeys.ts`

모든 query key는 한 곳에서 생성한다.

```ts
export const queryKeys = {
  dayRecords: {
    all: ['dayRecords'] as const,
    range: (from: string, to: string) =>
      [...queryKeys.dayRecords.all, 'range', from, to] as const,
    date: (date: string) =>
      [...queryKeys.dayRecords.all, 'date', date] as const,
  },
  dictationSessions: {
    all: ['dictationSessions'] as const,
    list: (params: {
      status?: string;
      difficulty?: string;
      maxScore?: number;
      keyword?: string;
      dayRecordId?: string;
      page?: number;
      limit?: number;
    }) => [...queryKeys.dictationSessions.all, 'list', params] as const,
    detail: (sessionId: string) =>
      [...queryKeys.dictationSessions.all, 'detail', sessionId] as const,
    score: (sessionId: string) =>
      [...queryKeys.dictationSessions.detail(sessionId), 'score'] as const,
  },
  audioSources: {
    all: ['audioSources'] as const,
    byDayRecord: (dayRecordId: string) =>
      [...queryKeys.audioSources.all, 'dayRecord', dayRecordId] as const,
  },
};
```

주의:

- list params 객체는 안정적인 key가 되도록 undefined와 빈 문자열 처리 방식을 통일한다.
- 검색 keyword는 trim한 값을 key에 넣는다.

## 8. Query Hooks

### 8-1. `useDayRecordsQuery`

대상 API:

- `GET /api/day-records?from=YYYY-MM-DD&to=YYYY-MM-DD`

반환 데이터:

```ts
type DayRecordsResponse = {
  dayRecords: DayRecord[];
  monthlyAverageScore: number | null;
};
```

구현 방향:

- `queryKeys.dayRecords.range(from, to)` 사용
- `placeholderData: (previousData) => previousData`로 월 이동 중 이전 데이터 유지
- Dashboard의 `reloadToken` 제거
- `retry` 버튼은 `query.refetch()` 호출

### 8-2. `useReviewSessionsQuery`

대상 API:

- `GET /api/dictation-sessions?status=completed&page=1&limit=20&...`

구현 방향:

- keyword debounce는 UI component 또는 별도 `useDebouncedValue` hook에서 유지
- query key에 filter와 debounced keyword를 포함
- `placeholderData: (previousData) => previousData`
- `isPending`은 첫 로딩, `isFetching`은 background refresh indicator에 사용

### 8-3. `useModuleHubQuery`

현재 Module Hub는 다음 순서를 가진다.

1. 선택 날짜의 day record 조회
2. 없으면 day record 생성
3. 해당 day record의 dictation sessions 조회

권장 구현:

- `useQuery` 하나로 orchestration을 담당해도 된다.
- 내부 queryFn에서 `GET day-records`, 필요 시 `POST day-records`, `GET dictation-sessions` 순서로 처리한다.
- 성공 후 생성된 day record가 있으면 `queryClient.invalidateQueries({ queryKey: queryKeys.dayRecords.all })` 또는 `setQueryData`를 고려한다.

반환 데이터:

```ts
type ModuleHubData = {
  dayRecord: DayRecord;
  sessions: Session[];
  listeningStatus: ListeningStatus;
};
```

주의:

- 자동 생성이 포함되어 있어 순수 GET query가 아니다.
- 장기적으로는 page/server action 또는 explicit mutation으로 분리할 수 있지만, 1차 migration에서는 기존 동작 보존을 우선한다.

### 8-4. `useAudioSourcesQuery`

대상 API:

- `GET /api/audio-sources?dayRecordId=...`

사용 위치:

- Listening Setup

구현 방향:

- `queryKeys.audioSources.byDayRecord(dayRecordId)` 사용
- 파일/YouTube 업로드, 삭제 성공 시 해당 key invalidate

### 8-5. `useDictationSessionQuery`

대상 API:

- `GET /api/dictation-sessions/:id`

사용 위치:

- Dictation
- Result

구현 방향:

- `queryKeys.dictationSessions.detail(sessionId)` 사용
- Dictation/Result 모두 같은 상세 cache를 공유한다.
- Result 진입 시 keyword가 사라지는 문제는 `Next` flush 저장과 상세 query refetch로 함께 방어한다.

## 9. Mutation Hooks

### 9-1. `useUpdateSessionMutation`

대상 API:

- `PATCH /api/dictation-sessions/:id`

payload:

```ts
type UpdateSessionPayload = {
  userInput?: string | null;
  difficulty?: 'easy' | 'med' | 'hard';
  keyword?: string | null;
};
```

성공 시 처리:

- `queryKeys.dictationSessions.detail(sessionId)` invalidate 또는 `setQueryData`
- keyword/difficulty만 바뀌는 경우 Review list에도 영향이 있으므로 completed session일 수 있으면 `queryKeys.dictationSessions.all` invalidate

사용 위치:

- Dictation auto-save
- Dictation `Next` flush
- Result metadata save
- Result `Complete & Save`

주의:

- auto-save는 mutation을 쓰되, 입력 이벤트마다 `mutate`를 바로 호출하지 않는다.
- 기존 3초 debounce와 retry 정책은 유지하거나 명확히 조정한다.

### 9-2. `useCreateSessionMutation`

대상 API:

- `POST /api/dictation-sessions`

성공 시 처리:

- 해당 dayRecordId의 session list invalidate
- `queryKeys.dictationSessions.all` invalidate
- Module Hub query invalidate

### 9-3. `useAudioSourceMutations`

대상 API:

- `POST /api/audio-sources` file upload
- `POST /api/audio-sources` YouTube
- `DELETE /api/audio-sources/:id`

성공 시 처리:

- `queryKeys.audioSources.byDayRecord(dayRecordId)` invalidate
- Module Hub 관련 query는 보통 session 생성 전에는 영향이 적지만, setup 재진입 시 최신 소스가 필요하므로 audio source query invalidate가 필수다.

### 9-4. `useAnswerMutation`

대상 API:

- `POST /api/dictation-sessions/:id/answer` manual
- `POST /api/dictation-sessions/:id/answer` pdf

성공 시 처리:

- `queryKeys.dictationSessions.detail(sessionId)` invalidate

### 9-5. `useScoreSessionMutation`

대상 API:

- `POST /api/dictation-sessions/:id/score`
- `GET /api/dictation-sessions/:id/score`
- `DELETE /api/dictation-sessions/:id/score`

성공 시 처리:

- `queryKeys.dictationSessions.detail(sessionId)` invalidate
- `queryKeys.dictationSessions.score(sessionId)` invalidate
- `queryKeys.dictationSessions.all` invalidate
- `queryKeys.dayRecords.all` invalidate

중요:

- 현재 `POST /score`가 세션을 `completed`로 바꾼다.
- `Complete & Save`는 현재 상태 전이를 하지 않고 metadata save만 수행한다.
- 이 제품 의미가 맞는지 별도 결정이 필요하다.

## 10. 화면별 Migration 순서

### Phase 1. 인프라 추가

작업:

- `@tanstack/react-query` 설치
- `src/app/providers.tsx` 생성
- `src/app/layout.tsx`에 provider 연결
- `src/lib/apiClient.ts` 생성
- `src/lib/queryKeys.ts` 생성

검증:

- `pnpm typecheck`
- `pnpm lint`
- 앱이 정상 렌더링되는지 확인

### Phase 2. Dashboard 전환

작업:

- `useDayRecordsQuery` 추가
- `useDashboard`에서 직접 fetch, `reloadToken`, manual retry 제거
- `CalendarCard`의 `onRetry`는 `refetch` 사용
- initialData는 필요하면 `initialData` 또는 `placeholderData`로 연결한다.

주의:

- 현재 `DashboardPage` 서버 선패치가 있다.
- React Query hydration까지 하지 않는다면, 단순히 client query가 mount 후 refetch하도록 둬도 된다.
- SSR hydration을 도입하지 않을 경우 `initialData`를 query initialData로 넘기는 방식을 고려한다.

검증:

- 대시보드 최초 진입
- 월 이동
- 완료 세션 생성 후 dashboard 재진입
- PWA 새로고침 후 최신 점수 표시

### Phase 3. Review 전환

작업:

- `useReviewSessionsQuery` 추가
- `ReviewSessions` 내부 fetch effect 제거
- `reloadToken` 제거
- retry는 `refetch`
- background fetching 중 기존 list 유지

검증:

- All/Incorrect/Hard/Med/Easy 필터
- keyword 검색
- completed session scoring 후 Review list 최신 반영
- PWA 새로고침 후 최신 list 표시

### Phase 4. Module Hub 전환

작업:

- `useModuleHubQuery` 추가
- `useModuleHub` 내부 fetch effect 제거 또는 hook 자체 교체
- day record 자동 생성 동작 유지
- Listening 상태 계산은 hook 또는 pure function으로 유지

검증:

- 기록 없는 날짜 진입 시 day record 생성
- 진행 중 session 있으면 Dictation으로 이동
- completed session 있으면 Result로 이동
- session 생성/채점 후 허브 상태 최신화

### Phase 5. Listening Setup 전환

작업:

- `useAudioSourcesQuery` 추가
- audio upload / YouTube load / delete를 mutation으로 전환
- session create를 mutation으로 전환
- upload/delete 성공 시 audio source query invalidate

검증:

- 파일 다중 업로드 후 목록 즉시 반영
- 파일 삭제 후 목록 즉시 반영
- YouTube 추가 후 목록 반영
- Start Learning 후 session 생성 및 이동

### Phase 6. Dictation 전환

작업:

- session detail fetch를 `useDictationSessionQuery`로 전환
- `PATCH /dictation-sessions/:id`를 `useUpdateSessionMutation`으로 전환
- user input debounce 저장 로직은 유지하되 mutation 사용
- `Next` 클릭 시 현재 `userInput`, `difficulty`, `keyword` flush 저장 후 Result 이동 유지

검증:

- 진입 시 기존 user input 복원
- 3초 debounce 저장
- Next 직후 Result에서 keyword 유지
- Next 직후 Result에서 user input 기반 채점 가능

### Phase 7. Result 전환

작업:

- session detail fetch를 `useDictationSessionQuery`로 전환
- answer upload, pdf upload, score mutation 전환
- metadata save mutation 전환
- score 성공 후 session detail/dayRecords/review lists invalidate

주의:

- 현재 `GET /score`가 completed 세션에서 에러를 내는 로직은 제품 흐름과 충돌할 수 있다.
- React Query 전환 중 이 버그를 함께 수정할지 별도 결정한다.

검증:

- Direct Input 저장 및 채점
- PDF Upload
- completed session 잠금
- keyword/difficulty 수정 가능 여부
- Review/Dashboard 최신화

## 11. 상태 구분 원칙

React Query로 옮길 것:

- day records
- dictation sessions list
- dictation session detail
- audio sources
- score result
- backup response가 필요할 경우 mutation result

React `useState`로 유지할 것:

- textarea 현재 입력값
- answer key 입력값
- keyword 입력값의 optimistic local draft
- active tab
- selected file
- selected audio source id
- loop enabled
- modal/confirm/open state
- form validation message

이 원칙을 지켜야 input latency와 server cache 책임이 섞이지 않는다.

## 12. Invalidation Matrix

| Mutation                        | Invalidate                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `POST /api/day-records`         | `dayRecords.all`, module hub query for date                                      |
| `POST /api/audio-sources`       | `audioSources.byDayRecord(dayRecordId)`                                          |
| `DELETE /api/audio-sources/:id` | `audioSources.byDayRecord(dayRecordId)`                                          |
| `POST /api/dictation-sessions`  | `dictationSessions.all`, module hub query                                        |
| `PATCH /api/dictation-sessions` | `dictationSessions.detail(sessionId)`, maybe `dictationSessions.all`             |
| `POST /answer` manual/pdf       | `dictationSessions.detail(sessionId)`                                            |
| `POST /score`                   | `dictationSessions.detail(sessionId)`, `dictationSessions.all`, `dayRecords.all` |
| `DELETE /score`                 | `dictationSessions.detail(sessionId)`, `dictationSessions.all`, `dayRecords.all` |
| `PATCH /users/:id`              | no shared query yet, update local settings state or add `user.detail` later      |
| `POST /backups`                 | no invalidate                                                                    |

## 13. Acceptance Criteria

완료 조건:

- `Dashboard`, `Review`, `Module Hub`, `Listening Setup`, `Dictation`, `Result`의 GET fetch가 React Query query hook으로 이동했다.
- 주요 POST/PATCH/DELETE가 mutation hook으로 이동했다.
- `reloadToken` state가 제거됐다.
- 실패 시 이전 데이터 유지와 retry가 React Query 기반으로 동작한다.
- mutation 성공 후 Dashboard/Review/Module Hub가 최신 상태를 표시한다.
- PWA에서 새로고침 후 Dashboard/Review가 최신 데이터를 표시한다.
- 기존 Service Worker `/api/*` cache bypass와 API `no-store` 정책이 유지된다.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`가 통과한다.

## 14. Manual QA Checklist

### Dashboard

- 로그인 후 Dashboard 진입
- 오늘 기록 없음 상태 확인
- session scoring 후 Dashboard로 돌아와 DONE/점수 반영 확인
- 월 이동 후 이전 데이터 유지 + 새 데이터 반영 확인
- 네트워크 실패 시 이전 데이터 유지 + 다시 시도 확인

### Review

- completed session 생성 후 Review 표시 확인
- Incorrect 필터 확인
- difficulty 필터 확인
- keyword contains 검색 확인
- session score 수정/삭제 시 list 갱신 확인

### Module Hub

- 날짜 선택 후 day record 자동 생성 확인
- session 없음: Listening Setup 이동
- in_progress session 있음: Dictation 이동
- completed session 있음: Result 이동

### Listening Setup

- 파일 업로드 목록 반영
- 파일 삭제 목록 반영
- YouTube URL 추가 반영
- Start Learning 후 session 생성

### Dictation

- user input 자동 저장
- difficulty 저장
- keyword 저장
- `Next` 클릭 직후 Result에서 keyword 유지

### Result

- Direct Input 채점
- PDF Upload
- completed 이후 answer/PDF/score 재수정 제한
- completed 이후 keyword/difficulty 수정 정책 확인

## 15. 작업 시 주의사항

- Service Worker의 `/api/*` bypass를 되돌리지 않는다.
- `cache: 'no-store'`와 API response `Cache-Control: no-store`를 제거하지 않는다.
- React Query cache를 “영구 저장소”처럼 사용하지 않는다. 앱 재실행 후 최신 데이터는 API에서 다시 가져온다.
- 입력 중인 textarea 값을 query cache에 직접 쓰지 않는다.
- mutation 성공 후 무조건 전체 invalidate만 하지 말고, detail/list/dayRecords 영향 범위를 기준으로 invalidate한다.
- 제품상 `Check Answer`가 완료 전 미리보기인지, 실제 완료인지 별도 결정이 필요하다. 현재 코드는 `POST /score`가 완료 처리한다.

## 16. 권장 구현 순서 요약

1. 패키지와 Provider 추가
2. `apiClient.ts`, `queryKeys.ts` 추가
3. Dashboard query 전환
4. Review query 전환
5. Module Hub query 전환
6. Listening Setup query/mutation 전환
7. Dictation detail/update mutation 전환
8. Result detail/answer/score mutation 전환
9. invalidation matrix대로 갱신 확인
10. PWA 최신성 manual QA
