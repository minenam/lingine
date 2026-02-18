import type { ErrorCode } from '@/lib/errors';

export type ApiErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
  };
};
