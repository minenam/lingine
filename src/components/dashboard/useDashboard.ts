'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  endOfMonth,
  getMonthlyGridDates,
  getWeeklyDates,
  startOfMonth,
  toDateOnlyString,
} from '@/lib/dateUtils';

type DayRecordsResponse = {
  dayRecords: DayRecord[];
  monthlyAverageScore?: number | null;
};

export type DayRecord = {
  id: string;
  date: string;
  averageScore: number | null;
  status: 'pending' | 'completed';
};

export type InitialData = {
  dayRecords: DayRecord[];
  monthlyAverageScore: number | null;
};

type ViewMode = 'weekly' | 'monthly';

function calculateMonthlyAverage(dayRecords: DayRecord[]): number | null {
  const scoredRecords = dayRecords.filter(
    (dayRecord) => dayRecord.averageScore !== null,
  );

  if (scoredRecords.length === 0) {
    return null;
  }

  const total = scoredRecords.reduce(
    (sum, dayRecord) => sum + (dayRecord.averageScore ?? 0),
    0,
  );
  return Math.round(total / scoredRecords.length);
}

export function useDashboard(initialData?: InitialData) {
  const today = useMemo(() => new Date(), []);
  const skipInitialFetch = useRef(Boolean(initialData));

  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [focusDate, setFocusDate] = useState<Date>(today);
  const [dayRecords, setDayRecords] = useState<DayRecord[]>(
    initialData?.dayRecords ?? [],
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [errorMessage, setErrorMessage] = useState('');
  const [monthlyAverageScore, setMonthlyAverageScore] = useState<number | null>(
    initialData?.monthlyAverageScore ?? null,
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
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }

    let isMounted = true;

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
          const records = data.dayRecords ?? [];

          if (!isMounted) {
            return;
          }

          setDayRecords(records);
          setMonthlyAverageScore(
            typeof data.monthlyAverageScore === 'number'
              ? data.monthlyAverageScore
              : calculateMonthlyAverage(records),
          );
          setErrorMessage('');
        } catch (error) {
          if (!isMounted) {
            return;
          }

          console.error('Failed to load dashboard data:', error);
          setDayRecords([]);
          setMonthlyAverageScore(null);
          setErrorMessage('대시보드 데이터를 불러오지 못했습니다.');
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      void run();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [monthEnd, monthStart]);

  return {
    viewMode,
    setViewMode,
    focusDate,
    setFocusDate,
    dayRecords,
    isLoading,
    errorMessage,
    monthlyAverageScore,
    recordsByDate,
    visibleDates,
  };
}
