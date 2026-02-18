import { redirect } from 'next/navigation';

import { getAuthUser } from '@/lib/auth';

type ListeningSetupPageProps = {
  searchParams: Promise<{
    date?: string;
    dayRecordId?: string;
  }>;
};

export default async function ListeningSetupPage({
  searchParams,
}: ListeningSetupPageProps) {
  try {
    await getAuthUser();
  } catch {
    redirect('/login');
  }

  const params = await searchParams;

  return (
    <main
      style={{
        minHeight: '100dvh',
        padding: '24px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          display: 'grid',
          gap: '10px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>Listening Setup</h1>
        <p style={{ margin: 0, color: '#666' }}>Select Audio Source</p>
        <p style={{ margin: 0, color: '#666' }}>date: {params.date ?? '-'}</p>
        <p style={{ margin: 0, color: '#666' }}>
          dayRecordId: {params.dayRecordId ?? '-'}
        </p>
      </section>
    </main>
  );
}
