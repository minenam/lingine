import { ChevronLeft, ChevronRight } from 'lucide-react';

import { getMonthLabel, toDateOnlyString } from '@/lib/dateUtils';

import type { DayRecord } from './useDashboard';

type CalendarCardProps = {
  viewMode: 'weekly' | 'monthly';
  focusDate: Date;
  visibleDates: Date[];
  recordsByDate: Record<string, DayRecord>;
  todayString: string;
  isLoading: boolean;
  errorMessage: string;
  onViewModeChange: (mode: 'weekly' | 'monthly') => void;
  onMonthMove: (direction: -1 | 1) => void;
  onDateSelect: (date: Date) => void;
  onRetry: () => void;
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDotColor(score: number | null) {
  if (score === null) {
    return null;
  }

  if (score >= 70) {
    return '#2ea043';
  }

  return '#cf2e2e';
}

export default function CalendarCard({
  viewMode,
  focusDate,
  visibleDates,
  recordsByDate,
  todayString,
  isLoading,
  errorMessage,
  onViewModeChange,
  onMonthMove,
  onDateSelect,
  onRetry,
}: CalendarCardProps) {
  return (
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
          onClick={() => onMonthMove(-1)}
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
            onViewModeChange(viewMode === 'weekly' ? 'monthly' : 'weekly')
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
          onClick={() => onMonthMove(1)}
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
          onClick={() => onViewModeChange('weekly')}
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
          onClick={() => onViewModeChange('monthly')}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <p style={{ margin: 0, color: '#cf2e2e' }}>{errorMessage}</p>
          <button
            type="button"
            onClick={onRetry}
            style={{
              border: '1px solid #ddd',
              background: '#fff',
              borderRadius: '999px',
              padding: '6px 12px',
              color: '#111',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            다시 시도
          </button>
        </div>
      ) : null}

      {!isLoading ? (
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
                onClick={() => onDateSelect(date)}
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
                    color: isToday ? '#fff' : isCurrentMonth ? '#111' : '#aaa',
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
  );
}
