'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type DayRecord = {
  id: string;
  date: string;
  averageScore: number | null;
  status: 'pending' | 'completed';
};

type DayRecordsResponse = {
  dayRecords?: DayRecord[];
};

type UpsertDayRecordResponse = {
  dayRecord?: DayRecord;
};

type Session = {
  id: string;
  totalScore: number | null;
  status: 'in_progress' | 'completed';
  createdAt: string;
};

type SessionsResponse = {
  sessions?: Session[];
};

type Props = {
  initialDate?: string;
};

function toDateOnlyString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateOnly(dateOnly: string) {
  const [yearText, monthText, dayText] = dateOnly.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function isDateOnlyString(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatHeaderDate(dateOnly: string) {
  const parsedDate = parseDateOnly(dateOnly);

  if (!parsedDate) {
    return dateOnly;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate);
}

function getListeningStatus(sessions: Session[]) {
  const completedSession = sessions.find(
    (session) => session.status === 'completed' && session.totalScore !== null,
  );

  if (completedSession) {
    return {
      label: `Completed (${completedSession.totalScore}%)`,
      textColor: '#2f7a3f',
      dotColor: '#2f7a3f',
    };
  }

  if (sessions.length > 0) {
    return {
      label: 'In Progress',
      textColor: '#2f7a3f',
      dotColor: '#2f7a3f',
    };
  }

  return {
    label: 'Not Started',
    textColor: '#666',
    dotColor: '#c4c4c4',
  };
}

const LOCKED_MODULES = ['Vocabulary', 'Reading', 'Writing'] as const;

export default function ModuleHubClient({ initialDate }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [dayRecord, setDayRecord] = useState<DayRecord | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const selectedDate = useMemo(() => {
    if (isDateOnlyString(initialDate)) {
      return initialDate;
    }

    return toDateOnlyString(new Date());
  }, [initialDate]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setIsLoading(true);

      try {
        const query = new URLSearchParams({
          from: selectedDate,
          to: selectedDate,
        });

        const dayRecordResponse = await fetch(
          `/api/day-records?${query.toString()}`,
        );
        const dayRecordData =
          (await dayRecordResponse.json()) as DayRecordsResponse;

        if (!dayRecordResponse.ok) {
          throw new Error('Failed to load day record');
        }

        let targetDayRecord = dayRecordData.dayRecords?.[0] ?? null;

        if (!targetDayRecord) {
          const createResponse = await fetch('/api/day-records', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: selectedDate }),
          });

          const createData =
            (await createResponse.json()) as UpsertDayRecordResponse;

          if (!createResponse.ok || !createData.dayRecord) {
            throw new Error('Failed to create day record');
          }

          targetDayRecord = createData.dayRecord;
        }

        const sessionsQuery = new URLSearchParams({
          dayRecordId: targetDayRecord.id,
          page: '1',
          limit: '100',
        });

        const sessionsResponse = await fetch(
          `/api/dictation-sessions?${sessionsQuery.toString()}`,
        );
        const sessionsData =
          (await sessionsResponse.json()) as SessionsResponse;

        if (!sessionsResponse.ok) {
          throw new Error('Failed to load sessions');
        }

        if (!isMounted) {
          return;
        }

        setDayRecord(targetDayRecord);
        setSessions(sessionsData.sessions ?? []);
        setErrorMessage('');
      } catch {
        if (!isMounted) {
          return;
        }

        setDayRecord(null);
        setSessions([]);
        setErrorMessage('모듈 허브 데이터를 불러오지 못했습니다.');
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
  }, [selectedDate]);

  const listeningStatus = getListeningStatus(sessions);

  return (
    <section
      style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        display: 'grid',
        gap: '14px',
      }}
    >
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
          {`< ${formatHeaderDate(selectedDate)}`}
        </button>
        <p style={{ margin: 0, color: '#666' }}>Select a module to start</p>
      </header>

      {isLoading ? (
        <p style={{ margin: 0, color: '#666' }}>Loading...</p>
      ) : null}
      {errorMessage ? (
        <p style={{ margin: 0, color: '#cf2e2e' }}>{errorMessage}</p>
      ) : null}

      {!isLoading && !errorMessage ? (
        <>
          <button
            type="button"
            onClick={() => {
              if (!dayRecord) {
                return;
              }

              const query = new URLSearchParams({
                date: selectedDate,
                dayRecordId: dayRecord.id,
              });

              router.push(`/listening-setup?${query.toString()}`);
            }}
            style={{
              borderRadius: '18px',
              border: '1px solid #e6e6e6',
              background: '#fff',
              boxShadow: '0 8px 18px rgba(17, 24, 39, 0.05)',
              padding: '18px',
              cursor: dayRecord ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '999px',
                  background: '#e8f7ec',
                  color: '#2f7a3f',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                }}
              >
                L
              </span>
              <div style={{ display: 'grid', gap: '4px', textAlign: 'left' }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#111' }}>
                  Listening
                </p>
                <p
                  style={{
                    margin: 0,
                    color: listeningStatus.textColor,
                    fontWeight: 600,
                  }}
                >
                  {listeningStatus.label}
                </p>
              </div>
            </div>
            <span
              aria-hidden
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                background: listeningStatus.dotColor,
                flexShrink: 0,
              }}
            />
          </button>

          {LOCKED_MODULES.map((moduleName) => (
            <button
              key={moduleName}
              type="button"
              disabled
              aria-disabled
              style={{
                borderRadius: '18px',
                border: '1px solid #ececec',
                background: '#f2f2f2',
                padding: '18px',
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                color: '#999',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <span
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '999px',
                    border: '1px solid #d9d9d9',
                    color: '#999',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                  }}
                >
                  {moduleName.charAt(0)}
                </span>
                <div style={{ display: 'grid', gap: '4px', textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{moduleName}</p>
                  <p style={{ margin: 0, fontSize: '13px' }}>Locked</p>
                </div>
              </div>
              <span style={{ fontSize: '16px', lineHeight: 1 }}>LOCK</span>
            </button>
          ))}
        </>
      ) : null}
    </section>
  );
}
