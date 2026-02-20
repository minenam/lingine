import { NextResponse } from 'next/server';

import { getAuthUser } from '@/lib/auth';
import { AppError, ERROR_CODES, toErrorResponse } from '@/lib/errors';
import { getSupabaseAdmin } from '@/lib/supabase';

type DayRecordRow = {
  id: string;
  date: string;
  average_score: number | null;
  status: 'pending' | 'completed';
  created_at: string;
};

type DictationSessionRow = {
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

type SentenceRow = {
  id: string;
  session_id: string;
  sentence_index: number;
  user_text: string;
  answer_text: string;
  score: number;
  created_at: string;
};

type AudioSourceRow = {
  id: string;
  day_record_id: string;
  type: 'file' | 'youtube';
  storage_path: string | null;
  url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
};

export async function POST() {
  try {
    const authUser = await getAuthUser();
    const supabase = getSupabaseAdmin();

    const { data: dayRecords, error: dayRecordsError } = await supabase
      .from('day_records')
      .select('id, date, average_score, status, created_at')
      .eq('user_id', authUser.userId)
      .order('date', { ascending: true })
      .returns<DayRecordRow[]>();

    if (dayRecordsError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load day records for backup',
        500,
      );
    }

    const dayRecordIds = (dayRecords ?? []).map((record) => record.id);

    let dictationSessions: DictationSessionRow[] = [];
    let sentences: SentenceRow[] = [];
    let audioSources: AudioSourceRow[] = [];

    if (dayRecordIds.length > 0) {
      const [
        { data: sessionsData, error: sessionsError },
        { data: audioData, error: audioError },
      ] = await Promise.all([
        supabase
          .from('dictation_sessions')
          .select(
            'id, day_record_id, difficulty, user_input, answer_key, keyword, answer_pdf_path, total_score, status, created_at, updated_at',
          )
          .in('day_record_id', dayRecordIds)
          .order('created_at', { ascending: true })
          .returns<DictationSessionRow[]>(),
        supabase
          .from('audio_sources')
          .select(
            'id, day_record_id, type, storage_path, url, file_name, file_type, created_at',
          )
          .in('day_record_id', dayRecordIds)
          .order('created_at', { ascending: true })
          .returns<AudioSourceRow[]>(),
      ]);

      if (sessionsError) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Failed to load dictation sessions for backup',
          500,
        );
      }

      if (audioError) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Failed to load audio sources for backup',
          500,
        );
      }

      dictationSessions = sessionsData ?? [];
      audioSources = audioData ?? [];

      const sessionIds = dictationSessions.map((session) => session.id);

      if (sessionIds.length > 0) {
        const { data: sentenceData, error: sentenceError } = await supabase
          .from('sentences')
          .select(
            'id, session_id, sentence_index, user_text, answer_text, score, created_at',
          )
          .in('session_id', sessionIds)
          .order('sentence_index', { ascending: true })
          .returns<SentenceRow[]>();

        if (sentenceError) {
          throw new AppError(
            ERROR_CODES.INTERNAL_ERROR,
            'Failed to load sentence records for backup',
            500,
          );
        }

        sentences = sentenceData ?? [];
      }
    }

    const backup = {
      exportedAt: new Date().toISOString(),
      data: {
        dayRecords: (dayRecords ?? []).map((record) => ({
          id: record.id,
          date: record.date,
          averageScore: record.average_score,
          status: record.status,
          createdAt: record.created_at,
        })),
        dictationSessions: dictationSessions.map((session) => ({
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
        })),
        sentences: sentences.map((sentence) => ({
          id: sentence.id,
          sessionId: sentence.session_id,
          sentenceIndex: sentence.sentence_index,
          userText: sentence.user_text,
          answerText: sentence.answer_text,
          score: sentence.score,
          createdAt: sentence.created_at,
        })),
        audioSources: audioSources.map((audio) => ({
          id: audio.id,
          dayRecordId: audio.day_record_id,
          type: audio.type,
          storagePath: audio.storage_path,
          url: audio.url,
          fileName: audio.file_name,
          fileType: audio.file_type,
          createdAt: audio.created_at,
        })),
      },
    };

    const date = new Date().toISOString().slice(0, 10);
    const filename = `lingine-backup-${date}.json`;

    return new NextResponse(JSON.stringify({ backup }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}
