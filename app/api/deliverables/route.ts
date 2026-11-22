import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import {
  Deliverable,
  CreativeWorkflowStage,
  NotificationItem,
  AuditLog,
} from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const clientId = searchParams.get('clientId');
  const db = getDB();

  // 1. Strict Authentication Enforcement: Unauthenticated requests are rejected with 401
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to access deliverables' },
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

  // 2. Client Role Isolation: Client can ONLY access their own organization deliverables.
  // Any query parameter attempting to request another client's deliverables is strictly ignored.
  if (user.role === 'client') {
    const clientDeliverables = db.deliverables.filter(
      (d) => d.clientId === user.clientId
    );
    return NextResponse.json({ deliverables: clientDeliverables });
  }

  // 3. Admin & Manager Parity: Full access to all deliverables across the company
  if (hasFullAdminAccess(user)) {
    if (clientId) {
      const clientDeliverables = db.deliverables.filter((d) => d.clientId === clientId);
      return NextResponse.json({ deliverables: clientDeliverables });
    }
    return NextResponse.json({ deliverables: db.deliverables });
  }

  // 4. Employee Boundary Enforcement:
  // Employee only accesses deliverables assigned to them or their assigned client projects.
  if (user.role === 'employee') {
    const empId = user.employeeId || user.id;
    const assignedClientIds = new Set<string>();

    db.projects.forEach((p) => {
      if (p.assignedEmployees?.includes(user.id) || p.assignedEmployees?.includes(empId)) {
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
      (d) => d.assignedEmployeeId === empId || d.assignedEmployeeId === user.id || assignedClientIds.has(d.clientId)
    );
    return NextResponse.json({ deliverables: safeDeliverables });
  }

  return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, callerUserId } = body;
    const db = getDB();

    if (!callerUserId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const caller = db.users.find((u) => u.id === callerUserId);
    if (!caller || caller.status === 'inactive') {
      return NextResponse.json({ error: 'Unauthorized: Valid active session required' }, { status: 401 });
    }

    // 1. Create a new deliverable (Admin & Manager)
    if (!action || action === 'create') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin or Manager permission required' },
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

      const client = db.clients.find((c) => c.id === clientId);
      const project = db.projects.find((p) => p.id === projectId);
      const employee = db.employees.find((e) => e.id === assignedEmployeeId);

      const newDel: Deliverable = {
        id: `del-${Date.now()}`,
        clientId,
        clientName: client ? client.name : 'Unknown Client',
        projectId,
        projectTitle: project ? project.title : 'General Campaign',
        title,
        type: type || 'reel',
        targetMonth: targetMonth || new Date().toISOString().substring(0, 7),
        stage: 'content_planning', // Starts at Stage 1
        currentVersion: 1,
        scriptText: scriptText || '',
        scriptApproved: false,
        videoApproved: false,
        mediaUrl,
        thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
        assignedEmployeeId: assignedEmployeeId || '',
        assignedEmployeeName: employee ? employee.name : 'Unassigned',
        deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'in_progress',
        isCountedTowardsCommitment: false, // Never counted until published in stage 10!
        versions: [
          {
            version: 1,
            scriptText,
            mediaUrl,
            submittedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      };

      db.deliverables.unshift(newDel);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: caller?.id || 'sys',
        userName: caller?.name || 'Administrator',
        userRole: caller?.role || 'admin',
        action: 'Deliverable Created',
        details: `Created deliverable "${newDel.title}" for ${newDel.clientName}`,
        targetType: 'deliverable',
        targetId: newDel.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, deliverable: newDel });
    }

    // 2. Advance / Update Workflow Stage (Admin & Manager)
    if (action === 'update_stage') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
      }

      const { deliverableId, stage, status, scriptText, mediaUrl, scheduledPublishDate } = body;
      const del = db.deliverables.find((d) => d.id === deliverableId);
      if (!del) {
        return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
      }

      del.stage = stage as CreativeWorkflowStage;
      if (status) del.status = status;
      if (scriptText) del.scriptText = scriptText;
      if (mediaUrl) del.mediaUrl = mediaUrl;
      if (scheduledPublishDate) del.scheduledPublishDate = scheduledPublishDate;

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
            client.monthlyCommitment.reels +
            client.monthlyCommitment.longVideos +
            client.monthlyCommitment.graphics +
            client.monthlyCommitment.carousels;

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
        userId: caller?.id || 'sys',
        userName: caller?.name || 'Administrator',
        userRole: caller?.role || 'admin',
        action: 'Workflow Stage Advanced',
        details: `Moved "${del.title}" to stage "${stage}" (Status: ${del.status})`,
        targetType: 'deliverable',
        targetId: del.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, deliverable: del });
    }

    // 3. Mark Deliverable as Cancelled (preserves history, does NOT increment completed)
    if (action === 'cancel') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
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
        userId: caller?.id || 'sys',
        userName: caller?.name || 'Administrator',
        userRole: caller?.role || 'admin',
        action: 'Deliverable Cancelled',
        details: `Cancelled deliverable "${del.title}". Reason: ${del.cancellationReason}`,
        targetType: 'deliverable',
        targetId: del.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, deliverable: del });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Deliverable action failed' }, { status: 500 });
  }
}
