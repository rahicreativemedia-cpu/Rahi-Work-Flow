import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { ClientApprovalRecord, NotificationItem, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const explicitUserId = searchParams.get('userId');
  const deliverableId = searchParams.get('deliverableId');
  const clientId = searchParams.get('clientId');
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  const auth = getAuthenticatedUser(request, explicitUserId);

  if (!auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized: Authentication required to access approvals' },
      { status: auth.status || 401 }
    );
  }

  const user = auth.user;
  if (user.status === 'inactive') {
    return NextResponse.json(
      { error: 'Forbidden: Account is inactive' },
      { status: 403 }
    );
  }

  const db = getDB();
  let approvals = [...db.approvals];

  // Role-based access boundaries:
  if (user.role === 'client') {
    // Strictly isolate client to their own organization's records
    approvals = approvals.filter((a) => a.clientId === user.clientId);
  } else if (!hasFullAdminAccess(user)) {
    // Employees can only view approvals for their assigned deliverables
    const empId = user.employeeId || user.id;
    const assignedDeliverableIds = new Set(
      db.deliverables
        .filter((d) => d.assignedEmployeeId === empId || d.assignedEmployeeId === user.id)
        .map((d) => d.id)
    );
    approvals = approvals.filter((a) => assignedDeliverableIds.has(a.deliverableId));
  } else {
    // Admin and Manager have identical company-wide access
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

  return NextResponse.json({ approvals });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      callerUserId,
      deliverableId,
      approvalType, // 'script' | 'video' | 'design'
      decision, // 'approve' | 'revision'
      feedback,
      categories, // optional string[] e.g. ["Hook / Angle", "Brand Tone / Voice"]
    } = body;

    const auth = getAuthenticatedUser(request, callerUserId);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: Authentication required' },
        { status: auth.status || 401 }
      );
    }

    const caller = auth.user;
    if (caller.status === 'inactive') {
      return NextResponse.json(
        { error: 'Forbidden: Account is inactive' },
        { status: 403 }
      );
    }

    // Role verification:
    // 1. Employees cannot submit client approvals or revisions
    if (caller.role === 'employee') {
      return NextResponse.json(
        { error: 'Forbidden: Employees cannot submit client approvals or revisions' },
        { status: 403 }
      );
    }

    const db = getDB();
    const deliverable = db.deliverables.find((d) => d.id === deliverableId);
    if (!deliverable) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    // 2. Client role can only approve/revise their own organization's deliverables
    const isClientOwner = caller.role === 'client' && caller.clientId === deliverable.clientId;
    const isAdminOrManager = hasFullAdminAccess(caller);

    if (!isClientOwner && !isAdminOrManager) {
      return NextResponse.json(
        { error: 'Forbidden: Cross-client approval actions are strictly blocked' },
        { status: 403 }
      );
    }

    // Validate inputs
    if (!['script', 'video', 'design'].includes(approvalType)) {
      return NextResponse.json(
        { error: 'Invalid approval type. Must be script, video, or design' },
        { status: 400 }
      );
    }

    if (!['approve', 'revision'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be approve or revision' },
        { status: 400 }
      );
    }

    // Mandatory feedback requirement for revision requests
    const isApproved = decision === 'approve';
    const trimmedFeedback = (feedback || '').trim();

    if (!isApproved && !trimmedFeedback) {
      return NextResponse.json(
        { error: 'Feedback explanation is mandatory when requesting revisions' },
        { status: 400 }
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
      feedback: trimmedFeedback || (isApproved ? 'Approved by client without changes.' : 'Revision requested.'),
      categories: finalCategories,
      decisionDate: new Date().toISOString(),
      decidedByUserId: caller.id,
      decidedByUserName: caller.name,
      recordedByAdminOrManager: isAdminOrManager && caller.role !== 'client',
    };

    db.approvals.unshift(approvalRecord);

    // Update deliverable state based on approval type
    if (approvalType === 'script') {
      if (isApproved) {
        deliverable.scriptApproved = true;
        deliverable.scriptApprovedAt = new Date().toISOString();
        // Advance to video editing (Stage 5)
        deliverable.stage = 'video_editing';
        deliverable.status = 'in_progress';
      } else {
        // Route to revisions (Stage 8)
        deliverable.stage = 'revisions';
        deliverable.status = 'revision_requested';
      }
    } else if (approvalType === 'video') {
      if (isApproved) {
        deliverable.videoApproved = true;
        deliverable.videoApprovedAt = new Date().toISOString();
        // Advance to scheduling (Stage 9)
        deliverable.stage = 'scheduling';
        deliverable.status = 'approved';
      } else {
        // Route to revisions (Stage 8)
        deliverable.stage = 'revisions';
        deliverable.status = 'revision_requested';
      }
    }

    // Attach feedback to current version in deliverable history if revisions requested
    if (!isApproved && deliverable.versions && deliverable.versions.length > 0) {
      const latestVer = deliverable.versions[deliverable.versions.length - 1];
      if (latestVer) {
        latestVer.feedback = approvalRecord.feedback;
      }
    }

    // CRITICAL REQUIREMENT: Notify BOTH Admin and Manager (all_admin) when a client responds
    const notifAction = isApproved ? 'Approved' : 'Revision Requested';
    const tagSuffix = finalCategories.length > 0 ? ` [Tags: ${finalCategories.join(', ')}]` : '';

    const notif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      targetRole: 'all_admin',
      title: `Client ${notifAction}: ${deliverable.title}`,
      message: `${caller.name} (${deliverable.clientName}) ${notifAction.toLowerCase()} ${approvalType} (v${currentVersion}). Feedback: "${approvalRecord.feedback}"${tagSuffix}`,
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
    const adminOversightNote = approvalRecord.recordedByAdminOrManager ? ' (Admin/Manager Oversight)' : '';
    db.auditLogs.unshift({
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
