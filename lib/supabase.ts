import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Checks whether Supabase client environment variables are properly populated.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-ref') &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes('PUBLIC_ANON_KEY_HERE')
  );
};

/**
 * Checks whether Supabase server-side administrative credentials are fully set.
 * STRICT: Does NOT fall back to anon key.
 */
export const isSupabaseServerConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-ref') &&
    supabaseServiceKey &&
    !supabaseServiceKey.includes('SERVICE_ROLE_KEY_HERE')
  );
};

/**
 * Public client for client-side interactions (governed by Supabase RLS).
 * NEVER expose service role key to this client.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

/**
 * Helper to obtain the server-side admin client.
 * Fails safely with a clear configuration error if the required service role key is absent.
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseServiceKey) {
    throw new Error(
      'Server Configuration Error: SUPABASE_SERVICE_ROLE_KEY is required for server-side database operations. Falling back to anonymous key is forbidden.'
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Administrative server-side client with Service Role Key (bypasses RLS).
 * STRICTLY SERVER-SIDE ONLY.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-service-key-unconfigured',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
