'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type SessionDetailResponse = {
  session: {
    id: string;
    answerKey: string | null;
    answerPdfPath: string | null;
    keyword: string | null;
    totalScore: number | null;
    status: 'in_progress' | 'completed';
    sentences: Array<{
      sentenceIndex: number;
      userText: string;
      answerText: string;
      score: number;
    }>;
  };
};

type ScoreResponse = {
  result: {
    totalScore: number;
    feedback: {
      message: string;
      emoji: string;
      sub: string;
    };
    sentenceScores: Array<{
      sentenceIndex: number;
      userText: string;
      answerText: string;
      score: number;
    }>;
  };
};

type Props = {
  sessionId: string;
};

function normalizeKeyword(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function mapFeedback(totalScore: number) {
  if (totalScore >= 90) {
    return { message: 'Excellent!', emoji: '🎉', sub: 'Almost perfect!' };
  }

  if (totalScore >= 70) {
    return {
      message: 'Great Job!',
      emoji: '👏',
      sub: 'You missed a few nuances.',
    };
  }

  if (totalScore >= 50) {
    return {
      message: 'Keep Going!',
      emoji: '💪',
      sub: 'Review the tricky parts.',
    };
  }

  return {
    message: 'Try Again',
    emoji: '📝',
    sub: 'Listen carefully and retry.',
  };
}

function parseApiErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    payload.error &&
    typeof payload.error === 'object' &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
  ) {
    return payload.error.message;
  }

  return fallback;
}

