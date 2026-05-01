import { NextResponse } from 'next/server';

import { getAuthUser } from '@/lib/auth';
import { noStoreJson } from '@/lib/apiResponse';
import { AppError, ERROR_CODES, toErrorResponse } from '@/lib/errors';
import { recalculateDayRecord } from '@/lib/services/dictationSessions';
import { mapFeedback, scoreSessionTexts } from '@/lib/services/scoring';
import { getSupabaseAdmin } from '@/lib/supabase';

type SessionRow = {
  id: string;
  day_record_id: string;
  user_input: string | null;
  answer_key: string | null;
  total_score: number | null;
  status: 'in_progress' | 'completed';
};

type DayRecordOwnerRow = {
  id: string;
  user_id: string;
};

type SentenceRow = {
  sentence_index: number;
  user_text: string;
  answer_text: string;
  score: number;
};

async function loadAuthorizedSession(sessionId: string, userId: string) {
  const supabase = getSupabaseAdmin();

  const { data: session, error: sessionError } = await supabase
    .from('dictation_sessions')
    .select('id, day_record_id, user_input, answer_key, total_score, status')
    .eq('id', sessionId)
    .maybeSingle<SessionRow>();

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

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser();
    const { id } = await params;
    const session = await loadAuthorizedSession(id, authUser.userId);

    if (session.status === 'completed') {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Completed sessions cannot be scored again',
        400,
      );
    }

    if (!session.answer_key || session.answer_key.trim().length === 0) {
      throw new AppError(
        ERROR_CODES.SCORING_ERROR,
        'Answer key is required for scoring',
        422,
      );
    }

    const result = scoreSessionTexts({
      userInput: session.user_input,
      answerKey: session.answer_key,
    });

    const supabase = getSupabaseAdmin();

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

    if (result.sentenceScores.length > 0) {
      const { error: insertSentenceError } = await supabase
        .from('sentences')
        .insert(
          result.sentenceScores.map((sentence) => ({
            session_id: session.id,
            sentence_index: sentence.sentenceIndex,
            user_text: sentence.userText,
            answer_text: sentence.answerText,
            score: sentence.score,
          })),
        );

      if (insertSentenceError) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Failed to save sentence scores',
          500,
        );
      }
    }

    const { error: updateSessionError } = await supabase
      .from('dictation_sessions')
      .update({
        total_score: result.totalScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (updateSessionError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to update session score',
        500,
      );
    }

    return NextResponse.json(
      {
        result: {
          totalScore: result.totalScore,
          feedback: result.feedback,
          sentenceScores: result.sentenceScores.map((sentence) => ({
            sentenceIndex: sentence.sentenceIndex,
            userText: sentence.userText,
            answerText: sentence.answerText,
            score: sentence.score,
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser();
    const { id } = await params;
    const session = await loadAuthorizedSession(id, authUser.userId);

    if (session.total_score === null) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Score not found', 404);
    }

    const supabase = getSupabaseAdmin();

    const { data: sentenceRows, error: sentenceError } = await supabase
      .from('sentences')
      .select('sentence_index, user_text, answer_text, score')
      .eq('session_id', session.id)
      .order('sentence_index', { ascending: true })
      .returns<SentenceRow[]>();

    if (sentenceError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load score sentences',
        500,
      );
    }

    return noStoreJson({
      result: {
        totalScore: session.total_score,
        feedback: mapFeedback(session.total_score),
        sentenceScores: (sentenceRows ?? []).map((sentence) => ({
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser();
    const { id } = await params;
    const session = await loadAuthorizedSession(id, authUser.userId);

    if (session.status === 'completed') {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Completed sessions cannot reset scores',
        400,
      );
    }

    const supabase = getSupabaseAdmin();

    const { error: deleteSentenceError } = await supabase
      .from('sentences')
      .delete()
      .eq('session_id', session.id);

    if (deleteSentenceError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to delete sentence scores',
        500,
      );
    }

    const { error: updateSessionError } = await supabase
      .from('dictation_sessions')
      .update({
        total_score: null,
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (updateSessionError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to reset session score',
        500,
      );
    }

    await recalculateDayRecord(session.day_record_id);

    return NextResponse.json({ message: 'Score deleted' });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}
