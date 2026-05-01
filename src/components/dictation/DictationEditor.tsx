'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type SessionDetailResponse = {
  session: {
    id: string;
    difficulty: 'easy' | 'med' | 'hard';
    userInput: string | null;
    keyword: string | null;
    status: 'in_progress' | 'completed';
    audioSources: Array<{
      id: string;
      type: 'file' | 'youtube';
      fileName: string | null;
      fileType: string | null;
      sourceUrl: string | null;
    }>;
  };
};

type Props = {
  sessionId: string;
};

type SessionUpdatePayload = {
  userInput?: string | null;
  difficulty?: 'easy' | 'med' | 'hard';
  keyword?: string | null;
};

function normalizeKeyword(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function updateSession(sessionId: string, payload: SessionUpdatePayload) {
  return fetch(`/api/dictation-sessions/${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

function extractYoutubeVideoId(fileName: string | null) {
  if (!fileName) {
    return null;
  }

  if (!fileName.startsWith('youtube:')) {
    return null;
  }

  const videoId = fileName.slice('youtube:'.length);
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : null;
}

export default function DictationEditor({ sessionId }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [difficulty, setDifficulty] = useState<'easy' | 'med' | 'hard'>('med');
  const [userInput, setUserInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'in_progress' | 'completed'>(
    'in_progress',
  );
  const [audioSources, setAudioSources] = useState<
    Array<{
      id: string;
      type: 'file' | 'youtube';
      fileName: string | null;
      fileType: string | null;
      sourceUrl: string | null;
    }>
  >([]);
  const [selectedAudioSourceId, setSelectedAudioSourceId] = useState<
    string | null
  >(null);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );
  const [isMovingToResult, setIsMovingToResult] = useState(false);

  const isHydratedRef = useRef(false);
  const latestUserInputRef = useRef<string | null>(null);
  const lastSavedDifficultyRef = useRef<'easy' | 'med' | 'hard'>('med');
  const lastSavedKeywordRef = useRef('');
  const difficultyRequestRef = useRef(0);
  const keywordRequestRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        const response = await fetch(`/api/dictation-sessions/${sessionId}`, {
          cache: 'no-store',
        });
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
        const loadedAudioSources = data.session.audioSources ?? [];
        setAudioSources(loadedAudioSources);
        setSelectedAudioSourceId(loadedAudioSources[0]?.id ?? null);
        lastSavedDifficultyRef.current = data.session.difficulty;
        lastSavedKeywordRef.current = data.session.keyword ?? '';
        isHydratedRef.current = true;
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
    if (!isHydratedRef.current) {
      return;
    }

    if (status === 'completed') {
      return;
    }

    latestUserInputRef.current = userInput;
    setSaveState('saving');

    const timer = setTimeout(() => {
      const payload = latestUserInputRef.current;

      if (payload === null) {
        return;
      }

      const save = async () => {
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          const response = await updateSession(sessionId, {
            userInput: payload,
          });

          if (response.ok) {
            if (latestUserInputRef.current === payload) {
              latestUserInputRef.current = null;
              setSaveState('saved');
            }
            setErrorMessage('');
            return;
          }

          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }

        setErrorMessage('자동 저장에 실패했습니다. 잠시 후 다시 시도됩니다.');
        setSaveState('idle');
      };

      void save();
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [sessionId, status, userInput]);

  useEffect(() => {
    if (!isHydratedRef.current) {
      return;
    }

    if (status === 'completed') {
      return;
    }

    if (difficulty === lastSavedDifficultyRef.current) {
      return;
    }

    difficultyRequestRef.current += 1;
    const requestId = difficultyRequestRef.current;

    const saveDifficulty = async () => {
      const response = await updateSession(sessionId, {
        difficulty,
      });

      if (requestId !== difficultyRequestRef.current) {
        return;
      }

      if (response.ok) {
        lastSavedDifficultyRef.current = difficulty;
        setErrorMessage('');
        return;
      }

      setErrorMessage('난이도 저장에 실패했습니다.');
    };

    void saveDifficulty();
  }, [difficulty, sessionId, status]);

  useEffect(() => {
    if (!isHydratedRef.current) {
      return;
    }

    if (keyword === lastSavedKeywordRef.current) {
      return;
    }

    keywordRequestRef.current += 1;
    const requestId = keywordRequestRef.current;

    const saveKeyword = async () => {
      const response = await updateSession(sessionId, {
        keyword: normalizeKeyword(keyword),
      });

      if (requestId !== keywordRequestRef.current) {
        return;
      }

      if (response.ok) {
        lastSavedKeywordRef.current = keyword;
        setErrorMessage('');
        return;
      }

      setErrorMessage('키워드 저장에 실패했습니다.');
    };

    void saveKeyword();
  }, [keyword, sessionId, status]);

  const handleMoveToResult = async () => {
    if (status === 'completed') {
      router.push(`/dictation/${sessionId}/result`);
      return;
    }

    setIsMovingToResult(true);
    setErrorMessage('');
    setSaveState('saving');

    try {
      const response = await updateSession(sessionId, {
        userInput,
        difficulty,
        keyword: normalizeKeyword(keyword),
      });

      if (!response.ok) {
        throw new Error('Failed to save current session before navigation');
      }

      latestUserInputRef.current = null;
      lastSavedDifficultyRef.current = difficulty;
      lastSavedKeywordRef.current = keyword;
      setSaveState('saved');
      router.push(`/dictation/${sessionId}/result`);
    } catch {
      setSaveState('idle');
      setErrorMessage('결과로 이동하기 전에 저장에 실패했습니다.');
    } finally {
      setIsMovingToResult(false);
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  const selectedAudioSource =
    audioSources.find((source) => source.id === selectedAudioSourceId) ??
    audioSources[0] ??
    null;
  const selectedYoutubeVideoId =
    selectedAudioSource?.type === 'youtube'
      ? extractYoutubeVideoId(selectedAudioSource.fileName)
      : null;

  return (
    <section style={{ width: '100%' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            fontWeight: 700,
            color: '#111',
            cursor: 'pointer',
          }}
        >
          {'< Back'}
        </button>
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

      <section
        style={{
          marginTop: '16px',
          border: '1px solid #e9e9e9',
          borderRadius: '12px',
          padding: '12px',
          background: '#fff',
          position: 'sticky',
          top: '12px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {audioSources.map((source, index) => (
            <button
              key={source.id}
              type="button"
              onClick={() => setSelectedAudioSourceId(source.id)}
              style={{
                borderRadius: '999px',
                border:
                  source.id === selectedAudioSource?.id
                    ? '1px solid #1a1a2e'
                    : '1px solid #ddd',
                background:
                  source.id === selectedAudioSource?.id ? '#1a1a2e' : '#fff',
                color: source.id === selectedAudioSource?.id ? '#fff' : '#333',
                padding: '6px 12px',
                fontSize: '13px',
              }}
            >
              {source.type === 'youtube'
                ? `YouTube ${index + 1}`
                : `File ${index + 1}`}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '10px' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              fontSize: '14px',
              color: '#333',
            }}
          >
            <input
              type="checkbox"
              checked={isLoopEnabled}
              onChange={(event) => setIsLoopEnabled(event.target.checked)}
            />
            반복 재생
          </label>

          {selectedAudioSource?.type === 'youtube' &&
            selectedYoutubeVideoId && (
              <iframe
                title="YouTube audio source"
                src={`https://www.youtube.com/embed/${selectedYoutubeVideoId}?${new URLSearchParams(
                  isLoopEnabled
                    ? {
                        loop: '1',
                        playlist: selectedYoutubeVideoId,
                      }
                    : {},
                ).toString()}`}
                style={{
                  width: '100%',
                  height: '220px',
                  border: 0,
                  borderRadius: '10px',
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}
          {selectedAudioSource?.type === 'youtube' &&
            !selectedYoutubeVideoId && (
              <p style={{ margin: 0, color: '#cf2e2e', fontSize: '14px' }}>
                유효한 YouTube 비디오 ID를 찾지 못했습니다.
              </p>
            )}
          {selectedAudioSource?.type === 'file' && (
            <>
              {selectedAudioSource.sourceUrl ? (
                <audio
                  controls
                  src={selectedAudioSource.sourceUrl}
                  loop={isLoopEnabled}
                  style={{ width: '100%' }}
                />
              ) : (
                <p style={{ margin: 0, color: '#cf2e2e', fontSize: '14px' }}>
                  파일 재생 URL을 불러오지 못했습니다.
                </p>
              )}
            </>
          )}
          {!selectedAudioSource && (
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              연결된 오디오 소스가 없습니다.
            </p>
          )}
        </div>
      </section>

      <div style={{ marginTop: '16px' }}>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Keyword (optional)"
          disabled={status === 'completed'}
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            padding: '0 12px',
            background: status === 'completed' ? '#f5f5f5' : '#fff',
          }}
        />
      </div>

      <div style={{ marginTop: '12px' }}>
        <textarea
          value={userInput}
          onChange={(event) => setUserInput(event.target.value)}
          placeholder="Type what you hear..."
          disabled={status === 'completed'}
          style={{
            width: '100%',
            minHeight: '260px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            padding: '12px',
            resize: 'vertical',
            background: status === 'completed' ? '#f5f5f5' : '#fff',
          }}
        />
      </div>

      {status === 'completed' ? (
        <p style={{ color: '#666', marginTop: '8px' }}>
          완료된 세션은 난이도만 수정할 수 있습니다.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => {
          void handleMoveToResult();
        }}
        disabled={isMovingToResult}
        style={{
          marginTop: '16px',
          width: '100%',
          borderRadius: '10px',
          border: 'none',
          background: '#25a05a',
          color: '#fff',
          padding: '12px 16px',
          cursor: isMovingToResult ? 'not-allowed' : 'pointer',
          opacity: isMovingToResult ? 0.7 : 1,
          fontWeight: 700,
        }}
      >
        {isMovingToResult ? 'Saving...' : 'Next'}
      </button>

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
