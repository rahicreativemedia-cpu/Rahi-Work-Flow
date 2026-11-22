import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const explicitUserId = searchParams.get('userId');
  const auth = getAuthenticatedUser(request, explicitUserId);

  if (!auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized: Authentication required to access notifications' },
      { status: auth.status || 401 }
    );
  }

  const user = auth.user;
  const db = getDB();

  // Admin & Manager see all operational and admin notifications
  if (hasFullAdminAccess(user)) {
    const adminNotifs = db.notifications.filter(
      (n) => n.targetRole === 'all_admin' || n.recipientUserId === user.id
    );
    return NextResponse.json({
      notifications: adminNotifs,
      unreadCount: adminNotifs.filter((n) => !n.read).length,
    });
  }

  // Employee sees employee notifications or targeted to their user id
  if (user.role === 'employee') {
    const empId = user.employeeId || user.id;
    const empNotifs = db.notifications.filter(
      (n) => n.recipientUserId === user.id || n.recipientUserId === empId || (n.targetRole === 'employee' && !n.recipientUserId)
    );
    return NextResponse.json({
      notifications: empNotifs,
      unreadCount: empNotifs.filter((n) => !n.read).length,
    });
  }

  // Client sees notifications targeted to their client account
  if (user.role === 'client') {
    const clientNotifs = db.notifications.filter(
      (n) => n.recipientClientId === user.clientId || n.recipientUserId === user.id
    );
    return NextResponse.json({
      notifications: clientNotifs,
      unreadCount: clientNotifs.filter((n) => !n.read).length,
    });
  }

  return NextResponse.json({ notifications: [], unreadCount: 0 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, notifId, markAllRead, callerUserId } = body;
    const auth = getAuthenticatedUser(request, callerUserId);

    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: Authentication required' },
        { status: auth.status || 401 }
      );
    }

    const user = auth.user;
    const db = getDB();

    if (markAllRead) {
      db.notifications.forEach((n) => {
        if (
          hasFullAdminAccess(user) &&
          (n.targetRole === 'all_admin' || n.recipientUserId === user.id)
        ) {
          n.read = true;
        } else if (n.recipientUserId === user.id || n.recipientClientId === user.clientId) {
          n.read = true;
        }
      });
      saveDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_read' && notifId) {
      const notif = db.notifications.find((n) => n.id === notifId);
      if (notif) {
        if (
          hasFullAdminAccess(user) ||
          notif.recipientUserId === user.id ||
          notif.recipientClientId === user.clientId
        ) {
          notif.read = true;
          saveDB(db);
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid notification action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Notification failed' }, { status: 500 });
  }
}
