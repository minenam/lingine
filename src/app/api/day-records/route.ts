import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthUser } from '@/lib/auth';
import { noStoreJson } from '@/lib/apiResponse';
import { AppError, ERROR_CODES, toErrorResponse } from '@/lib/errors';
import { getSupabaseAdmin } from '@/lib/supabase';

const dayRecordsQuerySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((value) => value.from <= value.to, {
    message: 'from must be less than or equal to to',
  });

type DayRecordRow = {
  id: string;
  date: string;
  average_score: number | null;
  status: 'pending' | 'completed';
};

const createDayRecordBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function calculateMonthlyAverage(dayRecords: DayRecordRow[]) {
  const scoredRecords = dayRecords.filter(
    (dayRecord) => dayRecord.average_score !== null,
  );

  if (scoredRecords.length === 0) {
    return null;
  }

  const total = scoredRecords.reduce(
    (sum, dayRecord) => sum + (dayRecord.average_score ?? 0),
    0,
  );

  return Math.round(total / scoredRecords.length);
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();
    const url = new URL(request.url);

    const parsedQuery = dayRecordsQuerySchema.safeParse({
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
    });

    if (!parsedQuery.success) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid day-records query',
        400,
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: dayRecords, error } = await supabase
      .from('day_records')
      .select('id, date, average_score, status')
      .eq('user_id', authUser.userId)
      .gte('date', parsedQuery.data.from)
      .lte('date', parsedQuery.data.to)
      .order('date', { ascending: true })
      .returns<DayRecordRow[]>();

    if (error) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load day records',
        500,
      );
    }

    const records = dayRecords ?? [];

    return noStoreJson({
      dayRecords: records.map((dayRecord) => ({
        id: dayRecord.id,
        date: dayRecord.date,
        averageScore: dayRecord.average_score,
        status: dayRecord.status,
      })),
      monthlyAverageScore: calculateMonthlyAverage(records),
    });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    const body = await request.json();
    const parsedBody = createDayRecordBodySchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid day-record create payload',
        400,
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: existingRow, error: existingError } = await supabase
      .from('day_records')
      .select('id, date, average_score, status')
      .eq('user_id', authUser.userId)
      .eq('date', parsedBody.data.date)
      .maybeSingle<DayRecordRow>();

    if (existingError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load day record',
        500,
      );
    }

    if (existingRow) {
      return NextResponse.json({
        dayRecord: {
          id: existingRow.id,
          date: existingRow.date,
          averageScore: existingRow.average_score,
          status: existingRow.status,
        },
      });
    }

    const { data: insertedRow, error: insertError } = await supabase
      .from('day_records')
      .insert({
        user_id: authUser.userId,
        date: parsedBody.data.date,
        status: 'pending',
        average_score: null,
      })
      .select('id, date, average_score, status')
      .single<DayRecordRow>();

    if (!insertError && insertedRow) {
      return NextResponse.json(
        {
          dayRecord: {
            id: insertedRow.id,
            date: insertedRow.date,
            averageScore: insertedRow.average_score,
            status: insertedRow.status,
          },
        },
        { status: 201 },
      );
    }

    const { data: conflictedRow, error: conflictedError } = await supabase
      .from('day_records')
      .select('id, date, average_score, status')
      .eq('user_id', authUser.userId)
      .eq('date', parsedBody.data.date)
      .maybeSingle<DayRecordRow>();

    if (conflictedError || !conflictedRow) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load existing day record',
        500,
      );
    }

    return NextResponse.json({
      dayRecord: {
        id: conflictedRow.id,
        date: conflictedRow.date,
        averageScore: conflictedRow.average_score,
        status: conflictedRow.status,
      },
    });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}
