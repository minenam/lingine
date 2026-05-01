import { NextResponse } from 'next/server';

export const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

export function noStoreJson<T>(body: T, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);

  Object.entries(NO_STORE_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}
