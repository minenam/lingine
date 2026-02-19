'use client';

import { useEffect, useState } from 'react';

type AudioSource = {
  id: string;
  fileName: string;
  fileType: string;
};

type UploadResponse = {
  audioSources?: AudioSource[];
  error?: { code: string; message: string };
};

type SessionResponse = {
  session?: { id: string };
  error?: { code: string; message: string };
};

type FetchResponse = {
  audioSources?: Array<{
    id: string;
    type: 'file' | 'youtube';
    fileName: string | null;
    fileType: string | null;
  }>;
  error?: { code: string; message: string };
};

export function useListeningSetup(dayRecordId: string) {
  const [sourceType, setSourceType] = useState<'none' | 'file' | 'youtube'>(
    'none',
  );
  const [uploadedFiles, setUploadedFiles] = useState<AudioSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadExisting = async () => {
      try {
        const res = await fetch(
          `/api/audio-sources?dayRecordId=${encodeURIComponent(dayRecordId)}`,
        );
        const data: FetchResponse = await res.json();

        if (cancelled) return;

        if (res.ok && data.audioSources && data.audioSources.length > 0) {
          const sources: AudioSource[] = data.audioSources.map((s) => ({
            id: s.id,
            fileName: s.fileName ?? '',
            fileType: s.fileType ?? '',
          }));
          setUploadedFiles(sources);

          const hasFile = data.audioSources.some((s) => s.type === 'file');
          if (hasFile) {
            setSourceType('file');
          } else {
            setSourceType('youtube');
          }
        }
      } catch {
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadExisting();

    return () => {
      cancelled = true;
    };
  }, [dayRecordId]);
  const selectSource = (type: 'file' | 'youtube') => {
    setSourceType(type);
    setErrorMessage('');
    setYoutubeError('');
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('dayRecordId', dayRecordId);
      formData.append('type', 'file');
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch('/api/audio-sources', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to upload files');
      }

      if (data.audioSources) {
        setUploadedFiles((prev) => [...prev, ...data.audioSources!]);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (audioSourceId: string) => {
    setErrorMessage('');
    try {
      const res = await fetch(`/api/audio-sources/${audioSourceId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete file');
      }

      setUploadedFiles((prev) => prev.filter((f) => f.id !== audioSourceId));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleLoadVideo = async () => {
    if (!youtubeUrl.trim()) return;

    setIsUploading(true);
    setYoutubeError('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/audio-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayRecordId,
          type: 'youtube',
          url: youtubeUrl,
        }),
      });

      const data: UploadResponse = await res.json();

      if (!res.ok || data.error) {
        if (data.error?.code === 'INVALID_URL') {
          setYoutubeError('유효하지 않은 YouTube URL입니다.');
        } else {
          throw new Error(data.error?.message || 'Failed to load video');
        }
        return;
      }

      if (data.audioSources) {
        setUploadedFiles((prev) => [...prev, ...data.audioSources!]);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartLearning = async () => {
    if (uploadedFiles.length === 0) return null;

    setIsCreatingSession(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/dictation-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayRecordId,
          audioSourceIds: uploadedFiles.map((f) => f.id),
          difficulty: 'med',
        }),
      });

      const data: SessionResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to start session');
      }

      return data.session?.id;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Start failed');
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  return {
    sourceType,
    uploadedFiles,
    isLoading,
    isUploading,
    isCreatingSession,
    errorMessage,
    youtubeUrl,
    youtubeError,
    selectSource,
    handleFileUpload,
    handleDeleteFile,
    setYoutubeUrl,
    handleLoadVideo,
    handleStartLearning,
  };
}
