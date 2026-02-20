import { redirect } from 'next/navigation';

import { getAuthUser } from '@/lib/auth';
import ListeningSetupClient from '@/components/listening/ListeningSetupClient';

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

  if (!params.date || !params.dayRecordId) {
    redirect('/dashboard');
  }

  return (
    <ListeningSetupClient date={params.date} dayRecordId={params.dayRecordId} />
  );
}
