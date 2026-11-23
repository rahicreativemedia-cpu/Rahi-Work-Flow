import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/db';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';
import { privateJsonResponse, privateErrorResponse } from '@/lib/api-response';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const explicitUserId = searchParams.get('userId');
    const auth = await getAuthenticatedUser(request, explicitUserId);

    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required to access notifications',
        auth.status || 401
      );
    }

    const user = auth.user;
    const allNotifications = await getNotifications();

    // Admin & Manager see all operational and admin notifications
    if (hasFullAdminAccess(user)) {
      const adminNotifs = allNotifications.filter(
        (n) => n.targetRole === 'all_admin' || n.recipientUserId === user.id
      );
      return privateJsonResponse({
        notifications: adminNotifs,
        unreadCount: adminNotifs.filter((n) => !n.read).length,
      });
    }

    // Employee sees employee notifications or targeted to their user id
    if (user.role === 'employee') {
      const empId = user.employeeId || user.id;
      const empNotifs = allNotifications.filter(
        (n) =>
          n.recipientUserId === user.id ||
          n.recipientUserId === empId ||
          (n.targetRole === 'employee' && !n.recipientUserId)
      );
      return privateJsonResponse({
        notifications: empNotifs,
        unreadCount: empNotifs.filter((n) => !n.read).length,
      });
    }

    // Client sees notifications targeted to their client account
    if (user.role === 'client') {
      const clientNotifs = allNotifications.filter(
        (n) => n.recipientClientId === user.clientId || n.recipientUserId === user.id
      );
      return privateJsonResponse({
        notifications: clientNotifs,
        unreadCount: clientNotifs.filter((n) => !n.read).length,
      });
    }

    return privateJsonResponse({ notifications: [], unreadCount: 0 });
  } catch (error: any) {
    return privateErrorResponse('Failed to retrieve notifications', 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, notifId, markAllRead, callerUserId } = body;
    const auth = await getAuthenticatedUser(request, callerUserId);

    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required',
        auth.status || 401
      );
    }

    const user = auth.user;

    if (markAllRead) {
      await markAllNotificationsAsRead(user.id);
      return privateJsonResponse({ success: true });
    }

    if (action === 'mark_read' && notifId) {
      await markNotificationAsRead(notifId);
      return privateJsonResponse({ success: true });
    }

    return privateErrorResponse('Invalid action or parameters', 400);
  } catch (error: any) {
    return privateErrorResponse('Notification action failed', 500, error);
  }
}
