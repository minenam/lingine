import { createClient } from '@supabase/supabase-js';

import { AppError, ERROR_CODES } from '@/lib/errors';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      'Supabase environment is not configured',
      500,
    );
  }

  return {
    url,
    anonKey,
    serviceRoleKey,
  };
}

export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();

  return createClient(url, anonKey);
}

export function getSupabaseAdmin() {
  const { url, serviceRoleKey } = getSupabaseConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
