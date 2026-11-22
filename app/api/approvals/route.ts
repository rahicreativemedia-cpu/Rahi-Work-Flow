import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { ClientApprovalRecord, NotificationItem, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const deliverableId = searchParams.get('deliverableId');
  const db = getDB();

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to access approvals' },
      { status: 401 }
    );
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user || user.status === 'inactive') {
    return NextResponse.json(
      { error: 'Unauthorized: Valid active session required' },
      { status: 401 }
    );
  }

  let approvals = db.approvals;
  // If Client, strictly isolate to their own organization approvals
  if (user.role === 'client') {
    approvals = approvals.filter((a) => a.clientId === user.clientId);
  } else if (!hasFullAdminAccess(user)) {
    // Employees only see approvals for their assigned deliverables
    const empId = user.employeeId || user.id;
    const assignedDeliverableIds = new Set(
      db.deliverables
        .filter((d) => d.assignedEmployeeId === empId || d.assignedEmployeeId === user.id)
        .map((d) => d.id)
    );
    approvals = approvals.filter((a) => assignedDeliverableIds.has(a.deliverableId));
  }

  if (deliverableId) {
    approvals = approvals.filter((a) => a.deliverableId === deliverableId);
  }

  return NextResponse.json({ approvals });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      callerUserId,
      deliverableId,
      approvalType, // 'script' | 'video'
      decision, // 'approve' | 'revision'
      feedback,
    } = body;

    if (!callerUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const db = getDB();
    const caller = db.users.find((u) => u.id === callerUserId);
    if (!caller || caller.status === 'inactive') {
      return NextResponse.json(
        { error: 'Unauthorized: Valid active session required' },
        { status: 401 }
      );
    }

    const deliverable = db.deliverables.find((d) => d.id === deliverableId);
    if (!deliverable) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    // Verify permission: Must be client owning the deliverable, or Admin/Manager acting
    const isClientOwner = caller.role === 'client' && caller.clientId === deliverable.clientId;
    if (!isClientOwner && !hasFullAdminAccess(caller)) {
      return NextResponse.json(
        { error: 'Forbidden: Cross-client approval actions are strictly blocked' },
        { status: 403 }
      );
    }

    const currentVersion = deliverable.currentVersion || 1;
    const isApproved = decision === 'approve';

    const approvalRecord: ClientApprovalRecord = {
      id: `appr-${Date.now()}`,
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
      feedback: feedback || (isApproved ? 'Approved by client without changes.' : 'Revision requested.'),
      decisionDate: new Date().toISOString(),
      decidedByUserId: caller?.id || 'usr-client',
      decidedByUserName: caller?.name || 'Client Representative',
    };

    db.approvals.unshift(approvalRecord);

    // Update deliverable state based on approval type
    if (approvalType === 'script') {
      if (isApproved) {
        deliverable.scriptApproved = true;
        deliverable.scriptApprovedAt = new Date().toISOString();
        // Advance to video editing
        deliverable.stage = 'video_editing';
        deliverable.status = 'in_progress';
      } else {
        deliverable.stage = 'revisions';
        deliverable.status = 'revision_requested';
      }
    } else if (approvalType === 'video') {
      if (isApproved) {
        deliverable.videoApproved = true;
        deliverable.videoApprovedAt = new Date().toISOString();
        // Advance to scheduling
        deliverable.stage = 'scheduling';
        deliverable.status = 'approved';
      } else {
        deliverable.stage = 'revisions';
        deliverable.status = 'revision_requested';
      }
    }

    // CRITICAL REQUIREMENT: Notify BOTH Admin and Manager when a client responds
    const notifAction = isApproved ? 'Approved' : 'Revision Requested';
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      targetRole: 'all_admin',
      title: `Client ${notifAction}: ${deliverable.title}`,
      message: `${caller?.name} (${deliverable.clientName}) ${notifAction.toLowerCase()} ${approvalType} (v${currentVersion}). Feedback: "${approvalRecord.feedback}"`,
      type: isApproved ? 'client_approval' : 'client_revision',
      relatedId: deliverable.id,
      read: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.unshift(notif);

    // If revision was requested, also notify assigned employee
    if (!isApproved && deliverable.assignedEmployeeId) {
      const emp = db.employees.find((e) => e.id === deliverable.assignedEmployeeId);
      if (emp) {
        db.notifications.unshift({
          id: `notif-${Date.now()}-emp`,
          targetRole: 'employee',
          recipientUserId: emp.userId,
          title: `Revision Requested on ${deliverable.title}`,
          message: `Client requested changes on ${approvalType} v${currentVersion}: "${approvalRecord.feedback}"`,
          type: 'client_revision',
          relatedId: deliverable.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // System Audit Log
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: caller?.id || 'usr-client',
      userName: caller?.name || 'Client',
      userRole: caller?.role || 'client',
      action: `Client ${notifAction}`,
      details: `${caller?.name} ${notifAction.toLowerCase()} ${approvalType} v${currentVersion} for "${deliverable.title}"`,
      targetType: 'approval',
      targetId: approvalRecord.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({
      success: true,
      approval: approvalRecord,
      deliverable,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Approval action failed' }, { status: 500 });
  }
}
