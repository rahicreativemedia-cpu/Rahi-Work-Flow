import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { hasFullAdminAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const db = getDB();

  const user = db.users.find((u) => u.id === userId);
  if (!hasFullAdminAccess(user)) {
    return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
  }

  return NextResponse.json({ auditLogs: db.auditLogs });
}
