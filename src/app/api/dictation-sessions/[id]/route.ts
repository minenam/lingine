import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthUser } from '@/lib/auth';
import { noStoreJson } from '@/lib/apiResponse';
import { AppError, ERROR_CODES, toErrorResponse } from '@/lib/errors';
import { recalculateDayRecord } from '@/lib/services/dictationSessions';
import { getSupabaseAdmin } from '@/lib/supabase';

const updateSessionBodySchema = z
  .object({
    userInput: z.string().nullable().optional(),
    difficulty: z.enum(['easy', 'med', 'hard']).optional(),
    keyword: z.string().trim().max(255).nullable().optional(),
    status: z.literal('completed').optional(),
  })
  .refine(
    (value) =>
      value.userInput !== undefined ||
      value.difficulty !== undefined ||
      value.keyword !== undefined ||
      value.status !== undefined,
    {
      message: 'At least one field must be provided',
    },
  );

type SessionBaseRow = {
  id: string;
  day_record_id: string;
  difficulty: 'easy' | 'med' | 'hard';
  user_input: string | null;
  answer_key: string | null;
  keyword: string | null;
  answer_pdf_path: string | null;
  total_score: number | null;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
};

type DayRecordOwnerRow = {
  id: string;
  user_id: string;
};

type SessionAudioSourceRow = {
  audio_source: {
    id: string;
    type: 'file' | 'youtube';
    file_name: string | null;
    file_type: string | null;
    storage_path: string | null;
    url: string | null;
  } | null;
};

type SentenceRow = {
  sentence_index: number;
  user_text: string;
  answer_text: string;
  score: number;
};

