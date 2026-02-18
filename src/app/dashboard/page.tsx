import { getAuthUser } from '@/lib/auth';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { endOfMonth, startOfMonth, toDateOnlyString } from '@/lib/dateUtils';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { InitialData } from '@/components/dashboard/useDashboard';

export default async function DashboardPage() {
  try {
    await getAuthUser();
  } catch {
    redirect('/login');
  }

  let initialData: InitialData | undefined;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (baseUrl) {
      const today = new Date();
      const from = toDateOnlyString(startOfMonth(today));
      const to = toDateOnlyString(endOfMonth(today));
      const cookieStore = await cookies();

      const response = await fetch(
        `${baseUrl}/api/day-records?from=${from}&to=${to}`,
        {
          headers: { cookie: cookieStore.toString() },
          cache: 'no-store',
        },
      );

      if (response.ok) {
        const data = (await response.json()) as InitialData;
        initialData = {
          dayRecords: data.dayRecords ?? [],
          monthlyAverageScore: data.monthlyAverageScore ?? null,
        };
      }
    }
  } catch {
    initialData = undefined;
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        padding: '24px',
      }}
    >
      <DashboardClient initialData={initialData} />
    </main>
  );
}
