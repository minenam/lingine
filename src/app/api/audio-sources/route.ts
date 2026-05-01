import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthUser } from '@/lib/auth';
import { noStoreJson } from '@/lib/apiResponse';
import { AppError, ERROR_CODES, toErrorResponse } from '@/lib/errors';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const AUDIO_STORAGE_BUCKET = 'audio';
const MAX_AUDIO_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/x-m4a',
]);

const youtubeBodySchema = z.object({
  dayRecordId: z.string().uuid(),
  type: z.literal('youtube'),
  url: z.string().trim().min(1),
});

type DayRecordOwnerRow = {
  id: string;
  user_id: string;
  date: string;
};

type InsertedAudioSourceRow = {
  id: string;
  type: 'file' | 'youtube';
  file_name: string | null;
  file_type: string | null;
};

function normalizeFileName(fileName: string) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized.length > 0 ? sanitized : 'audio.bin';
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
  return `${AUDIO_STORAGE_BUCKET}/${objectPath}`;
}

function extractYoutubeVideoId(inputUrl: string) {
  const trimmed = inputUrl.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const withProtocol =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
    const url = new URL(withProtocol);
    const host = url.hostname.toLowerCase();

    const isYoutubeHost =
      host === 'youtu.be' ||
      host === 'www.youtu.be' ||
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com';

    if (!isYoutubeHost) {
      return null;
    }

    const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;

    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const shortId = url.pathname.replace(/^\//, '').split('/')[0] ?? '';
      return videoIdPattern.test(shortId) ? shortId : null;
    }

    const queryVideoId = url.searchParams.get('v');

    if (queryVideoId && videoIdPattern.test(queryVideoId)) {
      return queryVideoId;
    }

    const pathSegments = url.pathname.split('/').filter(Boolean);

    if (pathSegments.length >= 2) {
      const [prefix, idCandidate] = pathSegments;
      if (
        ['embed', 'shorts', 'v', 'live'].includes(prefix) &&
        videoIdPattern.test(idCandidate)
      ) {
        return idCandidate;
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function loadAuthorizedDayRecord(dayRecordId: string, userId: string) {
  const supabase = getSupabaseAdmin();

  const { data: dayRecord, error } = await supabase
    .from('day_records')
    .select('id, user_id, date')
    .eq('id', dayRecordId)
    .maybeSingle<DayRecordOwnerRow>();

  if (error) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to load day record',
      500,
    );
  }

  if (!dayRecord || dayRecord.user_id !== userId) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 'Day record not found', 404);
  }

  return dayRecord;
}

async function createYoutubeAudioSource(params: {
  userId: string;
  dayRecordId: string;
  inputUrl: string;
}) {
  const dayRecord = await loadAuthorizedDayRecord(
    params.dayRecordId,
    params.userId,
  );
  const videoId = extractYoutubeVideoId(params.inputUrl);

  if (!videoId) {
    throw new AppError(ERROR_CODES.INVALID_URL, 'Invalid YouTube URL', 400);
  }

  const normalizedUrl =
    params.inputUrl.startsWith('http://') ||
    params.inputUrl.startsWith('https://')
      ? params.inputUrl
      : `https://${params.inputUrl}`;
  const supabase = getSupabaseAdmin();

  const { data: inserted, error: insertError } = await supabase
    .from('audio_sources')
    .insert({
      day_record_id: dayRecord.id,
      type: 'youtube',
      url: normalizedUrl,
      file_name: `youtube:${videoId}`,
      file_type: 'youtube',
    })
    .select('id, type, file_name, file_type')
    .single<InsertedAudioSourceRow>();

  if (insertError || !inserted) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Failed to save YouTube audio source',
      500,
    );
  }

  return {
    id: inserted.id,
    type: inserted.type,
    fileName: inserted.file_name,
    fileType: inserted.file_type,
  };
}

