'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  House,
  Menu,
  Settings,
} from 'lucide-react';

type DayRecord = {
  id: string;
  date: string;
  averageScore: number | null;
  status: 'pending' | 'completed';
};

type DayRecordsResponse = {
  dayRecords: DayRecord[];
  monthlyAverageScore?: number | null;
};

type ViewMode = 'weekly' | 'monthly';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toDateOnlyString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getWeeklyDates(date: Date) {
  const weekStart = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function getMonthlyGridDates(date: Date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart);
  const totalDays = monthEnd.getDate();
  const occupiedSlots = monthStart.getDay() + totalDays;
  const totalSlots = Math.ceil(occupiedSlots / 7) * 7;

  return Array.from({ length: totalSlots }, (_, index) =>
    addDays(gridStart, index),
  );
}

function getMonthLabel(date: Date) {
  return date.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function getFeedbackLabel(score: number | null) {
  if (score === null) {
    return 'No Data';
  }

  if (score >= 90) {
    return 'Excellent';
  }

  if (score >= 70) {
    return 'Good';
  }

  if (score >= 50) {
    return 'Average';
  }

  return 'Needs Work';
}

function getProgressColor(score: number | null) {
  if (score === null) {
    return '#c8ccd4';
  }

  if (score >= 70) {
    return '#2ea043';
  }

  return '#cf2e2e';
}

function toModuleHubPath(date: string) {
  return `/module-hub?date=${date}`;
}

function getDotColor(score: number | null) {
  if (score === null) {
    return null;
  }

  if (score >= 70) {
    return '#2ea043';
  }

  return '#cf2e2e';
}

export default function DashboardClient() {
  const router = useRouter();
  const today = new Date();
  const todayString = toDateOnlyString(today);

  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [focusDate, setFocusDate] = useState<Date>(today);
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [monthlyAverageScore, setMonthlyAverageScore] = useState<number | null>(
    null,
  );

  const monthStart = useMemo(() => startOfMonth(focusDate), [focusDate]);
  const monthEnd = useMemo(() => endOfMonth(focusDate), [focusDate]);

  const recordsByDate = useMemo(() => {
    return dayRecords.reduce<Record<string, DayRecord>>((acc, dayRecord) => {
      acc[dayRecord.date] = dayRecord;
      return acc;
    }, {});
  }, [dayRecords]);

  const visibleDates = useMemo(() => {
    if (viewMode === 'weekly') {
      return getWeeklyDates(focusDate);
    }

    return getMonthlyGridDates(focusDate);
  }, [focusDate, viewMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const run = async () => {
        setIsLoading(true);

        try {
          const query = new URLSearchParams({
            from: toDateOnlyString(monthStart),
            to: toDateOnlyString(monthEnd),
          });

          const response = await fetch(`/api/day-records?${query.toString()}`);

          if (!response.ok) {
            throw new Error('Failed to load dashboard data');
          }

          const data = (await response.json()) as DayRecordsResponse;

          setDayRecords(data.dayRecords ?? []);

          if (typeof data.monthlyAverageScore === 'number') {
            setMonthlyAverageScore(data.monthlyAverageScore);
          } else {
            const scoredRecords = (data.dayRecords ?? []).filter(
              (dayRecord) => dayRecord.averageScore !== null,
            );

            if (scoredRecords.length === 0) {
              setMonthlyAverageScore(null);
            } else {
              const total = scoredRecords.reduce(
                (sum, dayRecord) => sum + (dayRecord.averageScore ?? 0),
                0,
              );
              setMonthlyAverageScore(Math.round(total / scoredRecords.length));
            }
          }

          setErrorMessage('');
        } catch (e) {
          console.error('Failed to load dashboard data:', e);
          setDayRecords([]);
          setMonthlyAverageScore(null);
          setErrorMessage('대시보드 데이터를 불러오지 못했습니다.');
        } finally {
          setIsLoading(false);
        }
      };

      void run();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [monthEnd, monthStart]);

  const todayRecord = recordsByDate[todayString] ?? null;
  const isTodayDone = todayRecord?.status === 'completed';
  const statusLabel = isTodayDone ? 'DONE' : 'TO DO';
  const monthlyLabel = getFeedbackLabel(monthlyAverageScore);
  const progressColor = getProgressColor(monthlyAverageScore);

  const handleMonthMove = (direction: -1 | 1) => {
    setFocusDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1),
    );
  };

  const handleDateSelect = (date: Date) => {
    const dateString = toDateOnlyString(date);
    router.push(toModuleHubPath(dateString));
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

      <article
        style={{
          borderRadius: '16px',
          background: '#fff',
          border: '1px solid #ededed',
          padding: '14px',
          display: 'grid',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            onClick={() => handleMonthMove(-1)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '18px',
              cursor: 'pointer',
            }}
            aria-label="Previous month"
          >
            <ChevronLeft size={18} strokeWidth={2} color="#111" />
          </button>
          <button
            type="button"
            onClick={() =>
              setViewMode((prev) => (prev === 'weekly' ? 'monthly' : 'weekly'))
            }
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {getMonthLabel(focusDate)}
          </button>
          <button
            type="button"
            onClick={() => handleMonthMove(1)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '18px',
              cursor: 'pointer',
            }}
            aria-label="Next month"
          >
            <ChevronRight size={18} strokeWidth={2} color="#111" />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            style={{
              borderRadius: '999px',
              border: '1px solid #ddd',
              padding: '6px 12px',
              background: viewMode === 'weekly' ? '#1a1a2e' : '#fff',
              color: viewMode === 'weekly' ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            style={{
              borderRadius: '999px',
              border: '1px solid #ddd',
              padding: '6px 12px',
              background: viewMode === 'monthly' ? '#1a1a2e' : '#fff',
              color: viewMode === 'monthly' ? '#fff' : '#333',
              cursor: 'pointer',
            }}
          >
            Monthly
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: '8px',
            textAlign: 'center',
            color: '#777',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>

        {isLoading ? (
          <p style={{ margin: 0, color: '#666' }}>Loading...</p>
        ) : null}
        {errorMessage ? (
          <p style={{ margin: 0, color: '#cf2e2e' }}>{errorMessage}</p>
        ) : null}

        {!isLoading && !errorMessage ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: '8px',
            }}
          >
            {visibleDates.map((date) => {
              const dateString = toDateOnlyString(date);
              const dayRecord = recordsByDate[dateString] ?? null;
              const dotColor = getDotColor(dayRecord?.averageScore ?? null);
              const isToday = dateString === todayString;
              const isCurrentMonth = date.getMonth() === focusDate.getMonth();

              return (
                <button
                  key={dateString}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: '34px',
                      height: '34px',
                      margin: '0 auto',
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '999px',
                      background: isToday ? '#111' : 'transparent',
                      color: isToday
                        ? '#fff'
                        : isCurrentMonth
                          ? '#111'
                          : '#aaa',
                      fontWeight: isToday ? 700 : 500,
                      transition: 'background 120ms ease-out',
                    }}
                  >
                    {date.getDate()}
                  </span>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      margin: '4px auto 0',
                      borderRadius: '999px',
                      background: dotColor ?? 'transparent',
                      display: 'block',
                    }}
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </article>

      <article
        style={{
          borderRadius: '16px',
          background: '#fff',
          border: '1px solid #ededed',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: '#888',
            }}
          >
            MONTHLY ACCURACY
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '34px', fontWeight: 700 }}>
            {monthlyAverageScore === null ? '-' : `${monthlyAverageScore}%`}
          </p>
        </div>
        <div style={{ display: 'grid', justifyItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '66px',
              height: '66px',
              borderRadius: '999px',
              border: `6px solid ${progressColor}`,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 600,
              color: '#111',
              fontSize: '13px',
            }}
          >
            {monthlyAverageScore === null ? '--' : `${monthlyAverageScore}%`}
          </div>
          <span style={{ color: '#666', fontSize: '13px' }}>
            {monthlyLabel}
          </span>
        </div>
      </article>

      <article
        style={{
          borderRadius: '16px',
          background: '#fff',
          border: '1px solid #ededed',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-flex',
              borderRadius: '999px',
              background: isTodayDone ? '#f2f2f2' : '#e6f6ea',
              color: isTodayDone ? '#666' : '#2f7a3f',
              fontSize: '11px',
              fontWeight: 600,
              padding: '5px 10px',
            }}
          >
            {statusLabel}
          </span>
          <p
            style={{ margin: '10px 0 4px', fontSize: '19px', fontWeight: 700 }}
          >
            {isTodayDone ? 'Today Completed' : 'Start Learning'}
          </p>
          <p style={{ margin: 0, color: '#666' }}>
            {isTodayDone
              ? 'Nice work. Keep your streak alive.'
              : 'Keep your streak alive!'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartLearning}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '999px',
            border: 'none',
            background: '#111',
            color: '#fff',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
          aria-label="Start learning"
        >
          <ArrowRight size={18} strokeWidth={2.2} color="#fff" />
        </button>
      </article>

      <nav
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 0,
          width: '100%',
          maxWidth: '480px',
          height: '64px',
          borderTop: '1px solid #e9e9e9',
          background: '#fff',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          alignItems: 'center',
          padding: '0 12px',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#111',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'grid',
            justifyItems: 'center',
            gap: '4px',
          }}
        >
          <House size={18} strokeWidth={2} />
          <span style={{ fontSize: '12px' }}>Home</span>
        </button>
        <button
          type="button"
          onClick={() => router.push('/review')}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#888',
            cursor: 'pointer',
            display: 'grid',
            justifyItems: 'center',
            gap: '4px',
          }}
        >
          <BookOpen size={18} strokeWidth={2} />
          <span style={{ fontSize: '12px' }}>Review</span>
        </button>
        <button
          type="button"
          onClick={() => router.push('/settings')}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#888',
            cursor: 'pointer',
            display: 'grid',
            justifyItems: 'center',
            gap: '4px',
          }}
        >
          <Settings size={18} strokeWidth={2} />
          <span style={{ fontSize: '12px' }}>Settings</span>
        </button>
      </nav>
    </section>
  );
}
