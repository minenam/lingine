import { describe, expect, it } from 'vitest';

import { ERROR_CODES, toErrorResponse } from '@/lib/errors';

describe('toErrorResponse', () => {
  it('returns internal error response for unknown error', () => {
    const response = toErrorResponse(new Error('unknown'));

    expect(response.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(response.status).toBe(500);
  });
});
