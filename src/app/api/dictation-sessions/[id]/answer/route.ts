import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthUser } from '@/lib/auth';
import { AppError, ERROR_CODES, toErrorResponse } from '@/lib/errors';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const PDF_STORAGE_BUCKET = 'pdf';
const MAX_PDF_FILE_SIZE = 10 * 1024 * 1024;

const manualBodySchema = z.object({
  type: z.literal('manual'),
  answerKey: z.string(),
});

type SessionOwnerRow = {
  id: string;
  day_record_id: string;
  status: 'in_progress' | 'completed';
};

type DayRecordOwnerRow = {
  id: string;
  user_id: string;
  date: string;
};

function normalizeFileName(fileName: string) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized.length > 0 ? sanitized : 'answer.pdf';
}

function buildStorageObjectPath(params: {
  userId: string;
  date: string;
  fileName: string;
}) {
  const uniquePrefix = `${Date.now()}-${crypto.randomUUID()}`;
  return `${params.userId}/${params.date}/${uniquePrefix}-${params.fileName}`;
}

function buildStoragePath(objectPath: string) {
  return `${PDF_STORAGE_BUCKET}/${objectPath}`;
}

async function loadAuthorizedSessionWithDayRecord(
  sessionId: string,
  userId: string,
) {
  const supabase = getSupabaseAdmin();

  const { data: session, error: sessionError } = await supabase
    .from('dictation_sessions')
    .select('id, day_record_id, status')
    .eq('id', sessionId)
    .maybeSingle<SessionOwnerRow>();

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
    .select('id, user_id, date')
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

  return {
    sessionId: session.id,
    status: session.status,
    dayRecord,
  };
}

async function handleManualAnswerUpload(request: Request, sessionId: string) {
  const body = await request.json();
  const parsed = manualBodySchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid manual answer payload',
      400,
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: updated, error: updateError } = await supabase
    .from('dictation_sessions')
    .update({
      answer_key: parsed.data.answerKey,
      total_score: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select('id, answer_key, answer_pdf_path')
    .single<{
      id: string;
      answer_key: string | null;
      answer_pdf_path: string | null;
    }>();

  if (updateError || !updated) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to save answer key',
      500,
    );
  }

  const { error: deleteSentenceError } = await supabase
    .from('sentences')
    .delete()
    .eq('session_id', sessionId);

  if (deleteSentenceError) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to reset previous score sentences',
      500,
    );
  }

  return NextResponse.json({
    session: {
      id: updated.id,
      answerKey: updated.answer_key,
      answerPdfPath: updated.answer_pdf_path,
    },
  });
}

async function handlePdfAnswerUpload(
  request: Request,
  sessionId: string,
  userId: string,
) {
  const formData = await request.formData();
  const type = String(formData.get('type') ?? '');
  const file = formData.get('file');

  if (type !== 'pdf') {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid upload type',
      400,
    );
  }

  if (!(file instanceof File)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      'PDF file is required',
      400,
    );
  }

  if (file.type !== 'application/pdf') {
    throw new AppError(
      ERROR_CODES.INVALID_FILE_TYPE,
      'Invalid PDF file type',
      400,
    );
  }

  if (file.size > MAX_PDF_FILE_SIZE) {
    throw new AppError(ERROR_CODES.FILE_TOO_LARGE, 'File too large', 413);
  }

  const { dayRecord } = await loadAuthorizedSessionWithDayRecord(
    sessionId,
    userId,
  );

  const normalizedFileName = normalizeFileName(file.name);
  const objectPath = buildStorageObjectPath({
    userId,
    date: dayRecord.date,
    fileName: normalizedFileName,
  });

  const supabase = getSupabaseAdmin();

  const { error: uploadError } = await supabase.storage
    .from(PDF_STORAGE_BUCKET)
    .upload(objectPath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to upload PDF answer',
      500,
    );
  }

  const storagePath = buildStoragePath(objectPath);

  const { data: updated, error: updateError } = await supabase
    .from('dictation_sessions')
    .update({
      answer_pdf_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select('id, answer_key, answer_pdf_path')
    .single<{
      id: string;
      answer_key: string | null;
      answer_pdf_path: string | null;
    }>();

  if (updateError || !updated) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to save PDF answer path',
      500,
    );
  }

  return NextResponse.json({
    session: {
      id: updated.id,
      answerKey: updated.answer_key,
      answerPdfPath: updated.answer_pdf_path,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser();
    const { id } = await params;
    const session = await loadAuthorizedSessionWithDayRecord(
      id,
      authUser.userId,
    );

    if (session.status === 'completed') {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Completed sessions cannot upload answers again',
        400,
      );
    }

    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      return await handlePdfAnswerUpload(request, id, authUser.userId);
    }

    return await handleManualAnswerUpload(request, id);
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}