async function createFileAudioSources(params: {
  userId: string;
  dayRecordId: string;
  files: File[];
}) {
  const dayRecord = await loadAuthorizedDayRecord(
    params.dayRecordId,
    params.userId,
  );
  const supabase = getSupabaseAdmin();
  const createdAudioSources: Array<{
    id: string;
    type: 'file' | 'youtube';
    fileName: string | null;
    fileType: string | null;
  }> = [];

  for (const file of params.files) {
    if (!ALLOWED_AUDIO_MIME_TYPES.has(file.type)) {
      throw new AppError(
        ERROR_CODES.INVALID_FILE_TYPE,
        'Invalid audio file type',
        400,
      );
    }

    if (file.size > MAX_AUDIO_FILE_SIZE) {
      throw new AppError(ERROR_CODES.FILE_TOO_LARGE, 'File too large', 413);
    }

    const originalFileName = normalizeFileName(file.name);
    const objectPath = buildStorageObjectPath({
      userId: params.userId,
      date: dayRecord.date,
      fileName: originalFileName,
    });
    const storagePath = buildStoragePath(objectPath);

    const { error: uploadError } = await supabase.storage
      .from(AUDIO_STORAGE_BUCKET)
      .upload(objectPath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to upload audio file',
        500,
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from('audio_sources')
      .insert({
        day_record_id: dayRecord.id,
        type: 'file',
        storage_path: storagePath,
        file_name: originalFileName,
        file_type: file.type,
      })
      .select('id, type, file_name, file_type')
      .single<InsertedAudioSourceRow>();

    if (insertError || !inserted) {
      await supabase.storage.from(AUDIO_STORAGE_BUCKET).remove([objectPath]);

      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to save audio source metadata',
        500,
      );
    }

    createdAudioSources.push({
      id: inserted.id,
      type: inserted.type,
      fileName: inserted.file_name,
      fileType: inserted.file_type,
    });
  }

  return createdAudioSources;
}

type AudioSourceRow = {
  id: string;
  type: 'file' | 'youtube';
  file_name: string | null;
  file_type: string | null;
};

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();
    const { searchParams } = new URL(request.url);
    const dayRecordId = searchParams.get('dayRecordId');

    if (!dayRecordId || !z.string().uuid().safeParse(dayRecordId).success) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid or missing dayRecordId',
        400,
      );
    }

    await loadAuthorizedDayRecord(dayRecordId, authUser.userId);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('audio_sources')
      .select('id, type, file_name, file_type')
      .eq('day_record_id', dayRecordId)
      .order('created_at', { ascending: true })
      .returns<AudioSourceRow[]>();

    if (error) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load audio sources',
        500,
      );
    }

    const audioSources = (data ?? []).map((row) => ({
      id: row.id,
      type: row.type,
      fileName: row.file_name,
      fileType: row.file_type,
    }));

    return noStoreJson({ audioSources });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const dayRecordIdValue = formData.get('dayRecordId');
      const requestTypeValue = formData.get('type');

      if (
        typeof dayRecordIdValue !== 'string' ||
        typeof requestTypeValue !== 'string'
      ) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Invalid file upload payload',
          400,
        );
      }

      if (requestTypeValue !== 'file') {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Invalid source type',
          400,
        );
      }

      const parsedDayRecordId = z.string().uuid().safeParse(dayRecordIdValue);

      if (!parsedDayRecordId.success) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Invalid dayRecordId',
          400,
        );
      }

      const files = formData
        .getAll('files')
        .filter((value): value is File => value instanceof File);

      if (files.length === 0) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'No audio file was provided',
          400,
        );
      }

      const audioSources = await createFileAudioSources({
        userId: authUser.userId,
        dayRecordId: parsedDayRecordId.data,
        files,
      });

      return NextResponse.json({ audioSources }, { status: 201 });
    }

    const body = await request.json();
    const parsedBody = youtubeBodySchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid YouTube payload',
        400,
      );
    }

    const audioSource = await createYoutubeAudioSource({
      userId: authUser.userId,
      dayRecordId: parsedBody.data.dayRecordId,
      inputUrl: parsedBody.data.url,
    });

    return NextResponse.json({ audioSources: [audioSource] }, { status: 201 });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}
