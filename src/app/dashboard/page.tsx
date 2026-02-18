import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  let authUser: { userId: string };

  try {
    authUser = await getAuthUser();
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
      <h1 style={{ margin: 0 }}>Hello, Learner</h1>
      <p style={{ color: '#666' }}>Authenticated user: {authUser.userId}</p>
    </main>
  );
}
