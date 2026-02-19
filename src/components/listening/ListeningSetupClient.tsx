'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useListeningSetup } from './useListeningSetup';

type Props = {
  date: string;
  dayRecordId: string;
};

export default function ListeningSetupClient({ dayRecordId }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
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
  } = useListeningSetup(dayRecordId);

  const handleStart = async () => {
    const sessionId = await handleStartLearning();
    if (sessionId) {
      router.push(`/dictation/${sessionId}`);
    }
  };

  return (
    <section
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        display: 'grid',
        gap: '14px',
      }}
    >
      <header style={{ display: 'grid', gap: '6px' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: '#111',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          aria-label="Back to module hub"
        >
          {'< Listening Setup'}
        </button>
        <p style={{ margin: 0, color: '#666' }}>
          Choose a file or link to start dictation.
        </p>
      </header>

      {isLoading && (
        <div
          style={{
            display: 'grid',
            gap: '12px',
            padding: '24px 0',
          }}
        >
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: '72px',
                borderRadius: '18px',
                background: '#f3f3f3',
              }}
            />
          ))}
        </div>
      )}

      {!isLoading && sourceType === 'none' && (
        <>
          <button
            type="button"
            onClick={() => selectSource('file')}
            style={{
              borderRadius: '18px',
              border: '1px solid #e6e6e6',
              background: '#fff',
              boxShadow: '0 8px 18px rgba(17,24,39,0.05)',
              padding: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              width: '100%',
              textAlign: 'left',
            }}
            aria-label="Upload audio file"
          >
            <span
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '999px',
                background: '#e8f7ec',
                color: '#2f7a3f',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
              }}
            >
              F
            </span>
            <div style={{ display: 'grid', gap: '4px' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#111' }}>
                Upload Audio File
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                MP3, WAV, M4A
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => selectSource('youtube')}
            style={{
              borderRadius: '18px',
              border: '1px solid #e6e6e6',
              background: '#fff',
              boxShadow: '0 8px 18px rgba(17,24,39,0.05)',
              padding: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              width: '100%',
              textAlign: 'left',
            }}
            aria-label="YouTube link"
          >
            <span
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '999px',
                background: '#fff0f0',
                color: '#cf2e2e',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
              }}
            >
              Y
            </span>
            <div style={{ display: 'grid', gap: '4px' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#111' }}>
                YouTube Link
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                Paste video URL
              </p>
            </div>
          </button>
        </>
      )}

      {!isLoading && sourceType === 'file' && (
        <>
          <div>
            <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: '#111' }}>
              Upload Audio Files
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              Support multiple files
            </p>
          </div>

          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f7f7f7',
                borderRadius: '10px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <span
                  style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}
                >
                  FILE
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                  }}
                >
                  {file.fileName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteFile(file.id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#cf2e2e',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px',
                }}
              >
                Delete
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{
              border: '2px dashed #ddd',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              color: '#888',
              background: 'transparent',
              width: '100%',
              fontSize: '15px',
              fontWeight: 500,
            }}
          >
            {isUploading ? 'Uploading...' : '+ Add Audio File'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/wav,audio/x-m4a"
            multiple
            hidden
            onChange={(e) => {
              handleFileUpload(e.target.files);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            disabled={uploadedFiles.length === 0 || isCreatingSession}
            onClick={handleStart}
            style={{
              background:
                uploadedFiles.length === 0 || isCreatingSession
                  ? '#eaeaea'
                  : '#1a1a2e',
              color:
                uploadedFiles.length === 0 || isCreatingSession
                  ? '#999'
                  : '#fff',
              border: 'none',
              borderRadius: '10px',
              height: '48px',
              cursor:
                uploadedFiles.length === 0 || isCreatingSession
                  ? 'not-allowed'
                  : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              width: '100%',
            }}
          >
            {isCreatingSession
              ? 'Creating...'
              : `Start Learning (${uploadedFiles.length})`}
          </button>
        </>
      )}

      {!isLoading && sourceType === 'youtube' && (
        <>
          <div>
            <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: '#111' }}>
              YouTube Link
            </p>
          </div>

          <input
            placeholder="https://youtu.be/..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            style={{
              height: '44px',
              borderRadius: '10px',
              border: youtubeError ? '1px solid #cf2e2e' : '1px solid #ddd',
              padding: '0 16px',
              fontSize: '15px',
              width: '100%',
              boxSizing: 'border-box' as const,
              outline: 'none',
            }}
          />
          {youtubeError && (
            <p style={{ color: '#cf2e2e', fontSize: '14px', margin: 0 }}>
              {youtubeError}
            </p>
          )}

          <button
            type="button"
            disabled={!youtubeUrl.trim() || isUploading}
            onClick={handleLoadVideo}
            style={{
              background:
                !youtubeUrl.trim() || isUploading ? '#eaeaea' : '#1a1a2e',
              color: !youtubeUrl.trim() || isUploading ? '#999' : '#fff',
              border: 'none',
              borderRadius: '10px',
              height: '48px',
              cursor:
                !youtubeUrl.trim() || isUploading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              width: '100%',
            }}
          >
            {isUploading ? 'Loading...' : 'Load Video'}
          </button>

          {uploadedFiles.length > 0 && (
            <>
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 16px',
                    background: '#f7f7f7',
                    borderRadius: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#cf2e2e',
                        fontWeight: 600,
                      }}
                    >
                      YT
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '220px',
                      }}
                    >
                      {file.fileName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(file.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#cf2e2e',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={isCreatingSession || uploadedFiles.length === 0}
                onClick={handleStart}
                style={{
                  background:
                    isCreatingSession || uploadedFiles.length === 0
                      ? '#eaeaea'
                      : '#1a1a2e',
                  color:
                    isCreatingSession || uploadedFiles.length === 0
                      ? '#999'
                      : '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  height: '48px',
                  cursor:
                    isCreatingSession || uploadedFiles.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                  fontSize: '16px',
                  fontWeight: 600,
                  width: '100%',
                }}
              >
                {isCreatingSession
                  ? 'Creating...'
                  : `Start Learning (${uploadedFiles.length})`}
              </button>
            </>
          )}
        </>
      )}

      {errorMessage && (
        <p style={{ color: '#cf2e2e', fontSize: '14px', margin: 0 }}>
          {errorMessage}
        </p>
      )}
    </section>
  );
}
