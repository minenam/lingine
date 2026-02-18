import type { ErrorCode } from '@/lib/errors';

export type ApiErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
  };
};

export type Difficulty = 'easy' | 'med' | 'hard';

export type DictationSession = {
  id: string;
  dayRecordId: string;
  difficulty: Difficulty;
  userInput: string | null;
  answerKey: string | null;
  keyword: string | null;
  answerPdfPath: string | null;
  totalScore: number | null;
  status: 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
};

export type SessionAudioSource = {
  id: string;
  type: 'file' | 'youtube';
  fileName: string | null;
};
