'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type ReviewSession = {
  id: string;
  difficulty: 'easy' | 'med' | 'hard';
  totalScore: number | null;
  status: 'in_progress' | 'completed';
  createdAt: string;
  keyword: string | null;
  previewText: string;
};

type ReviewResponse = {
  sessions: ReviewSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type FilterType = 'all' | 'incorrect' | 'hard' | 'med' | 'easy';

export default function ReviewSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [keyword, setKeyword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const queryString = useMemo(() => {
    const query = new URLSearchParams();
    query.set('status', 'completed');
    query.set('page', '1');
    query.set('limit', '20');

    if (filter === 'incorrect') {
      query.set('maxScore', '70');
    }

    if (filter === 'hard' || filter === 'med' || filter === 'easy') {
      query.set('difficulty', filter);
    }

    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword.length > 0) {
      query.set('keyword', trimmedKeyword);
    }

    return query.toString();
  }, [filter, keyword]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const run = async () => {
        setIsLoading(true);

        try {
          const response = await fetch(
            `/api/dictation-sessions?${queryString}`,
          );
          const data = (await response.json()) as ReviewResponse;

          if (!response.ok) {
            throw new Error('Failed to load sessions');
          }

          setSessions(data.sessions ?? []);
          setErrorMessage('');
        } catch {
          setSessions([]);
          setErrorMessage('리뷰 목록을 불러오지 못했습니다.');
        } finally {
          setIsLoading(false);
        }
      };

      void run();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [queryString]);

  return (
    <section style={{ maxWidth: '860px', margin: '0 auto', width: '100%' }}>
      <header style={{ display: 'grid', gap: '6px' }}>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            margin: 0,
            textAlign: 'left',
            fontSize: '24px',
            fontWeight: 700,
            color: '#111',
            cursor: 'pointer',
          }}
          aria-label="Back to dashboard"
        >
          {'< Review Notes'}
        </button>
      </header>

      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {(['all', 'incorrect', 'hard', 'med', 'easy'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            style={{
              borderRadius: '999px',
              border: '1px solid #ddd',
              padding: '6px 12px',
              background: filter === item ? '#1a1a2e' : '#fff',
              color: filter === item ? '#fff' : '#333',
            }}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '12px' }}>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Search keyword (contains)"
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            padding: '0 12px',
          }}
        />
      </div>

      {isLoading ? <p>Loading...</p> : null}
      {errorMessage ? <p style={{ color: '#cf2e2e' }}>{errorMessage}</p> : null}

      {!isLoading && !errorMessage ? (
        <ul
          style={{
            margin: '16px 0 0',
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gap: '12px',
          }}
        >
          {sessions.map((session) => (
            <li
              key={session.id}
              onClick={() => router.push(`/dictation/${session.id}/result`)}
              style={{
                border: '1px solid #e8e8e8',
                borderRadius: '12px',
                padding: '14px',
                cursor: 'pointer',
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>
                {new Date(session.createdAt).toLocaleDateString()} ·{' '}
                {session.difficulty.toUpperCase()} · {session.totalScore ?? '-'}
                %
              </p>
              {session.keyword ? (
                <p style={{ margin: '8px 0 0', color: '#1a1a2e' }}>
                  #{session.keyword}
                </p>
              ) : null}
              <p style={{ margin: '8px 0 0', color: '#666' }}>
                {session.previewText || '(no preview)'}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
