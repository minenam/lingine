import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthUser } from '@/lib/auth';
import { AppError, ERROR_CODES, toErrorResponse } from '@/lib/errors';
import { getSupabaseAdmin } from '@/lib/supabase';

const updateUserBodySchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    description: z.string().trim().max(255).nullable().optional(),
  })
  .superRefine((value, context) => {
    const hasPasswordUpdate =
      value.currentPassword !== undefined || value.newPassword !== undefined;
    const hasDescriptionUpdate = value.description !== undefined;

    if (!hasPasswordUpdate && !hasDescriptionUpdate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field must be provided',
      });
      return;
    }

    if (
      value.currentPassword === undefined ||
      value.newPassword === undefined
    ) {
      if (hasPasswordUpdate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Password updates require both currentPassword and newPassword',
        });
      }
    }
  });

type UserRow = {
  id: string;
  password_hash: string;
  role: string;
  description: string | null;
};

function normalizeDescription(description: string | null | undefined) {
  if (description == null) {
    return description;
  }

  const trimmed = description.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser();
    const { id } = await params;

    if (id !== authUser.userId) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', 404);
    }

    const body = await request.json();
    const parsedBody = updateUserBodySchema.safeParse(body);

    if (!parsedBody.success) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid user update payload',
        400,
      );
    }

    const hasPasswordUpdate =
      parsedBody.data.currentPassword !== undefined &&
      parsedBody.data.newPassword !== undefined;
    let passwordUpdate: {
      currentPassword: string;
      newPassword: string;
    } | null = null;

    if (hasPasswordUpdate) {
      const currentPassword = parsedBody.data.currentPassword?.trim() ?? '';
      const newPassword = parsedBody.data.newPassword?.trim() ?? '';

      if (currentPassword.length === 0 || newPassword.length === 0) {
        throw new AppError(
          ERROR_CODES.EMPTY_PASSWORD,
          'Password is required',
          400,
        );
      }

      passwordUpdate = {
        currentPassword,
        newPassword,
      };
    }

    const supabase = getSupabaseAdmin();

    const { data: user, error: loadError } = await supabase
      .from('users')
      .select('id, password_hash, role, description')
      .eq('id', id)
      .maybeSingle<UserRow>();

    if (loadError) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to load user',
        500,
      );
    }

    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', 404);
    }

    const updatePayload: {
      password_hash?: string;
      description?: string | null;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (parsedBody.data.description !== undefined) {
      updatePayload.description = normalizeDescription(
        parsedBody.data.description,
      );
    }

    if (passwordUpdate) {
      const { currentPassword, newPassword } = passwordUpdate;

      let isValidPassword = false;

      try {
        isValidPassword = await bcrypt.compare(
          currentPassword,
          user.password_hash,
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
          'Current password is incorrect',
          401,
        );
      }

      updatePayload.password_hash = await bcrypt.hash(newPassword, 10);
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .select('id, role, description')
      .single<{
        id: string;
        role: string;
        description: string | null;
      }>();

    if (updateError || !updatedUser) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to update user',
        500,
      );
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        description: updatedUser.description,
      },
    });
  } catch (error) {
    const { error: apiError, status } = toErrorResponse(error);
    return NextResponse.json({ error: apiError }, { status });
  }
}
