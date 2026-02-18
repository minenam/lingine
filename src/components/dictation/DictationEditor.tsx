'use client';

import { useEffect, useRef, useState } from 'react';

type SessionDetailResponse = {
  session: {
    id: string;
    difficulty: 'easy' | 'med' | 'hard';
    userInput: string | null;
    keyword: string | null;
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

export default function DictationEditor({ sessionId }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [difficulty, setDifficulty] = useState<'easy' | 'med' | 'hard'>('med');
  const [userInput, setUserInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'in_progress' | 'completed'>(
    'in_progress',
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );

  const latestPayloadRef = useRef<{
    userInput: string;
    difficulty: 'easy' | 'med' | 'hard';
    keyword: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        const response = await fetch(`/api/dictation-sessions/${sessionId}`);
        const data = (await response.json()) as SessionDetailResponse;

        if (!response.ok || !data.session) {
          throw new Error('Failed to load session');
        }

        if (!isMounted) {
          return;
        }

        setDifficulty(data.session.difficulty);
        setUserInput(data.session.userInput ?? '');
        setKeyword(data.session.keyword ?? '');
        setStatus(data.session.status);
        setSaveState('saved');
        setErrorMessage('');
      } catch {
        if (isMounted) {
          setErrorMessage('세션을 불러오지 못했습니다.');
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

  useEffect(() => {
    if (isLoading) {
      return;
    }

    latestPayloadRef.current = {
      userInput,
      difficulty,
      keyword,
    };
    setSaveState('saving');

    const timer = setTimeout(() => {
      const payload = latestPayloadRef.current;

      if (!payload) {
        return;
      }

      const save = async () => {
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          const response = await fetch(`/api/dictation-sessions/${sessionId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userInput: payload.userInput,
              difficulty: payload.difficulty,
              keyword: normalizeKeyword(payload.keyword),
            }),
          });

          if (response.ok) {
            latestPayloadRef.current = null;
            setSaveState('saved');
            setErrorMessage('');
            return;
          }

          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }

        setErrorMessage('자동 저장에 실패했습니다. 잠시 후 다시 시도됩니다.');
      };

      void save();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [difficulty, isLoading, keyword, sessionId, userInput]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <section style={{ maxWidth: '760px', margin: '0 auto', width: '100%' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0 }}>Full Dictation</h1>
        <span style={{ color: '#666', fontSize: '14px' }}>
          상태: {status === 'completed' ? 'Completed' : 'In Progress'}
        </span>
      </header>

      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        {(['easy', 'med', 'hard'] as const).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setDifficulty(level)}
            style={{
              borderRadius: '999px',
              border: '1px solid #ddd',
              padding: '6px 12px',
              background: difficulty === level ? '#1a1a2e' : '#fff',
              color: difficulty === level ? '#fff' : '#333',
            }}
          >
            {level.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '16px' }}>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Keyword (optional)"
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            padding: '0 12px',
          }}
        />
      </div>

      <div style={{ marginTop: '12px' }}>
        <textarea
          value={userInput}
          onChange={(event) => setUserInput(event.target.value)}
          placeholder="Type what you hear..."
          style={{
            width: '100%',
            minHeight: '260px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            padding: '12px',
            resize: 'vertical',
          }}
        />
      </div>

      {errorMessage ? <p style={{ color: '#cf2e2e' }}>{errorMessage}</p> : null}
      {!errorMessage && saveState === 'saving' ? (
        <p style={{ color: '#666' }}>Saving...</p>
      ) : null}
      {!errorMessage && saveState === 'saved' ? (
        <p style={{ color: '#666' }}>All changes saved</p>
      ) : null}
    </section>
  );
}
