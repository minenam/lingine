'use client';

import { useEffect, useState } from 'react';

type DayRecordsResponse = {
  dayRecords?: DayRecord[];
};

type UpsertDayRecordResponse = {
  dayRecord?: DayRecord;
};

type SessionsResponse = {
  sessions?: Session[];
};

type ListeningStatus = {
  label: string;
  textColor: string;
  dotColor: string;
};

type DayRecord = {
  id: string;
  date: string;
  averageScore: number | null;
  status: 'pending' | 'completed';
};

type Session = {
  id: string;
  totalScore: number | null;
  status: 'in_progress' | 'completed';
  createdAt: string;
};

function getListeningStatus(sessions: Session[]): ListeningStatus {
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

export function useModuleHub(selectedDate: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [dayRecord, setDayRecord] = useState<DayRecord | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

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

  return {
    isLoading,
    errorMessage,
    dayRecord,
    sessions,
    listeningStatus: getListeningStatus(sessions),
  };
}
