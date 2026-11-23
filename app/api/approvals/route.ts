import {
  getClientApprovals,
  createClientApproval,
  getDeliverableById,
  updateDeliverable,
  getEmployees,
  getEmployeeById,
  createNotification,
  createAuditLog,
  getDeliverables,
} from '@/lib/db';
import { ClientApprovalRecord, NotificationItem, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';
import { privateJsonResponse, privateErrorResponse } from '@/lib/api-response';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const explicitUserId = searchParams.get('userId');
    const deliverableId = searchParams.get('deliverableId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const auth = await getAuthenticatedUser(request, explicitUserId);

    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required to access approvals',
        auth.status || 401
      );
    }

    const user = auth.user;
    if (user.status === 'inactive') {
      return privateErrorResponse('Forbidden: Account is inactive', 403);
    }

    let approvals = await getClientApprovals();

    // Role-based access boundaries:
    if (user.role === 'client') {
      approvals = approvals.filter((a) => a.clientId === user.clientId);
    } else if (!hasFullAdminAccess(user)) {
      const allDeliverables = await getDeliverables();
      const empId = user.employeeId || user.id;
      const assignedDeliverableIds = new Set(
        allDeliverables
          .filter((d) => d.assignedEmployeeId === empId || d.assignedEmployeeId === user.id)
          .map((d) => d.id)
      );
      approvals = approvals.filter((a) => assignedDeliverableIds.has(a.deliverableId));
    } else {
      if (clientId) {
        approvals = approvals.filter((a) => a.clientId === clientId);
      }
    }

    if (deliverableId) {
      approvals = approvals.filter((a) => a.deliverableId === deliverableId);
    }
    if (status) {
      approvals = approvals.filter((a) => a.status === status);
    }
    if (type) {
      approvals = approvals.filter((a) => a.type === type);
    }

    return privateJsonResponse({ approvals });
  } catch (error: any) {
    return privateErrorResponse('Failed to retrieve approvals', 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      callerUserId,
      deliverableId,
      approvalType,
      decision,
      feedback,
      categories,
    } = body;

    const auth = await getAuthenticatedUser(request, callerUserId);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required',
        auth.status || 401
      );
    }

    const caller = auth.user;
    if (caller.status === 'inactive') {
      return privateErrorResponse('Forbidden: Account is inactive', 403);
    }

    // Role verification:
    if (caller.role === 'employee') {
      return privateErrorResponse(
        'Forbidden: Employees cannot submit client approvals or revisions',
        403
      );
    }

    const deliverable = await getDeliverableById(deliverableId);
    if (!deliverable) {
      return privateErrorResponse('Deliverable not found', 404);
    }

    const isClientOwner = caller.role === 'client' && caller.clientId === deliverable.clientId;
    const isAdminOrManager = hasFullAdminAccess(caller);

    if (!isClientOwner && !isAdminOrManager) {
      return privateErrorResponse(
        'Forbidden: Cross-client approval actions are strictly blocked',
        403
      );
    }

    // Validate inputs
    if (!['script', 'video', 'design'].includes(approvalType)) {
      return privateErrorResponse(
        'Invalid approval type. Must be script, video, or design',
        400
      );
    }

    if (!['approve', 'revision'].includes(decision)) {
      return privateErrorResponse(
        'Invalid decision. Must be approve or revision',
        400
      );
    }

    const isApproved = decision === 'approve';
    const trimmedFeedback = (feedback || '').trim();

    if (!isApproved && !trimmedFeedback) {
      return privateErrorResponse(
        'Feedback explanation is mandatory when requesting revisions',
        400
      );
    }

    const currentVersion = deliverable.currentVersion || 1;
    const finalCategories: string[] = Array.isArray(categories)
      ? categories.filter((c: any) => typeof c === 'string' && c.trim().length > 0)
      : [];

    const approvalRecord: ClientApprovalRecord = {
      id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clientId: deliverable.clientId,
      clientName: deliverable.clientName,
      deliverableId: deliverable.id,
      deliverableTitle: deliverable.title,
      type: approvalType,
      version: currentVersion,
      status: isApproved ? 'approved' : 'revision_requested',
      action:
        approvalType === 'script'
          ? isApproved
            ? 'script_approved'
            : 'script_revision'
          : isApproved
          ? 'video_approved'
          : 'video_revision',
      feedback:
        trimmedFeedback ||
        (isApproved ? 'Approved by client without changes.' : 'Revision requested.'),
      categories: finalCategories,
      decisionDate: new Date().toISOString(),
      decidedByUserId: caller.id,
      decidedByUserName: caller.name,
      recordedByAdminOrManager: isAdminOrManager && caller.role !== 'client',
    };

    await createClientApproval(approvalRecord);

    const deliverableUpdates: Partial<typeof deliverable> = {};

    // Update deliverable state based on approval type
    if (approvalType === 'script') {
      if (isApproved) {
        deliverableUpdates.scriptApproved = true;
        deliverableUpdates.scriptApprovedAt = new Date().toISOString();
        deliverableUpdates.stage = 'video_editing';
        deliverableUpdates.status = 'in_progress';
      } else {
        deliverableUpdates.stage = 'revisions';
        deliverableUpdates.status = 'revision_requested';
      }
    } else if (approvalType === 'video') {
      if (isApproved) {
        deliverableUpdates.videoApproved = true;
        deliverableUpdates.videoApprovedAt = new Date().toISOString();
        deliverableUpdates.stage = 'scheduling';
        deliverableUpdates.status = 'approved';
      } else {
        deliverableUpdates.stage = 'revisions';
        deliverableUpdates.status = 'revision_requested';
      }
    }

    // Attach feedback to current version in deliverable history if revisions requested
    if (!isApproved && deliverable.versions && deliverable.versions.length > 0) {
      const versions = [...deliverable.versions];
      const latestVer = { ...versions[versions.length - 1] };
      latestVer.feedback = approvalRecord.feedback;
      versions[versions.length - 1] = latestVer;
      deliverableUpdates.versions = versions;
    }

    const updatedDeliverable = await updateDeliverable(deliverable.id, deliverableUpdates);

    // CRITICAL: Notify BOTH Admin and Manager (all_admin) when a client responds
    const notifAction = isApproved ? 'Approved' : 'Revision Requested';
    const tagSuffix =
      finalCategories.length > 0 ? ` [Tags: ${finalCategories.join(', ')}]` : '';

    await createNotification({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      targetRole: 'all_admin',
      title: `Client ${notifAction}: ${deliverable.title}`,
      message: `${caller.name} (${deliverable.clientName}) ${notifAction.toLowerCase()} ${approvalType} (v${currentVersion}). Feedback: "${approvalRecord.feedback}"${tagSuffix}`,
      type: isApproved ? 'client_approval' : 'client_revision',
      relatedId: deliverable.id,
      read: false,
      createdAt: new Date().toISOString(),
    });

    // If revision was requested, also notify assigned employee
    if (!isApproved && deliverable.assignedEmployeeId) {
      const emp = await getEmployeeById(deliverable.assignedEmployeeId);
      if (emp) {
        await createNotification({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-emp`,
          targetRole: 'employee',
          recipientUserId: emp.userId,
          title: `Revision Requested on ${deliverable.title}`,
          message: `Client requested changes on ${approvalType} v${currentVersion}: "${approvalRecord.feedback}"${tagSuffix}`,
          type: 'client_revision',
          relatedId: deliverable.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Immutable System Audit Log
    const adminOversightNote = approvalRecord.recordedByAdminOrManager
      ? ' (Admin/Manager Oversight)'
      : '';
    await createAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: `Client ${notifAction}`,
      details: `${caller.name}${adminOversightNote} ${notifAction.toLowerCase()} ${approvalType} v${currentVersion} for "${deliverable.title}". Categories: ${finalCategories.length > 0 ? finalCategories.join(', ') : 'None'}. Feedback: "${approvalRecord.feedback}"`,
      targetType: 'approval',
      targetId: approvalRecord.id,
      timestamp: new Date().toISOString(),
    });

    return privateJsonResponse({
      success: true,
      approval: approvalRecord,
      deliverable: updatedDeliverable,
    });
  } catch (error: any) {
    return privateErrorResponse('Approval action failed', 500, error);
  }
}
