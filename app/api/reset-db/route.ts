import { privateJsonResponse } from '@/lib/api-response';


export async function POST() {
  // CRITICAL PRODUCTION DEFENSE:
  // Direct database reset over HTTP is strictly disabled.
  return privateJsonResponse(
    {
      error:
        'Forbidden: Production database reset via HTTP is permanently disabled. Manage schemas and migrations via Supabase SQL Editor and migration scripts.',
    },
    { status: 403 }
  );
}
