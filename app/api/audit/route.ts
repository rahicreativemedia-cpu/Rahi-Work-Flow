import { getAuditLogs } from '@/lib/db';
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
        auth.error || 'Unauthorized: Authentication required to access audit logs',
        auth.status || 401
      );
    }

    const user = auth.user;
    if (!hasFullAdminAccess(user)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to view audit history',
        403
      );
    }

    const auditLogs = await getAuditLogs();
    return privateJsonResponse({
      success: true,
      auditLogs,
    });
  } catch (error: any) {
    return privateErrorResponse('Failed to retrieve audit logs', 500, error);
  }
}