export default function ResultKeywordEditor({ sessionId }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingKeyword, setIsSavingKeyword] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [answerKeyInput, setAnswerKeyInput] = useState('');
  const [answerPdfPath, setAnswerPdfPath] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [status, setStatus] = useState<'in_progress' | 'completed'>(
    'in_progress',
  );
  const [sentenceScores, setSentenceScores] = useState<
    Array<{
      sentenceIndex: number;
      userText: string;
      answerText: string;
      score: number;
    }>
  >([]);

  const [activeTab, setActiveTab] = useState<'manual' | 'pdf'>('manual');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const feedback = useMemo(
    () => (totalScore === null ? null : mapFeedback(totalScore)),
    [totalScore],
  );
  const isCompletedLocked = status === 'completed';

  const pdfViewerUrl = useMemo(() => {
    if (!answerPdfPath) {
      return null;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/${answerPdfPath}`;
  }, [answerPdfPath]);

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

        setKeyword(data.session.keyword ?? '');
        setAnswerKeyInput(data.session.answerKey ?? '');
        setAnswerPdfPath(data.session.answerPdfPath);
        setTotalScore(data.session.totalScore);
        setStatus(data.session.status);
        setSentenceScores(data.session.sentences ?? []);
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
    setIsSavingKeyword(true);
    setErrorMessage('');
    setSuccessMessage('');

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

      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        throw new Error(
          parseApiErrorMessage(payload, '키워드 저장에 실패했습니다.'),
        );
      }

      setSuccessMessage('키워드를 저장했습니다.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '키워드 저장에 실패했습니다.',
      );
    } finally {
      setIsSavingKeyword(false);
    }
  };

  const uploadPdf = async () => {
    if (!pdfFile) {
      setErrorMessage('업로드할 PDF 파일을 선택하세요.');
      return;
    }

    setIsUploadingPdf(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('type', 'pdf');
      formData.append('file', pdfFile);

      const response = await fetch(
        `/api/dictation-sessions/${sessionId}/answer`,
        {
          method: 'POST',
          body: formData,
        },
      );

      const payload = (await response.json()) as {
        session?: {
          answerPdfPath: string | null;
        };
        error?: {
          message: string;
        };
      };

      if (!response.ok || !payload.session) {
        throw new Error(
          parseApiErrorMessage(payload, 'PDF 업로드에 실패했습니다.'),
        );
      }

      setAnswerPdfPath(payload.session.answerPdfPath);
      setPdfFile(null);
      setSuccessMessage(
        'PDF를 업로드했습니다. Direct Input에서 정답을 입력해 채점하세요.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'PDF 업로드에 실패했습니다.',
      );
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const refreshScoreResult = async () => {
    const response = await fetch(`/api/dictation-sessions/${sessionId}/score`);
    const payload = (await response.json()) as
      | ScoreResponse
      | { error?: { message?: string } };

    if (!response.ok || !('result' in payload)) {
      throw new Error(
        parseApiErrorMessage(payload, '채점 결과를 불러오지 못했습니다.'),
      );
    }

    setTotalScore(payload.result.totalScore);
    setSentenceScores(payload.result.sentenceScores);
    setStatus('completed');
  };

  const checkAnswer = async () => {
    setIsCheckingAnswer(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const saveAnswerResponse = await fetch(
        `/api/dictation-sessions/${sessionId}/answer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'manual',
            answerKey: answerKeyInput,
          }),
        },
      );

      const saveAnswerPayload = (await saveAnswerResponse.json()) as unknown;

      if (!saveAnswerResponse.ok) {
        throw new Error(
          parseApiErrorMessage(saveAnswerPayload, '정답 저장에 실패했습니다.'),
        );
      }

      const scoreResponse = await fetch(
        `/api/dictation-sessions/${sessionId}/score`,
        {
          method: 'POST',
        },
      );
      const scorePayload = (await scoreResponse.json()) as unknown;

      if (!scoreResponse.ok) {
        throw new Error(
          parseApiErrorMessage(scorePayload, '채점에 실패했습니다.'),
        );
      }

      await refreshScoreResult();
      setSuccessMessage('채점이 완료되었습니다.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '채점에 실패했습니다.',
      );
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  const completeAndSave = () => {
    if (totalScore === null) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage(
      '결과를 저장했습니다. 이 화면에서 계속 확인할 수 있습니다.',
    );
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <section style={{ maxWidth: '760px', margin: '0 auto', width: '100%' }}>
      <button
        type="button"
        onClick={() => router.back()}
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
        aria-label="Back to dictation"
      >
        {'< Result'}
      </button>
      <p style={{ color: '#666' }}>Status: {status}</p>

      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          style={{
            border: 'none',
            borderBottom:
              activeTab === 'manual'
                ? '2px solid #1a1a2e'
                : '2px solid transparent',
            background: 'transparent',
            padding: '8px 0',
            fontWeight: activeTab === 'manual' ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          Direct Input
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          style={{
            border: 'none',
            borderBottom:
              activeTab === 'pdf'
                ? '2px solid #1a1a2e'
                : '2px solid transparent',
            background: 'transparent',
            padding: '8px 0',
            fontWeight: activeTab === 'pdf' ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          PDF Upload
        </button>
      </div>

      {activeTab === 'manual' ? (
        <section style={{ marginTop: '12px' }}>
          <textarea
            value={answerKeyInput}
            onChange={(event) => setAnswerKeyInput(event.target.value)}
            placeholder="Type the answer key (split lines by Enter)"
            disabled={isCompletedLocked}
            style={{
              width: '100%',
              minHeight: '180px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              padding: '12px',
              resize: 'vertical',
              background: isCompletedLocked ? '#f5f5f5' : '#fff',
            }}
          />

          <button
            type="button"
            onClick={() => {
              void checkAnswer();
            }}
            disabled={isCheckingAnswer || isCompletedLocked}
            style={{
              marginTop: '10px',
              borderRadius: '10px',
              border: 'none',
              background: '#1a1a2e',
              color: '#fff',
              padding: '10px 14px',
              cursor: isCheckingAnswer ? 'not-allowed' : 'pointer',
              opacity: isCheckingAnswer || isCompletedLocked ? 0.7 : 1,
            }}
          >
            {isCheckingAnswer ? 'Checking...' : 'Check Answer'}
          </button>
        </section>
      ) : (
        <section style={{ marginTop: '12px' }}>
          <input
            type="file"
            accept="application/pdf"
            disabled={isCompletedLocked}
            onChange={(event) => {
              setPdfFile(event.target.files?.[0] ?? null);
            }}
          />

          <button
            type="button"
            onClick={() => {
              void uploadPdf();
            }}
            disabled={isUploadingPdf || isCompletedLocked}
            style={{
              marginTop: '10px',
              borderRadius: '10px',
              border: 'none',
              background: '#1a1a2e',
              color: '#fff',
              padding: '10px 14px',
              cursor:
                isUploadingPdf || isCompletedLocked ? 'not-allowed' : 'pointer',
              opacity: isUploadingPdf || isCompletedLocked ? 0.7 : 1,
            }}
          >
            {isUploadingPdf ? 'Uploading...' : 'Upload PDF'}
          </button>

          {pdfViewerUrl ? (
            <iframe
              title="Answer PDF"
              src={pdfViewerUrl}
              style={{
                width: '100%',
                height: '420px',
                marginTop: '12px',
                border: '1px solid #ddd',
                borderRadius: '12px',
              }}
            />
          ) : (
            <p style={{ color: '#666', marginTop: '12px' }}>
              업로드된 PDF가 없습니다.
            </p>
          )}
        </section>
      )}

      <div style={{ marginTop: '18px' }}>
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
          disabled={isCompletedLocked}
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '10px',
            border: '1px solid #ddd',
            padding: '0 12px',
            background: isCompletedLocked ? '#f5f5f5' : '#fff',
          }}
        />
        <button
          type="button"
          onClick={() => {
            void saveKeyword();
          }}
          disabled={isSavingKeyword || isCompletedLocked}
          style={{
            marginTop: '10px',
            borderRadius: '10px',
            border: 'none',
            background: '#1a1a2e',
            color: '#fff',
            padding: '10px 14px',
            cursor:
              isSavingKeyword || isCompletedLocked ? 'not-allowed' : 'pointer',
            opacity: isSavingKeyword || isCompletedLocked ? 0.7 : 1,
          }}
        >
          {isSavingKeyword ? 'Saving...' : 'Save keyword'}
        </button>
      </div>

      {isCompletedLocked ? (
        <p style={{ marginTop: '10px', color: '#666' }}>
          완료된 세션은 난이도만 수정할 수 있습니다.
        </p>
      ) : null}

      <section
        style={{
          marginTop: '18px',
          border: '1px solid #cae8d3',
          background: '#f3fff6',
          borderRadius: '12px',
          padding: '14px',
        }}
      >
        <p style={{ margin: 0, color: '#2f6f44', fontWeight: 700 }}>
          {feedback
            ? `${feedback.emoji} ${feedback.message}`
            : '채점 전입니다.'}
        </p>
        <p style={{ margin: '6px 0 0', color: '#3f5f4b' }}>
          {feedback ? feedback.sub : '정답 입력 후 Check Answer를 눌러주세요.'}
        </p>
        <p style={{ margin: '10px 0 0', color: '#2f6f44', fontSize: '24px' }}>
          {totalScore === null ? '-' : `${totalScore}%`}
        </p>

        <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
          {sentenceScores.map((sentence) => (
            <article
              key={sentence.sentenceIndex}
              style={{
                borderRadius: '10px',
                background: '#e8f9ee',
                padding: '10px',
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>
                Sentence {sentence.sentenceIndex} - {sentence.score}%
              </p>
              <p style={{ margin: '4px 0 0', color: '#2f6f44' }}>
                You: {sentence.userText || '(empty)'}
              </p>
              <p style={{ margin: '4px 0 0', color: '#2f6f44' }}>
                Answer: {sentence.answerText || '(empty)'}
              </p>
            </article>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={completeAndSave}
        disabled={totalScore === null}
        style={{
          marginTop: '14px',
          width: '100%',
          borderRadius: '10px',
          border: 'none',
          background: '#25a05a',
          color: '#fff',
          padding: '12px 16px',
          cursor: totalScore === null ? 'not-allowed' : 'pointer',
          opacity: totalScore === null ? 0.6 : 1,
          fontWeight: 700,
        }}
      >
        Complete & Save
      </button>

      {errorMessage ? <p style={{ color: '#cf2e2e' }}>{errorMessage}</p> : null}
      {successMessage ? (
        <p style={{ color: '#2f6f44' }}>{successMessage}</p>
      ) : null}
    </section>
  );
}
