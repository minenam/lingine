import { redirect } from 'next/navigation';

import BottomNav from '@/components/layout/BottomNav';
import SettingsClient from '@/components/settings/SettingsClient';
import { getAuthUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

import packageJson from '../../../package.json';

type UserRow = {
  description: string | null;
};

export default async function SettingsPage() {
  let userId = '';

  try {
    const authUser = await getAuthUser();
    userId = authUser.userId;
  } catch {
    redirect('/login');
  }

  let initialDescription: string | null = null;

  try {
    const { data: user } = await getSupabaseAdmin()
      .from('users')
      .select('description')
      .eq('id', userId)
      .maybeSingle<UserRow>();

    initialDescription = user?.description ?? null;
  } catch {
    initialDescription = null;
  }

  return (
    <main
      style={{ minHeight: '100dvh', padding: '20px', paddingBottom: '92px' }}
    >
      <SettingsClient
        userId={userId}
        initialDescription={initialDescription}
        version={packageJson.version}
      />
      <BottomNav active="settings" />
    </main>
  );
}
