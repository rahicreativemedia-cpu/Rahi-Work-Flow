import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const explicitUserId = searchParams.get('userId');
  const auth = getAuthenticatedUser(request, explicitUserId);

  if (!auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized: Authentication required to access audit logs' },
      { status: auth.status || 401 }
    );
  }

  const user = auth.user;
  if (!hasFullAdminAccess(user)) {
    return NextResponse.json(
      { error: 'Forbidden: Admin or Manager permission required to view audit history' },
      { status: 403 }
    );
  }

  const db = getDB();
  return NextResponse.json({
    success: true,
    auditLogs: db.auditLogs || [],
  });
}