function normalizeKeyword(keyword: string | null | undefined) {
  if (keyword == null) {
    return keyword;
  }

  const trimmed = keyword.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function loadAuthorizedSession(sessionId: string, userId: string) {
  const supabase = getSupabaseAdmin();

  const { data: session, error: sessionError } = await supabase
    .from('dictation_sessions')
    .select(
      'id, day_record_id, difficulty, user_input, answer_key, keyword, answer_pdf_path, total_score, status, created_at, updated_at',
    )
    .eq('id', sessionId)
    .maybeSingle<SessionBaseRow>();

  if (sessionError) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to load dictation session',
      500,
    );
  }

  if (!session) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Session not found', 404);
  }

  const { data: dayRecord, error: dayRecordError } = await supabase
    .from('day_records')
    .select('id, user_id')
    .eq('id', session.day_record_id)
    .maybeSingle<DayRecordOwnerRow>();

  if (dayRecordError) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to validate session ownership',
      500,
    );
  }

  if (!dayRecord || dayRecord.user_id !== userId) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Session not found', 404);
  }

  return session;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser();
    const { id } = await params;
    const session = await loadAuthorizedSession(id, authUser.userId);

    const supabase = getSupabaseAdmin();

    const { data: sessionAudioSources, error: audioSourceError } =
      await supabase
        .from('session_audio_sources')
        .select(
          'audio_source:audio_sources(id, type, file_name, file_type, storage_path, url)',
        )
        .eq('session_id', session.id)
        .returns<SessionAudioSourceRow[]>();

    if (audioSourceError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load session audio sources',
        500,
      );
    }

    const { data: sentences, error: sentenceError } = await supabase
      .from('sentences')
      .select('sentence_index, user_text, answer_text, score')
      .eq('session_id', session.id)
      .order('sentence_index', { ascending: true })
      .returns<SentenceRow[]>();

    if (sentenceError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load sentence scores',
        500,
      );
    }

    return noStoreJson({
      session: {
        id: session.id,
        dayRecordId: session.day_record_id,
        difficulty: session.difficulty,
        userInput: session.user_input,
        answerKey: session.answer_key,
        keyword: session.keyword,
        answerPdfPath: session.answer_pdf_path,
        totalScore: session.total_score,
        status: session.status,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        audioSources: (sessionAudioSources ?? [])
          .map((row) => row.audio_source)
          .filter((source) => source != null)
          .map((source) => {
            const sourceUrl =
              source.type === 'file' && source.storage_path
                ? supabase.storage
                    .from('audio')
                    .getPublicUrl(source.storage_path.replace(/^audio\//, ''))
                    .data.publicUrl
                : source.url;

            return {
              id: source.id,
              type: source.type,
              fileName: source.file_name,
              fileType: source.file_type,
              sourceUrl,
            };
          }),
        sentences:
          session.total_score === null
            ? []
            : (sentences ?? []).map((sentence) => ({
                sentenceIndex: sentence.sentence_index,
                userText: sentence.user_text,
                answerText: sentence.answer_text,
                score: sentence.score,
              })),
      },
    });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser();
    const { id } = await params;
    const session = await loadAuthorizedSession(id, authUser.userId);

    const body = await request.json();
    const parsedBody = updateSessionBodySchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid session update payload',
        400,
      );
    }

    if (session.status === 'completed') {
      if (parsedBody.data.userInput !== undefined) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Completed sessions only allow difficulty and keyword updates',
          400,
        );
      }
    }

    const shouldComplete =
      parsedBody.data.status === 'completed' && session.status !== 'completed';

    const shouldInvalidateScore =
      parsedBody.data.userInput !== undefined &&
      parsedBody.data.userInput !== session.user_input &&
      session.status !== 'completed';

    if (
      shouldComplete &&
      (session.total_score === null || shouldInvalidateScore)
    ) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Score is required before completing session',
        400,
      );
    }

    const normalizedKeyword = normalizeKeyword(parsedBody.data.keyword);

    const updatePayload: {
      user_input?: string | null;
      difficulty?: 'easy' | 'med' | 'hard';
      keyword?: string | null;
      total_score?: null;
      status?: 'completed';
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (parsedBody.data.userInput !== undefined) {
      updatePayload.user_input = parsedBody.data.userInput;
    }

    if (shouldInvalidateScore) {
      updatePayload.total_score = null;
    }

    if (parsedBody.data.difficulty !== undefined) {
      updatePayload.difficulty = parsedBody.data.difficulty;
    }

    if (parsedBody.data.keyword !== undefined) {
      updatePayload.keyword = normalizedKeyword;
    }

    if (parsedBody.data.status !== undefined) {
      updatePayload.status = parsedBody.data.status;
    }

    const supabase = getSupabaseAdmin();

    const { data: updatedSession, error: updateError } = await supabase
      .from('dictation_sessions')
      .update(updatePayload)
      .eq('id', id)
      .select(
        'id, user_input, difficulty, keyword, total_score, status, updated_at',
      )
      .single<{
        id: string;
        user_input: string | null;
        difficulty: 'easy' | 'med' | 'hard';
        keyword: string | null;
        total_score: number | null;
        status: 'in_progress' | 'completed';
        updated_at: string;
      }>();

    if (updateError || !updatedSession) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to update session',
        500,
      );
    }

    if (shouldInvalidateScore) {
      const { error: deleteSentenceError } = await supabase
        .from('sentences')
        .delete()
        .eq('session_id', session.id);

      if (deleteSentenceError) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Failed to reset previous score sentences',
          500,
        );
      }
    }

    if (shouldComplete) {
      await recalculateDayRecord(session.day_record_id);
    }

    return NextResponse.json({
      session: {
        id: updatedSession.id,
        userInput: updatedSession.user_input,
        difficulty: updatedSession.difficulty,
        keyword: updatedSession.keyword,
        totalScore: updatedSession.total_score,
        status: updatedSession.status,
        updatedAt: updatedSession.updated_at,
      },
    });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser();
    const { id } = await params;
    await loadAuthorizedSession(id, authUser.userId);

    const supabase = getSupabaseAdmin();

    const { error: deleteError } = await supabase
      .from('dictation_sessions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to delete session',
        500,
      );
    }

    return NextResponse.json({ message: 'Session deleted' });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}
