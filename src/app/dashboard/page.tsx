import { getAuthUser } from '@/lib/auth';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  try {
    await getAuthUser();
  } catch {
    redirect('/login');
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        padding: '24px',
      }}
    >
      <DashboardClient />
    </main>
  );
}
