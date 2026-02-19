import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { AppError, ERROR_CODES, toErrorResponse } from '@/lib/errors';
import { getSupabaseAdmin } from '@/lib/supabase';

const AUDIO_STORAGE_BUCKET = 'audio';

type AudioSourceRow = {
  id: string;
  day_record_id: string;
  type: 'file' | 'youtube';
  storage_path: string | null;
};

type DayRecordOwnerRow = {
  id: string;
  user_id: string;
};

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser();

    const supabase = getSupabaseAdmin();

    // 1. Fetch audio_source by id
    const { data: audioSource, error: audioError } = await supabase
      .from('audio_sources')
      .select('id, day_record_id, type, storage_path')
      .eq('id', id)
      .maybeSingle<AudioSourceRow>();

    if (audioError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load audio source',
        500,
      );
    }

    if (!audioSource) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Audio source not found', 404);
    }

    // 2. Fetch day_record to verify ownership
    const { data: dayRecord, error: dayRecordError } = await supabase
      .from('day_records')
      .select('id, user_id')
      .eq('id', audioSource.day_record_id)
      .maybeSingle<DayRecordOwnerRow>();

    if (dayRecordError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to validate audio source ownership',
        500,
      );
    }

    if (!dayRecord || dayRecord.user_id !== authUser.userId) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Audio source not found', 404);
    }

    if (dayRecord.user_id !== authUser.userId) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Audio source not found', 404);
    }

    // 3. Delete storage file if type is 'file' and storage_path exists
    if (audioSource.type === 'file' && audioSource.storage_path) {
      const objectPath = audioSource.storage_path.replace(/^audio\//, '');
      await supabase.storage.from(AUDIO_STORAGE_BUCKET).remove([objectPath]);
    }

    // 4. Delete audio_source record from DB
    const { error: deleteError } = await supabase
      .from('audio_sources')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to delete audio source',
        500,
      );
    }

    // 5. Return success response
    return NextResponse.json({ message: 'Audio source deleted' });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}
