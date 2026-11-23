import {
  getDeliverables,
  getDeliverableById,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
  getClientById,
  getProjectById,
  getEmployees,
  getEmployeeById,
  createNotification,
  createAuditLog,
  createClientApproval,
  getProjects,
  getTasks,
} from '@/lib/db';
import {
  Deliverable,
  CreativeWorkflowStage,
  DeliverableVersion,
  NotificationItem,
  ClientApprovalRecord,
} from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';
import { privateJsonResponse, privateErrorResponse } from '@/lib/api-response';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const explicitUserId = searchParams.get('userId');
    const clientId = searchParams.get('clientId');
    const auth = await getAuthenticatedUser(request, explicitUserId);

    // 1. Strict Authentication Enforcement
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required to access deliverables',
        auth.status || 401
      );
    }

    const user = auth.user;
    const allDeliverables = await getDeliverables();

    // 2. Client Role Isolation
    if (user.role === 'client') {
      const clientDeliverables = allDeliverables.filter(
        (d) => d.clientId === user.clientId
      );
      return privateJsonResponse({
        success: true,
        deliverables: clientDeliverables,
      });
    }

    // 3. Admin & Manager Parity
    if (hasFullAdminAccess(user)) {
      if (clientId) {
        const clientDeliverables = allDeliverables.filter((d) => d.clientId === clientId);
        return privateJsonResponse({
          success: true,
          deliverables: clientDeliverables,
        });
      }
      return privateJsonResponse({
        success: true,
        deliverables: allDeliverables,
      });
    }

    // 4. Employee Boundary Enforcement
    if (user.role === 'employee') {
      const empId = user.employeeId || user.id;
      const [allProjects, allTasks] = await Promise.all([getProjects(), getTasks()]);
      const assignedClientIds = new Set<string>();

      allProjects.forEach((p) => {
        if (
          p.assignedEmployees?.includes(user.id) ||
          (empId && p.assignedEmployees?.includes(empId))
        ) {
          assignedClientIds.add(p.clientId);
        }
      });
      allTasks.forEach((t) => {
        if (t.assignedEmployeeId === empId || t.assignedEmployeeId === user.id) {
          assignedClientIds.add(t.clientId);
        }
      });
      allDeliverables.forEach((d) => {
        if (d.assignedEmployeeId === empId || d.assignedEmployeeId === user.id) {
          assignedClientIds.add(d.clientId);
        }
      });

      const safeDeliverables = allDeliverables.filter(
        (d) =>
          d.assignedEmployeeId === empId ||
          d.assignedEmployeeId === user.id ||
          assignedClientIds.has(d.clientId)
      );
      return privateJsonResponse({
        success: true,
        deliverables: safeDeliverables,
      });
    }

    return privateErrorResponse('Forbidden: Insufficient privileges', 403);
  } catch (error: any) {
    return privateErrorResponse('Failed to retrieve deliverables', 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, callerUserId } = body;
    const auth = await getAuthenticatedUser(request, callerUserId);

    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required',
        auth.status || 401
      );
    }

    const caller = auth.user;

    // -------------------------------------------------------------
    // ACTION 1: CREATE DELIVERABLE (Admin & Manager Equal Parity)
    // -------------------------------------------------------------
    if (!action || action === 'create') {
      if (!hasFullAdminAccess(caller)) {
        return privateErrorResponse(
          'Forbidden: Admin or Manager permission required',
          403
        );
      }

      const {
        title,
        clientId,
        projectId,
        type,
        targetMonth,
        assignedEmployeeId,
        deadline,
        scriptText,
        mediaUrl,
        thumbnailUrl,
      } = body;

      if (!title || !clientId) {
        return privateErrorResponse('Title and Client are required', 400);
      }

      const client = await getClientById(clientId);
      let project = null;
      if (projectId) {
        project = await getProjectById(projectId);
      }
      let employee = null;
      if (assignedEmployeeId) {
        employee = await getEmployeeById(assignedEmployeeId);
      }

      const newDel: Deliverable = {
        id: `del-${Date.now()}`,
        clientId,
        clientName: client ? client.name : 'Unknown Client',
        projectId: project ? project.id : (projectId && projectId !== 'proj-gen' && projectId.trim() !== '' ? projectId : undefined),
        projectTitle: project ? project.title : 'General Deliverables',
        title: title.trim(),
        type: type || 'reel',
        targetMonth: targetMonth || new Date().toISOString().substring(0, 7),
        stage: 'content_planning',
        currentVersion: 1,
        scriptText: scriptText || '',
        scriptApproved: false,
        videoApproved: false,
        mediaUrl,
        thumbnailUrl:
          thumbnailUrl ||
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
        assignedEmployeeId: employee ? employee.id : (assignedEmployeeId && assignedEmployeeId.trim() !== '' ? assignedEmployeeId : undefined),
        assignedEmployeeName: employee ? employee.name : (assignedEmployeeId ? 'Assigned' : 'Unassigned'),
        deadline:
          deadline ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'in_progress',
        isCountedTowardsCommitment: false,
        versions: [
          {
            version: 1,
            scriptText: scriptText || '',
            mediaUrl,
            thumbnailUrl,
            submittedAt: new Date().toISOString(),
            submittedByUserId: caller.id,
            submittedByUserName: caller.name,
            notes: 'Initial creative draft v1',
          },
        ],
        createdAt: new Date().toISOString(),
      };

      await createDeliverable(newDel);

      await createAuditLog({
        id: `aud-${Date.now()}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Deliverable Created',
        details: `Created deliverable "${newDel.title}" for ${newDel.clientName}`,
        targetType: 'deliverable',
        targetId: newDel.id,
        timestamp: new Date().toISOString(),
      });

      return privateJsonResponse({ success: true, deliverable: newDel }, { status: 201 });
    }

    // -------------------------------------------------------------
    // ACTION 2: ADVANCE / UPDATE STAGE (Admin & Manager Equal Parity)
    // -------------------------------------------------------------
    if (action === 'update_stage' || action === 'advance_stage') {
      if (!hasFullAdminAccess(caller)) {
        return privateErrorResponse(
          'Forbidden: Admin or Manager permission required',
          403
        );
      }

      const { deliverableId, stage, status, scriptText, mediaUrl, scheduledPublishDate } =
        body;
      const del = await getDeliverableById(deliverableId);
      if (!del) {
        return privateErrorResponse('Deliverable not found', 404);
      }

      const previousStage = del.stage;
      const updates: Partial<Deliverable> = {
        stage: stage as CreativeWorkflowStage,
      };
      if (status) updates.status = status;
      if (scriptText !== undefined) updates.scriptText = scriptText;
      if (mediaUrl !== undefined) updates.mediaUrl = mediaUrl;
      if (scheduledPublishDate !== undefined)
        updates.scheduledPublishDate = scheduledPublishDate;

      // When moving to client approval stages, trigger client notification
      if (stage === 'client_script_approval' || stage === 'client_video_approval') {
        updates.status = 'client_review';
        await createNotification({
          id: `notif-${Date.now()}`,
          targetRole: 'client',
          recipientClientId: del.clientId,
          title: `New ${stage === 'client_script_approval' ? 'Script' : 'Video'} Ready for Approval`,
          message: `"${del.title}" is ready for your review in the Client Portal.`,
          type: 'client_approval',
          relatedId: del.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      // CRITICAL DELIVERY RULE:
      if (stage === 'publishing_or_delivery') {
        if (!updates.status || updates.status === 'in_progress') {
          updates.status = 'delivered';
        }
        if (updates.status === 'published' || updates.status === 'delivered') {
          updates.isCountedTowardsCommitment = true;
          updates.publishedAt = del.publishedAt || new Date().toISOString();

          const client = await getClientById(del.clientId);
          if (client) {
            const allDel = await getDeliverables();
            const completedCount = allDel.filter(
              (d) =>
                d.clientId === client.id &&
                d.stage === 'publishing_or_delivery' &&
                (d.status === 'published' || d.status === 'delivered') &&
                d.targetMonth === del.targetMonth
            ).length;

            const totalTarget =
              (client.monthlyCommitment?.reels || 0) +
              (client.monthlyCommitment?.marketingReels || 0) +
              (client.monthlyCommitment?.posts ?? client.monthlyCommitment?.graphics ?? 0) +
              (client.monthlyCommitment?.carousels || 0) +
              (client.monthlyCommitment?.showreels || 0) +
              (client.monthlyCommitment?.longVideos || 0);

            await createNotification({
              id: `notif-${Date.now()}`,
              targetRole: 'all_admin',
              title: 'Deliverable Published & Counted',
              message: `"${del.title}" published. ${client.name} has now completed ${completedCount}/${totalTarget} deliverables.`,
              type: 'published',
              relatedId: del.id,
              read: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      } else {
        updates.isCountedTowardsCommitment = false;
      }

      const updated = await updateDeliverable(deliverableId, updates);

      await createAuditLog({
        id: `aud-${Date.now()}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Workflow Stage Advanced',
        details: `Moved "${del.title}" from "${previousStage}" to "${stage}" (Status: ${updated?.status})`,
        targetType: 'deliverable',
        targetId: del.id,
        timestamp: new Date().toISOString(),
      });

      return privateJsonResponse({ success: true, deliverable: updated });
    }

    // -------------------------------------------------------------
    // ACTION 3: UPLOAD NEW VERSION (Admin, Manager, or Assigned Employee)
    // -------------------------------------------------------------
    if (action === 'upload_version') {
      const { deliverableId, mediaUrl, scriptText, notes, thumbnailUrl } = body;
      const del = await getDeliverableById(deliverableId);
      if (!del) {
        return privateErrorResponse('Deliverable not found', 404);
      }

      const isAssigned =
        del.assignedEmployeeId === caller.id ||
        del.assignedEmployeeId === caller.employeeId;

      if (!isAssigned && !hasFullAdminAccess(caller)) {
        return privateErrorResponse(
          'Forbidden: You can only upload versions for deliverables assigned to you',
          403
        );
      }

      const nextVersion = (del.currentVersion || del.versions?.length || 0) + 1;
      const newVersionRecord: DeliverableVersion = {
        version: nextVersion,
        mediaUrl: mediaUrl || del.mediaUrl,
        scriptText: scriptText || del.scriptText,
        thumbnailUrl: thumbnailUrl || del.thumbnailUrl,
        submittedAt: new Date().toISOString(),
        submittedByUserId: caller.id,
        submittedByUserName: caller.name,
        notes: notes || `Uploaded version ${nextVersion}`,
      };

      const versions = [...(del.versions || []), newVersionRecord];
      const updates: Partial<Deliverable> = {
        currentVersion: nextVersion,
        versions,
      };
      if (mediaUrl) updates.mediaUrl = mediaUrl;
      if (scriptText) updates.scriptText = scriptText;
      if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

      // If currently in revisions stage, advance automatically to internal review
      if (del.stage === 'revisions') {
        if (mediaUrl) {
          updates.stage = 'internal_video_review';
          updates.status = 'internal_review';
        } else if (scriptText) {
          updates.stage = 'internal_script_review';
          updates.status = 'internal_review';
        }
      }

      const updated = await updateDeliverable(deliverableId, updates);

      // Notify Admin and Manager
      await createNotification({
        id: `notif-${Date.now()}`,
        targetRole: 'all_admin',
        title: `Version ${nextVersion} Uploaded for "${del.title}"`,
        message: `${caller.name} submitted Version ${nextVersion} for ${del.clientName}. Ready for quality check.`,
        type: 'submission',
        relatedId: del.id,
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Audit Log
      await createAuditLog({
        id: `aud-${Date.now()}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Deliverable Version Uploaded',
        details: `Uploaded version ${nextVersion} for deliverable "${del.title}"`,
        targetType: 'deliverable',
        targetId: del.id,
        timestamp: new Date().toISOString(),
      });

      return privateJsonResponse({
        success: true,
        deliverable: updated,
        version: newVersionRecord,
      });
    }

    // -------------------------------------------------------------
    // ACTION 4: UPDATE SCRIPT DRAFT
    // -------------------------------------------------------------
    if (action === 'update_script') {
      const { deliverableId, scriptText } = body;
      const del = await getDeliverableById(deliverableId);
      if (!del) {
        return privateErrorResponse('Deliverable not found', 404);
      }

      const isAssigned =
        del.assignedEmployeeId === caller.id ||
        del.assignedEmployeeId === caller.employeeId;

      if (!isAssigned && !hasFullAdminAccess(caller)) {
        return privateErrorResponse(
          'Forbidden: You can only edit scripts for your assigned deliverables',
          403
        );
      }

      const updated = await updateDeliverable(deliverableId, {
        scriptText: scriptText || '',
      });
      return privateJsonResponse({ success: true, deliverable: updated });
    }

    // -------------------------------------------------------------
    // ACTION 5: UPDATE MEDIA ASSET
    // -------------------------------------------------------------
    if (action === 'update_media') {
      const { deliverableId, mediaUrl, thumbnailUrl } = body;
      const del = await getDeliverableById(deliverableId);
      if (!del) {
        return privateErrorResponse('Deliverable not found', 404);
      }

      const isAssigned =
        del.assignedEmployeeId === caller.id ||
        del.assignedEmployeeId === caller.employeeId;

      if (!isAssigned && !hasFullAdminAccess(caller)) {
        return privateErrorResponse(
          'Forbidden: You can only update media for your assigned deliverables',
          403
        );
      }

      const updates: Partial<Deliverable> = {};
      if (mediaUrl) updates.mediaUrl = mediaUrl;
      if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

      const updated = await updateDeliverable(deliverableId, updates);
      return privateJsonResponse({ success: true, deliverable: updated });
    }

    // -------------------------------------------------------------
    // ACTION 6: CLIENT APPROVAL / REVISION DECISION
    // -------------------------------------------------------------
    if (action === 'client_approval') {
      const { deliverableId, type, decision, feedback } = body;
      const del = await getDeliverableById(deliverableId);
      if (!del) {
        return privateErrorResponse('Deliverable not found', 404);
      }

      if (caller.role === 'client' && del.clientId !== caller.clientId) {
        return privateErrorResponse(
          'Forbidden: Cross-client approval decisions are blocked',
          403
        );
      }

      if (caller.role === 'employee') {
        return privateErrorResponse(
          'Forbidden: Employees cannot submit client approval decisions',
          403
        );
      }

      const isApprove = decision === 'approve';
      const isScript = type === 'script';
      const updates: Partial<Deliverable> = {};

      if (isScript) {
        if (isApprove) {
          updates.scriptApproved = true;
          updates.scriptApprovedAt = new Date().toISOString();
          updates.stage = 'video_editing';
          updates.status = 'in_progress';
        } else {
          updates.stage = 'revisions';
          updates.status = 'revision_requested';
        }
      } else {
        if (isApprove) {
          updates.videoApproved = true;
          updates.videoApprovedAt = new Date().toISOString();
          updates.stage = 'scheduling';
          updates.status = 'approved';
        } else {
          updates.stage = 'revisions';
          updates.status = 'revision_requested';
        }
      }

      const approvalRecord: ClientApprovalRecord = {
        id: `appr-${Date.now()}`,
        clientId: del.clientId,
        clientName: del.clientName,
        deliverableId: del.id,
        deliverableTitle: del.title,
        type: isScript ? 'script' : 'video',
        version: del.currentVersion,
        status: isApprove ? 'approved' : 'revision_requested',
        action: isScript
          ? isApprove
            ? 'script_approved'
            : 'script_revision'
          : isApprove
          ? 'video_approved'
          : 'video_revision',
        feedback: feedback || (isApprove ? 'Approved' : 'Revision requested'),
        decisionDate: new Date().toISOString(),
        decidedByUserId: caller.id,
        decidedByUserName: caller.name,
      };

      await createClientApproval(approvalRecord);
      const updated = await updateDeliverable(deliverableId, updates);

      // Notify Admin and Manager
      await createNotification({
        id: `notif-${Date.now()}`,
        targetRole: 'all_admin',
        title: isApprove
          ? `Client Approved ${isScript ? 'Script' : 'Video'}`
          : `Client Requested Revision on ${isScript ? 'Script' : 'Video'}`,
        message: `${del.clientName} ${isApprove ? 'approved' : 'requested revisions for'} "${del.title}".`,
        type: isApprove ? 'client_approval' : 'client_revision',
        relatedId: del.id,
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Audit Log
      await createAuditLog({
        id: `aud-${Date.now()}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: isApprove ? 'Client Approved Asset' : 'Client Revision Requested',
        details: `${caller.name} decided ${decision} for ${type} of "${del.title}". Feedback: ${approvalRecord.feedback}`,
        targetType: 'deliverable',
        targetId: del.id,
        timestamp: new Date().toISOString(),
      });

      return privateJsonResponse({
        success: true,
        deliverable: updated,
        approval: approvalRecord,
      });
    }

    // -------------------------------------------------------------
    // ACTION 7: CANCEL DELIVERABLE
    // -------------------------------------------------------------
    if (action === 'cancel') {
      if (!hasFullAdminAccess(caller)) {
        return privateErrorResponse(
          'Forbidden: Admin or Manager permission required',
          403
        );
      }

      const { deliverableId, reason } = body;
      const del = await getDeliverableById(deliverableId);
      if (!del) {
        return privateErrorResponse('Deliverable not found', 404);
      }

      const updated = await updateDeliverable(deliverableId, {
        status: 'cancelled',
        isCountedTowardsCommitment: false,
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason || 'Cancelled by agency administrator',
      });

      await createAuditLog({
        id: `aud-${Date.now()}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Deliverable Cancelled',
        details: `Cancelled deliverable "${del.title}". Reason: ${reason || 'Cancelled by administrator'}`,
        targetType: 'deliverable',
        targetId: del.id,
        timestamp: new Date().toISOString(),
      });

      return privateJsonResponse({ success: true, deliverable: updated });
    }

    return privateErrorResponse('Invalid action specified', 400);
  } catch (error: any) {
    return privateErrorResponse('Deliverable operation failed', 500, error);
  }
}
