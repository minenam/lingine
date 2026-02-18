import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import LoginForm from '@/components/auth/LoginForm';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token && verifyAuthToken(token)) {
    redirect('/dashboard');
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <LoginForm />
    </main>
  );
}
