'use client';

import { useEffect, useState } from 'react';

type SessionResultResponse = {
  session: {
    id: string;
    keyword: string | null;
    totalScore: number | null;
    status: 'in_progress' | 'completed';
  };
};

type Props = {
  sessionId: string;
};

function normalizeKeyword(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export default function ResultKeywordEditor({ sessionId }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [status, setStatus] = useState<'in_progress' | 'completed'>(
    'in_progress',
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        const response = await fetch(`/api/dictation-sessions/${sessionId}`);
        const data = (await response.json()) as SessionResultResponse;

        if (!response.ok || !data.session) {
          throw new Error('Failed to load session');
        }

        if (!isMounted) {
          return;
        }

        setKeyword(data.session.keyword ?? '');
        setTotalScore(data.session.totalScore);
        setStatus(data.session.status);
        setErrorMessage('');
      } catch {
        if (isMounted) {
          setErrorMessage('결과 데이터를 불러오지 못했습니다.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const saveKeyword = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/dictation-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: normalizeKeyword(keyword),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update keyword');
      }
    } catch {
      setErrorMessage('키워드 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <section style={{ maxWidth: '760px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ margin: 0 }}>Result</h1>
      <p style={{ color: '#666' }}>Status: {status}</p>
      <p style={{ color: '#666' }}>Total Score: {totalScore ?? '-'}</p>

      <div style={{ marginTop: '12px' }}>
        <label
          htmlFor="keyword-input"
          style={{ display: 'block', marginBottom: '8px' }}
        >
          Keyword (optional)
        </label>
        <input
          id="keyword-input"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="e.g. cut it short"
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            padding: '0 12px',
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          void saveKeyword();
        }}
        disabled={isSaving}
        style={{
          marginTop: '12px',
          borderRadius: '10px',
          border: 'none',
          background: '#1a1a2e',
          color: '#fff',
          padding: '10px 14px',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          opacity: isSaving ? 0.7 : 1,
        }}
      >
        {isSaving ? 'Saving...' : 'Save keyword'}
      </button>

      {errorMessage ? <p style={{ color: '#cf2e2e' }}>{errorMessage}</p> : null}
      {!errorMessage && !isSaving && keyword.trim().length > 0 ? (
        <p style={{ color: '#666' }}>Current keyword: {keyword.trim()}</p>
      ) : null}
    </section>
  );
}
