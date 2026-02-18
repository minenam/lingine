'use client';

import { Menu, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

import BottomNav from '@/components/layout/BottomNav';
import { toDateOnlyString } from '@/lib/dateUtils';

import CalendarCard from './CalendarCard';
import MonthlyAccuracyCard from './MonthlyAccuracyCard';
import TodayStatusCard from './TodayStatusCard';
import { InitialData, useDashboard } from './useDashboard';

function toModuleHubPath(date: string) {
  return `/module-hub?date=${date}`;
}

type DashboardClientProps = {
  initialData?: InitialData;
};

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter();
  const todayString = toDateOnlyString(new Date());

  const {
    viewMode,
    setViewMode,
    focusDate,
    setFocusDate,
    isLoading,
    errorMessage,
    monthlyAverageScore,
    recordsByDate,
    visibleDates,
  } = useDashboard(initialData);

  const todayRecord = recordsByDate[todayString] ?? null;
  const isTodayDone = todayRecord?.status === 'completed';

  const handleMonthMove = (direction: -1 | 1) => {
    setFocusDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1),
    );
  };

  const handleDateSelect = (date: Date) => {
    router.push(toModuleHubPath(toDateOnlyString(date)));
  };

  const handleStartLearning = () => {
    router.push(toModuleHubPath(todayString));
  };

  return (
    <section
      style={{
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        paddingBottom: '92px',
        display: 'grid',
        gap: '14px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
          Hello, Learner
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '999px',
              border: '1px solid #e4e4e4',
              background: '#fff',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
            aria-label="Menu"
          >
            <Menu size={18} strokeWidth={1.9} color="#111" />
          </button>
          <button
            type="button"
            onClick={() => router.push('/settings')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '999px',
              border: '1px solid #e4e4e4',
              background: '#fff',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
            aria-label="Settings"
          >
            <Settings size={18} strokeWidth={1.9} color="#111" />
          </button>
        </div>
      </header>

      <CalendarCard
        viewMode={viewMode}
        focusDate={focusDate}
        visibleDates={visibleDates}
        recordsByDate={recordsByDate}
        todayString={todayString}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onViewModeChange={setViewMode}
        onMonthMove={handleMonthMove}
        onDateSelect={handleDateSelect}
      />

      <MonthlyAccuracyCard monthlyAverageScore={monthlyAverageScore} />

      <TodayStatusCard
        isTodayDone={isTodayDone}
        onStartLearning={handleStartLearning}
      />

      <BottomNav active="home" />
    </section>
  );
}
