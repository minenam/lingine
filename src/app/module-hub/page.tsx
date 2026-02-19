import { redirect } from 'next/navigation';

import BottomNav from '@/components/layout/BottomNav';
import ModuleHubClient from '@/components/module-hub/ModuleHubClient';
import { getAuthUser } from '@/lib/auth';

type ModuleHubPageProps = {
  searchParams: Promise<{
    date?: string;
  }>;
};

export default async function ModuleHubPage({
  searchParams,
}: ModuleHubPageProps) {
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
        paddingBottom: '92px',
      }}
    >
      <ModuleHubClient initialDate={params.date} />
      <BottomNav active="home" />
    </main>
  );
}
