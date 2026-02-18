import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { AuthError } from '@/lib/errors';
import { env } from '@/lib/env';

export const AUTH_COOKIE_NAME = 'lingine_token';

type JwtPayload = {
  userId: string;
  iat: number;
  exp: number;
};

export function signAuthToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

export async function getAuthUser(): Promise<{ userId: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    throw new AuthError('Missing auth token');
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return { userId: payload.userId };
  } catch {
    throw new AuthError('Invalid or expired token');
  }
}
