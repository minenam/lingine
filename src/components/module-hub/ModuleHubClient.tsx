'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  formatHeaderDate,
  isDateOnlyString,
  toDateOnlyString,
} from '@/lib/dateUtils';

import ModuleCard from './ModuleCard';
import { useModuleHub } from './useModuleHub';

type Props = {
  initialDate?: string;
};

const LOCKED_MODULES = ['Vocabulary', 'Reading', 'Writing'] as const;

export default function ModuleHubClient({ initialDate }: Props) {
  const router = useRouter();

  const selectedDate = useMemo(() => {
    if (isDateOnlyString(initialDate)) {
      return initialDate;
    }

    return toDateOnlyString(new Date());
  }, [initialDate]);

  const { isLoading, errorMessage, dayRecord, listeningStatus, sessions } =
    useModuleHub(selectedDate);

  const handleListeningClick = () => {
    if (!dayRecord) {
      return;
    }

    const completedSession = sessions.find(
      (session) =>
        session.status === 'completed' && session.totalScore !== null,
    );

    if (completedSession) {
      router.push(`/dictation/${completedSession.id}/result`);
      return;
    }

    const inProgressSession = sessions.find(
      (session) => session.status === 'in_progress',
    );

    if (inProgressSession) {
      router.push(`/dictation/${inProgressSession.id}`);
      return;
    }

    const query = new URLSearchParams({
      date: selectedDate,
      dayRecordId: dayRecord.id,
    });
    router.push(`/listening-setup?${query.toString()}`);
  };

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
          <ModuleCard
            variant="listening"
            statusLabel={listeningStatus.label}
            statusTextColor={listeningStatus.textColor}
            dotColor={listeningStatus.dotColor}
            onClick={handleListeningClick}
          />

          {LOCKED_MODULES.map((name) => (
            <ModuleCard key={name} variant="locked" name={name} disabled />
          ))}
        </>
      ) : null}
    </section>
  );
}
