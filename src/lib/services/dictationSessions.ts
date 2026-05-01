import { AppError, ERROR_CODES } from '@/lib/errors';
import { getSupabaseAdmin } from '@/lib/supabase';

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

type SessionAudioSource = {
  id: string;
  type: string;
  fileName: string | null;
};

type SessionSummary = {
  id: string;
  difficulty: 'easy' | 'med' | 'hard';
  totalScore: number | null;
  status: 'in_progress' | 'completed';
  createdAt: string;
  keyword: string | null;
  audioSources: SessionAudioSource[];
  previewText: string;
};

export async function recalculateDayRecord(dayRecordId: string) {
  const supabase = getSupabaseAdmin();

  const { data: sessions, error: sessionError } = await supabase
    .from('dictation_sessions')
    .select('status, total_score')
    .eq('day_record_id', dayRecordId);

  if (sessionError) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to recalculate day record score',
      500,
    );
  }

  const completedSessions = (sessions ?? []).filter(
    (session) =>
      session.status === 'completed' && typeof session.total_score === 'number',
  );

  const averageScore =
    completedSessions.length === 0
      ? null
      : Math.round(
          completedSessions.reduce(
            (sum, session) => sum + (session.total_score ?? 0),
            0,
          ) / completedSessions.length,
        );

  const status = completedSessions.length > 0 ? 'completed' : 'pending';

  const { error: updateDayRecordError } = await supabase
    .from('day_records')
    .update({
      average_score: averageScore,
      status,
    })
    .eq('id', dayRecordId);

  if (updateDayRecordError) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to update day record score',
      500,
    );
  }
}

export function normalizeKeyword(keyword: string | null | undefined) {
  if (keyword == null) {
    return null;
  }

  const trimmed = keyword.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function buildPreviewText(userInput: string | null) {
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

export async function createDictationSession(params: {
  userId: string;
  dayRecordId: string;
  audioSourceIds: string[];
  difficulty: 'easy' | 'med' | 'hard';
  keyword?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const { dayRecordId, audioSourceIds, difficulty, userId } = params;
  const keyword = normalizeKeyword(params.keyword);

  const { data: dayRecord, error: dayRecordError } = await supabase
    .from('day_records')
    .select('id, user_id, date')
    .eq('id', dayRecordId)
    .eq('user_id', userId)
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

  const { data: existingSessions, error: existingSessionError } = await supabase
    .from('dictation_sessions')
    .select('id, status')
    .eq('day_record_id', dayRecordId);

  if (existingSessionError) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to validate existing sessions',
      500,
    );
  }

  const hasCompletedSession = (existingSessions ?? []).some(
    (session) => session.status === 'completed',
  );

  if (hasCompletedSession) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Completed sessions cannot be overwritten',
      400,
    );
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

  return {
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
  };
}

export async function listDictationSessions(params: {
  userId: string;
  status?: 'in_progress' | 'completed';
  difficulty?: 'easy' | 'med' | 'hard';
  maxScore?: number;
  page: number;
  limit: number;
  keyword?: string | null;
  dayRecordId?: string;
}) {
  const supabase = getSupabaseAdmin();
  const { dayRecordId, difficulty, limit, maxScore, page, status, userId } =
    params;
  const keyword = normalizeKeyword(params.keyword ?? null);

  let dayRecordsQuery = supabase
    .from('day_records')
    .select('id')
    .eq('user_id', userId);

  if (dayRecordId) {
    dayRecordsQuery = dayRecordsQuery.eq('id', dayRecordId);
  }

  const { data: dayRecords, error: dayRecordError } = await dayRecordsQuery;

  if (dayRecordError) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to load day records',
      500,
    );
  }

  const dayRecordIds = (dayRecords ?? []).map((dayRecord) => dayRecord.id);

  if (dayRecordIds.length === 0) {
    return {
      sessions: [] as SessionSummary[],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
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

  let audioSourcesBySession = new Map<string, SessionAudioSource[]>();

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
    }, new Map<string, SessionAudioSource[]>());
  }

  return {
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
  };
}
