import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      status: 'not_configured',
      configured: false,
      connected: false,
      message: 'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and keys) are not yet configured in .env.local.',
    });
  }

  try {
    const { data, error } = await supabaseAdmin.from('users').select('id').limit(1);

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        // PostgreSQL error 42P01 / PostgREST PGRST205 = table does not exist
        return NextResponse.json({
          status: 'schema_pending',
          configured: true,
          connected: true,
          message: 'Connected to Supabase project, but database tables are not yet created. Please run supabase/schema.sql in the Supabase SQL Editor.',
          error: error.message,
        });
      }

      return NextResponse.json({
        status: 'connection_error',
        configured: true,
        connected: false,
        message: `Connected attempted, but Supabase returned an error: ${error.message}`,
        error,
      });
    }

    return NextResponse.json({
      status: 'connected',
      configured: true,
      connected: true,
      message: 'Successfully connected to Supabase PostgreSQL database!',
      sampleCount: data?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      configured: true,
      connected: false,
      message: `Failed to connect to Supabase: ${err.message}`,
    });
  }
}
