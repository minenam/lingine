import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthUser } from '@/lib/auth';
import { AppError, ERROR_CODES, toErrorResponse } from '@/lib/errors';
import { getSupabaseAdmin } from '@/lib/supabase';

const createSessionBodySchema = z.object({
  dayRecordId: z.string().uuid(),
  audioSourceIds: z.array(z.string().uuid()).min(1),
  difficulty: z.enum(['easy', 'med', 'hard']).default('med'),
  keyword: z.string().trim().max(255).nullable().optional(),
});

const listSessionQuerySchema = z.object({
  status: z.enum(['in_progress', 'completed']).default('completed'),
  difficulty: z.enum(['easy', 'med', 'hard']).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  keyword: z.string().trim().max(255).optional(),
});

type DayRecordRow = {
  id: string;
  user_id: string;
  date: string;
};

type SessionRow = {
  id: string;
  day_record_id: string;
  difficulty: 'easy' | 'med' | 'hard';
  user_input: string | null;
  keyword: string | null;
  total_score: number | null;
  status: 'in_progress' | 'completed';
  created_at: string;
};

type SessionAudioSourceRow = {
  session_id: string;
  audio_source_id: string;
  audio_source: {
    id: string;
    type: 'file' | 'youtube';
    file_name: string | null;
  } | null;
};

