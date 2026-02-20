import { redirect } from 'next/navigation';

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

  return <ModuleHubClient initialDate={params.date} />;
}
