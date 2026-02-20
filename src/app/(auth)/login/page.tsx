import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import LoginForm from '@/components/auth/LoginForm';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordChanged?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const params = await searchParams;

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
      <LoginForm
        noticeMessage={
          params.passwordChanged === '1'
            ? 'Password changed. Please log in again.'
            : undefined
        }
      />
    </main>
  );
}
