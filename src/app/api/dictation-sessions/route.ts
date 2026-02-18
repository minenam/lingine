import { NextResponse } from 'next/server';

import { getAuthUser } from '@/lib/auth';
import { AppError, ERROR_CODES, toErrorResponse } from '@/lib/errors';
import {
  createDictationSession,
  listDictationSessions,
  normalizeKeyword,
} from '@/lib/services/dictationSessions';

import { createSessionBodySchema, listSessionQuerySchema } from './schemas';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    const body = await request.json();
    const parsedBody = createSessionBodySchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid session create payload',
        400,
      );
    }

    const result = await createDictationSession({
      userId: authUser.userId,
      dayRecordId: parsedBody.data.dayRecordId,
      audioSourceIds: parsedBody.data.audioSourceIds,
      difficulty: parsedBody.data.difficulty,
      keyword: parsedBody.data.keyword,
    });

    return NextResponse.json({ session: result.session }, { status: 201 });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();
    const url = new URL(request.url);
    const parsedQuery = listSessionQuerySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
      difficulty: url.searchParams.get('difficulty') ?? undefined,
      maxScore: url.searchParams.get('maxScore') ?? undefined,
      page: url.searchParams.get('page') ?? '1',
      limit: url.searchParams.get('limit') ?? '20',
      keyword: url.searchParams.get('keyword') ?? undefined,
      dayRecordId: url.searchParams.get('dayRecordId') ?? undefined,
    });

    if (!parsedQuery.success) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid session list query',
        400,
      );
    }

    const result = await listDictationSessions({
      userId: authUser.userId,
      status: parsedQuery.data.status,
      difficulty: parsedQuery.data.difficulty,
      maxScore: parsedQuery.data.maxScore,
      page: parsedQuery.data.page,
      limit: parsedQuery.data.limit,
      keyword: normalizeKeyword(parsedQuery.data.keyword ?? null),
      dayRecordId: parsedQuery.data.dayRecordId,
    });

    return NextResponse.json({
      sessions: result.sessions,
      pagination: result.pagination,
    });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}
