import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import {
  Deliverable,
  CreativeWorkflowStage,
  DeliverableVersion,
  NotificationItem,
  ClientApprovalRecord,
  AuditLog,
} from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const explicitUserId = searchParams.get('userId');
  const clientId = searchParams.get('clientId');
  const auth = getAuthenticatedUser(request, explicitUserId);

  // 1. Strict Authentication Enforcement: Unauthenticated requests are rejected with 401
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized: Authentication required to access deliverables' },
      { status: auth.status || 401 }
    );
  }

  const user = auth.user;
  const db = getDB();

  // 2. Client Role Isolation: Client can ONLY access their own organization deliverables.
  // Any query parameter attempting to request another client's deliverables is strictly ignored.
  if (user.role === 'client') {
    const clientDeliverables = db.deliverables.filter(
      (d) => d.clientId === user.clientId
    );
    return NextResponse.json({
      success: true,
      deliverables: clientDeliverables,
    });
  }

  // 3. Admin & Manager Parity: Full access to all deliverables across the company
  if (hasFullAdminAccess(user)) {
    if (clientId) {
      const clientDeliverables = db.deliverables.filter((d) => d.clientId === clientId);
      return NextResponse.json({
        success: true,
        deliverables: clientDeliverables,
      });
    }
    return NextResponse.json({
      success: true,
      deliverables: db.deliverables,
    });
  }

  // 4. Employee Boundary Enforcement:
  // Employee only accesses deliverables assigned to them or their assigned client projects.
  if (user.role === 'employee') {
    const empId = user.employeeId || user.id;
    const assignedClientIds = new Set<string>();

    db.projects.forEach((p) => {
      if (p.assignedEmployees?.includes(user.id) || (empId && p.assignedEmployees?.includes(empId))) {
        assignedClientIds.add(p.clientId);
      }
    });
    db.tasks.forEach((t) => {
      if (t.assignedEmployeeId === empId || t.assignedEmployeeId === user.id) {
        assignedClientIds.add(t.clientId);
      }
    });
    db.deliverables.forEach((d) => {
      if (d.assignedEmployeeId === empId || d.assignedEmployeeId === user.id) {
        assignedClientIds.add(d.clientId);
      }
    });

    const safeDeliverables = db.deliverables.filter(
      (d) =>
        d.assignedEmployeeId === empId ||
        d.assignedEmployeeId === user.id ||
        assignedClientIds.has(d.clientId)
    );
    return NextResponse.json({
      success: true,
      deliverables: safeDeliverables,
    });
  }

  return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, callerUserId } = body;
    const auth = getAuthenticatedUser(request, callerUserId);

    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: Authentication required' },
        { status: auth.status || 401 }
      );
    }

    const caller = auth.user;
    const db = getDB();

    // -------------------------------------------------------------
    // ACTION 1: CREATE DELIVERABLE (Admin & Manager Equal Parity)
    // -------------------------------------------------------------
    if (!action || action === 'create') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Forbidden: Admin or Manager permission required' },
          { status: 403 }
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
        return NextResponse.json(
          { error: 'Title and Client are required' },
          { status: 400 }
        );
      }

      const client = db.clients.find((c) => c.id === clientId);
      const project = db.projects.find((p) => p.id === projectId);
      const employee = db.employees.find((e) => e.id === assignedEmployeeId);

      const newDel: Deliverable = {
        id: `del-${Date.now()}`,
        clientId,
        clientName: client ? client.name : 'Unknown Client',
        projectId: projectId || (project ? project.id : 'proj-gen'),
        projectTitle: project ? project.title : 'General Campaign',
        title: title.trim(),
        type: type || 'reel',
        targetMonth: targetMonth || new Date().toISOString().substring(0, 7),
        stage: 'content_planning', // Starts at Stage 1
        currentVersion: 1,
        scriptText: scriptText || '',
        scriptApproved: false,
        videoApproved: false,
        mediaUrl,
        thumbnailUrl:
          thumbnailUrl ||
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
        assignedEmployeeId: assignedEmployeeId || '',
        assignedEmployeeName: employee ? employee.name : 'Unassigned',
        deadline:
          deadline ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'in_progress',
        isCountedTowardsCommitment: false, // Never counted until published in stage 10!
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

      db.deliverables.unshift(newDel);

      db.auditLogs.unshift({
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

      saveDB(db);
      return NextResponse.json({ success: true, deliverable: newDel });
    }

    // -------------------------------------------------------------
    // ACTION 2: ADVANCE / UPDATE STAGE (Admin & Manager Equal Parity)
    // -------------------------------------------------------------
    if (action === 'update_stage' || action === 'advance_stage') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Forbidden: Admin or Manager permission required' },
          { status: 403 }
        );
      }

      const { deliverableId, stage, status, scriptText, mediaUrl, scheduledPublishDate } = body;
      const del = db.deliverables.find((d) => d.id === deliverableId);
      if (!del) {
        return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
      }

      const previousStage = del.stage;
      del.stage = stage as CreativeWorkflowStage;
      if (status) del.status = status;
      if (scriptText !== undefined) del.scriptText = scriptText;
      if (mediaUrl !== undefined) del.mediaUrl = mediaUrl;
      if (scheduledPublishDate !== undefined) del.scheduledPublishDate = scheduledPublishDate;

      // When moving to client approval stages, trigger client notification
      if (stage === 'client_script_approval' || stage === 'client_video_approval') {
        del.status = 'client_review';
        const notif: NotificationItem = {
          id: `notif-${Date.now()}`,
          targetRole: 'client',
          recipientClientId: del.clientId,
          title: `New ${stage === 'client_script_approval' ? 'Script' : 'Video'} Ready for Approval`,
          message: `"${del.title}" is ready for your review in the Client Portal.`,
          type: 'client_approval',
          relatedId: del.id,
          read: false,
          createdAt: new Date().toISOString(),
        };
        db.notifications.unshift(notif);
      }

      // CRITICAL DELIVERY RULE:
      // A deliverable counts towards monthly commitment ONLY when reaching publishing_or_delivery AND status === 'published' | 'delivered'
      if (
        del.stage === 'publishing_or_delivery' &&
        (del.status === 'published' || del.status === 'delivered')
      ) {
        del.isCountedTowardsCommitment = true;
        del.publishedAt = del.publishedAt || new Date().toISOString();

        // Check if client monthly milestone reached
        const client = db.clients.find((c) => c.id === del.clientId);
        if (client) {
          const completedCount = db.deliverables.filter(
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

          db.notifications.unshift({
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
      } else {
        del.isCountedTowardsCommitment = false;
      }

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Workflow Stage Advanced',
        details: `Moved "${del.title}" from "${previousStage}" to "${stage}" (Status: ${del.status})`,
        targetType: 'deliverable',
        targetId: del.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, deliverable: del });
    }

    // -------------------------------------------------------------
    // ACTION 3: UPLOAD NEW VERSION (Admin, Manager, or Assigned Employee)
    // -------------------------------------------------------------
    if (action === 'upload_version') {
      const { deliverableId, mediaUrl, scriptText, notes, thumbnailUrl } = body;
      const del = db.deliverables.find((d) => d.id === deliverableId);
      if (!del) {
        return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
      }

      const isAssigned =
        del.assignedEmployeeId === caller.id ||
        del.assignedEmployeeId === caller.employeeId;

      if (!isAssigned && !hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Forbidden: You can only upload versions for deliverables assigned to you' },
          { status: 403 }
        );
      }

      const nextVersion = (del.currentVersion || del.versions.length || 0) + 1;
      del.currentVersion = nextVersion;
      if (mediaUrl) del.mediaUrl = mediaUrl;
      if (scriptText) del.scriptText = scriptText;
      if (thumbnailUrl) del.thumbnailUrl = thumbnailUrl;

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

      del.versions.push(newVersionRecord);

      // If currently in revisions stage, advance automatically to internal review
      if (del.stage === 'revisions') {
        if (mediaUrl) {
          del.stage = 'internal_video_review';
          del.status = 'internal_review';
        } else if (scriptText) {
          del.stage = 'internal_script_review';
          del.status = 'internal_review';
        }
      }

      // Notify Admin and Manager
      db.notifications.unshift({
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
      db.auditLogs.unshift({
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

      saveDB(db);
      return NextResponse.json({
        success: true,
        deliverable: del,
        version: newVersionRecord,
      });
    }

    // -------------------------------------------------------------
    // ACTION 4: UPDATE SCRIPT DRAFT (Admin, Manager, or Assigned Employee)
    // -------------------------------------------------------------
    if (action === 'update_script') {
      const { deliverableId, scriptText } = body;
      const del = db.deliverables.find((d) => d.id === deliverableId);
      if (!del) {
        return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
      }

      const isAssigned =
        del.assignedEmployeeId === caller.id ||
        del.assignedEmployeeId === caller.employeeId;

      if (!isAssigned && !hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Forbidden: You can only edit scripts for your assigned deliverables' },
          { status: 403 }
        );
      }

      del.scriptText = scriptText || '';
      saveDB(db);
      return NextResponse.json({ success: true, deliverable: del });
    }

    // -------------------------------------------------------------
    // ACTION 5: UPDATE MEDIA ASSET (Admin, Manager, or Assigned Employee)
    // -------------------------------------------------------------
    if (action === 'update_media') {
      const { deliverableId, mediaUrl, thumbnailUrl } = body;
      const del = db.deliverables.find((d) => d.id === deliverableId);
      if (!del) {
        return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
      }

      const isAssigned =
        del.assignedEmployeeId === caller.id ||
        del.assignedEmployeeId === caller.employeeId;

      if (!isAssigned && !hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update media for your assigned deliverables' },
          { status: 403 }
        );
      }

      if (mediaUrl) del.mediaUrl = mediaUrl;
      if (thumbnailUrl) del.thumbnailUrl = thumbnailUrl;
      saveDB(db);
      return NextResponse.json({ success: true, deliverable: del });
    }

    // -------------------------------------------------------------
    // ACTION 6: CLIENT APPROVAL / REVISION DECISION
    // -------------------------------------------------------------
    if (action === 'client_approval') {
      const { deliverableId, type, decision, feedback } = body;
      const del = db.deliverables.find((d) => d.id === deliverableId);
      if (!del) {
        return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
      }

      // Check tenant isolation: Client can only decide on own org deliverables
      if (caller.role === 'client' && del.clientId !== caller.clientId) {
        return NextResponse.json(
          { error: 'Forbidden: Cross-client approval decisions are blocked' },
          { status: 403 }
        );
      }

      if (caller.role === 'employee') {
        return NextResponse.json(
          { error: 'Forbidden: Employees cannot submit client approval decisions' },
          { status: 403 }
        );
      }

      const isApprove = decision === 'approve';
      const isScript = type === 'script';

      if (isScript) {
        if (isApprove) {
          del.scriptApproved = true;
          del.scriptApprovedAt = new Date().toISOString();
          del.stage = 'video_editing'; // Advance to Stage 5
          del.status = 'in_progress';
        } else {
          del.stage = 'revisions'; // Route to Stage 8
          del.status = 'revision_requested';
        }
      } else {
        // Video approval
        if (isApprove) {
          del.videoApproved = true;
          del.videoApprovedAt = new Date().toISOString();
          del.stage = 'scheduling'; // Advance to Stage 9
          del.status = 'approved';
        } else {
          del.stage = 'revisions'; // Route to Stage 8
          del.status = 'revision_requested';
        }
      }

      // Record in approvals collection
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

      db.approvals.unshift(approvalRecord);

      // Notify Admin and Manager
      db.notifications.unshift({
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
      db.auditLogs.unshift({
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

      saveDB(db);
      return NextResponse.json({
        success: true,
        deliverable: del,
        approval: approvalRecord,
      });
    }

    // -------------------------------------------------------------
    // ACTION 7: CANCEL DELIVERABLE (Admin & Manager Equal Parity)
    // -------------------------------------------------------------
    if (action === 'cancel') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Forbidden: Admin or Manager permission required' },
          { status: 403 }
        );
      }

      const { deliverableId, reason } = body;
      const del = db.deliverables.find((d) => d.id === deliverableId);
      if (!del) {
        return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
      }

      del.status = 'cancelled';
      del.isCountedTowardsCommitment = false;
      del.cancelledAt = new Date().toISOString();
      del.cancellationReason = reason || 'Cancelled by agency administrator';

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Deliverable Cancelled',
        details: `Cancelled deliverable "${del.title}". Reason: ${del.cancellationReason}`,
        targetType: 'deliverable',
        targetId: del.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, deliverable: del });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Deliverable operation failed' },
      { status: 500 }
    );
  }
}
