import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  signAuthToken,
} from '@/lib/auth';
import { AppError, ERROR_CODES, toErrorResponse } from '@/lib/errors';
import { getSupabaseAdmin } from '@/lib/supabase';

const loginBodySchema = z.object({
  password: z.string(),
});

type LoginUserRow = {
  id: string;
  password_hash: string;
  role: string;
  description: string | null;
};

type SupabaseQueryError = {
  code?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = loginBodySchema.safeParse(body);

    if (!parsedBody.success || parsedBody.data.password.trim().length === 0) {
      throw new AppError(
        ERROR_CODES.EMPTY_PASSWORD,
        'Password is required',
        400,
      );
    }

    const { data: users, error } = await getSupabaseAdmin()
      .from('users')
      .select('id, password_hash, role, description')
      .order('created_at', { ascending: true })
      .limit(1)
      .returns<LoginUserRow[]>();

    if (error) {
      const queryError = error as SupabaseQueryError;

      if (queryError.code === '42P01' || queryError.code === 'PGRST205') {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Supabase table users is missing. Complete FR-00 DB setup first.',
          500,
        );
      }

      if (queryError.code === '42703') {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'users table schema is invalid. Required columns: id, password_hash, role, description.',
          500,
        );
      }

      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        queryError.message || 'Failed to load user from Supabase',
        500,
      );
    }

    const user = users?.[0] ?? null;

    if (!user) {
      throw new AppError(
        ERROR_CODES.INVALID_PASSWORD,
        'Incorrect password',
        401,
      );
    }

    const passwordHash = user.password_hash?.trim();

    if (!passwordHash) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'users.password_hash is empty. Seed a valid bcrypt hash first.',
        500,
      );
    }

    let isValidPassword = false;

    try {
      isValidPassword = await bcrypt.compare(
        parsedBody.data.password,
        passwordHash,
      );
    } catch {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'users.password_hash format is invalid. Seed a valid bcrypt hash first.',
        500,
      );
    }

    if (!isValidPassword) {
      throw new AppError(
        ERROR_CODES.INVALID_PASSWORD,
        'Incorrect password',
        401,
      );
    }

    const token = signAuthToken(user.id);
    const response = NextResponse.json({
      user: {
        id: user.id,
        role: user.role,
        description: user.description,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    if (!(error instanceof AppError)) {
      console.error('[login-route] unexpected error', error);
    }

    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}
