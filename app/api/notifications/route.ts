import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { hasFullAdminAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const db = getDB();

  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return NextResponse.json({ notifications: [] });
  }

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
    const empNotifs = db.notifications.filter(
      (n) => n.recipientUserId === user.id || (n.targetRole === 'employee' && !n.recipientUserId)
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
    const { action, notifId, markAllRead, userId } = body;
    const db = getDB();

    if (markAllRead && userId) {
      const user = db.users.find((u) => u.id === userId);
      db.notifications.forEach((n) => {
        if (
          hasFullAdminAccess(user) &&
          (n.targetRole === 'all_admin' || n.recipientUserId === userId)
        ) {
          n.read = true;
        } else if (n.recipientUserId === userId || n.recipientClientId === user?.clientId) {
          n.read = true;
        }
      });
      saveDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_read' && notifId) {
      const notif = db.notifications.find((n) => n.id === notifId);
      if (notif) {
        notif.read = true;
        saveDB(db);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid notification action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Notification failed' }, { status: 500 });
  }
}
