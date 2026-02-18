import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

import { AuthError } from '@/lib/errors';

export const AUTH_COOKIE_NAME = 'lingine_token';
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getJwtSecret(): string | null {
  return process.env.JWT_SECRET ?? null;
}

type JwtPayload = {
  userId: string;
  iat: number;
  exp: number;
};

export function signAuthToken(userId: string): string {
  const secret = getJwtSecret();

  if (!secret) {
    throw new AuthError('JWT secret is not configured');
  }

  return jwt.sign({ userId }, secret, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

export function verifyAuthToken(token: string): { userId: string } | null {
  const secret = getJwtSecret();

  if (!secret) {
    return null;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<{ userId: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    throw new AuthError('Missing auth token');
  }

  const authUser = verifyAuthToken(token);

  if (!authUser) {
    throw new AuthError('Invalid or expired token');
  }

  return authUser;
}
