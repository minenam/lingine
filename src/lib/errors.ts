export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  EMPTY_PASSWORD: 'EMPTY_PASSWORD',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  INVALID_URL: 'INVALID_URL',
  SCORING_ERROR: 'SCORING_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  code: ErrorCode;
  status: number;

  constructor(code: ErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(ERROR_CODES.UNAUTHORIZED, message, 401);
  }
}

export function toErrorResponse(error: unknown): {
  error: { code: ErrorCode; message: string };
  status: number;
} {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
      },
      status: error.status,
    };
  }

  return {
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Internal server error',
    },
    status: 500,
  };
}
