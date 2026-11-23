import { isSupabaseServerConfigured, supabaseAdmin } from '@/lib/supabase';
import { privateJsonResponse } from '@/lib/api-response';


export async function GET() {
  if (!isSupabaseServerConfigured()) {
    return privateJsonResponse({
      status: 'not_configured',
      configured: false,
      connected: false,
      message:
        'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are not configured.',
    });
  }

  try {
    const { data, error } = await supabaseAdmin.from('users').select('id').limit(1);

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('schema cache')
      ) {
        return privateJsonResponse({
          status: 'schema_pending',
          configured: true,
          connected: true,
          message:
            'Connected to Supabase project, but database tables are not yet created. Please run supabase/schema.sql in the Supabase SQL Editor.',
          error: error.message,
        });
      }

      return privateJsonResponse({
        status: 'connection_error',
        configured: true,
        connected: false,
        message: `Connection attempted, but Supabase returned an error: ${error.message}`,
        error: error.message,
      });
    }

    return privateJsonResponse({
      status: 'connected',
      configured: true,
      connected: true,
      message: 'Successfully connected to Supabase PostgreSQL database!',
      sampleCount: data?.length || 0,
    });
  } catch (err: any) {
    return privateJsonResponse({
      status: 'error',
      configured: true,
      connected: false,
      message: `Failed to connect to Supabase: ${err.message}`,
    });
  }
}
