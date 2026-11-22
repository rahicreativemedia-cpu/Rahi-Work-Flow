import { NextResponse } from 'next/server';
import { resetDB } from '@/lib/db';

export async function POST() {
  try {
    const data = resetDB();
    return NextResponse.json({ success: true, message: 'Database reset to seed data', data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset' }, { status: 500 });
  }
}
