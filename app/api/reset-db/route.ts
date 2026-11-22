import { NextResponse } from 'next/server';
import { resetDB } from '@/lib/db';

export async function POST() {
  // CRITICAL PRODUCTION DEFENSE:
  // Database reset is strictly prohibited in production environments to prevent catastrophic data loss.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DATABASE_RESET !== 'true') {
    return NextResponse.json(
      { error: 'Forbidden: Database reset is disabled in production environments' },
      { status: 403 }
    );
  }

  try {
    const data = resetDB();
    return NextResponse.json({ success: true, message: 'Database reset to seed data', data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset' }, { status: 500 });
  }
}