function normalizeKeyword(keyword: string | null | undefined) {
  if (keyword == null) {
    return null;
  }

  const trimmed = keyword.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function buildPreviewText(userInput: string | null) {
  if (!userInput) {
    return '';
  }

  const firstSentence = userInput
    .split('\n')
    .find((line) => line.trim().length > 0);

  if (!firstSentence) {
    return '';
  }

  const trimmed = firstSentence.trim();
  return trimmed.length > 30 ? `${trimmed.slice(0, 30)}...` : trimmed;
}

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

    const supabase = getSupabaseAdmin();
    const { dayRecordId, audioSourceIds, difficulty } = parsedBody.data;
    const keyword = normalizeKeyword(parsedBody.data.keyword);

    const { data: dayRecord, error: dayRecordError } = await supabase
      .from('day_records')
      .select('id, user_id, date')
      .eq('id', dayRecordId)
      .eq('user_id', authUser.userId)
      .maybeSingle<DayRecordRow>();

    if (dayRecordError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load day record',
        500,
      );
    }

    if (!dayRecord) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Day record not found', 404);
    }

    const { data: session, error: sessionError } = await supabase
      .from('dictation_sessions')
      .insert({
        day_record_id: dayRecordId,
        difficulty,
        keyword,
      })
      .select('id, day_record_id, difficulty, status, keyword')
      .single<{
        id: string;
        day_record_id: string;
        difficulty: 'easy' | 'med' | 'hard';
        status: 'in_progress' | 'completed';
        keyword: string | null;
      }>();

    if (sessionError || !session) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to create dictation session',
        500,
      );
    }

    const sessionAudioSourceRows = audioSourceIds.map((audioSourceId) => ({
      session_id: session.id,
      audio_source_id: audioSourceId,
    }));

    const { error: sessionAudioSourceError } = await supabase
      .from('session_audio_sources')
      .insert(sessionAudioSourceRows);

    if (sessionAudioSourceError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to attach audio sources',
        500,
      );
    }

    const { data: audioSources, error: audioSourcesError } = await supabase
      .from('audio_sources')
      .select('id, type, file_name')
      .in('id', audioSourceIds)
      .order('created_at', { ascending: true });

    if (audioSourcesError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load audio sources',
        500,
      );
    }

    return NextResponse.json(
      {
        session: {
          id: session.id,
          dayRecordId: session.day_record_id,
          difficulty: session.difficulty,
          status: session.status,
          keyword: session.keyword,
          audioSources: (audioSources ?? []).map((audioSource) => ({
            id: audioSource.id,
            type: audioSource.type,
            fileName: audioSource.file_name,
          })),
        },
      },
      { status: 201 },
    );
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
      status: url.searchParams.get('status') ?? 'completed',
      difficulty: url.searchParams.get('difficulty') ?? undefined,
      maxScore: url.searchParams.get('maxScore') ?? undefined,
      page: url.searchParams.get('page') ?? '1',
      limit: url.searchParams.get('limit') ?? '20',
      keyword: url.searchParams.get('keyword') ?? undefined,
    });

    if (!parsedQuery.success) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid session list query',
        400,
      );
    }

    const { status, difficulty, maxScore, page, limit } = parsedQuery.data;
    const keyword = normalizeKeyword(parsedQuery.data.keyword ?? null);

    const supabase = getSupabaseAdmin();

    const { data: dayRecords, error: dayRecordError } = await supabase
      .from('day_records')
      .select('id')
      .eq('user_id', authUser.userId);

    if (dayRecordError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load day records',
        500,
      );
    }

    const dayRecordIds = (dayRecords ?? []).map((dayRecord) => dayRecord.id);

    if (dayRecordIds.length === 0) {
      return NextResponse.json({
        sessions: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    let countQuery = supabase
      .from('dictation_sessions')
      .select('id', { count: 'exact', head: true })
      .in('day_record_id', dayRecordIds);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    if (difficulty) {
      countQuery = countQuery.eq('difficulty', difficulty);
    }

    if (maxScore !== undefined) {
      countQuery = countQuery.lt('total_score', maxScore);
    }

    if (keyword) {
      countQuery = countQuery.ilike('keyword', `%${keyword}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to count sessions',
        500,
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let listQuery = supabase
      .from('dictation_sessions')
      .select(
        'id, day_record_id, difficulty, user_input, keyword, total_score, status, created_at',
      )
      .in('day_record_id', dayRecordIds)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) {
      listQuery = listQuery.eq('status', status);
    }

    if (difficulty) {
      listQuery = listQuery.eq('difficulty', difficulty);
    }

    if (maxScore !== undefined) {
      listQuery = listQuery.lt('total_score', maxScore);
    }

    if (keyword) {
      listQuery = listQuery.ilike('keyword', `%${keyword}%`);
    }

    const { data: sessions, error: listError } =
      await listQuery.returns<SessionRow[]>();

    if (listError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load sessions',
        500,
      );
    }

    const sessionIds = (sessions ?? []).map((session) => session.id);

    let audioSourcesBySession = new Map<
      string,
      Array<{ id: string; type: string; fileName: string | null }>
    >();

    if (sessionIds.length > 0) {
      const { data: sessionAudioSources, error: sessionAudioSourcesError } =
        await supabase
          .from('session_audio_sources')
          .select(
            'session_id, audio_source_id, audio_source:audio_sources(id, type, file_name)',
          )
          .in('session_id', sessionIds)
          .returns<SessionAudioSourceRow[]>();

      if (sessionAudioSourcesError) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Failed to load session audio sources',
          500,
        );
      }

      audioSourcesBySession = (sessionAudioSources ?? []).reduce((map, row) => {
        if (!row.audio_source) {
          return map;
        }

        const current = map.get(row.session_id) ?? [];
        current.push({
          id: row.audio_source.id,
          type: row.audio_source.type,
          fileName: row.audio_source.file_name,
        });
        map.set(row.session_id, current);
        return map;
      }, new Map<string, Array<{ id: string; type: string; fileName: string | null }>>());
    }

    return NextResponse.json({
      sessions: (sessions ?? []).map((session) => ({
        id: session.id,
        difficulty: session.difficulty,
        totalScore: session.total_score,
        status: session.status,
        createdAt: session.created_at,
        keyword: session.keyword,
        audioSources: audioSourcesBySession.get(session.id) ?? [],
        previewText: buildPreviewText(session.user_input),
      })),
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}
