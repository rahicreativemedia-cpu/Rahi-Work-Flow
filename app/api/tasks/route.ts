import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { Task, TaskSubmission, TaskComment, NotificationItem, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const db = getDB();

  const user = db.users.find((u) => u.id === userId);

  // Clients do not view internal employee tasks
  if (user && user.role === 'client') {
    return NextResponse.json({ tasks: [] });
  }

  // Employees only see their own assigned tasks
  if (user && user.role === 'employee') {
    const employeeTasks = db.tasks.filter(
      (t) =>
        t.assignedEmployeeId === user.employeeId ||
        t.assignedEmployeeId === user.id ||
        t.assignedEmployeeName.toLowerCase() === user.name.toLowerCase()
    );
    return NextResponse.json({ tasks: employeeTasks });
  }

  // Admin and Manager have access to all tasks across all clients and employees
  return NextResponse.json({ tasks: db.tasks });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, callerUserId } = body;
    const db = getDB();

    const caller = db.users.find((u) => u.id === callerUserId);

    // Action 1: Create a new task (Admin & Manager)
    if (!action || action === 'create') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin or Manager permission required to create tasks' },
          { status: 403 }
        );
      }

      const {
        title,
        clientId,
        projectId,
        deliverableId,
        description,
        assignedEmployeeId,
        priority,
        startDate,
        deadline,
        requiredOutput,
        referenceFiles,
      } = body;

      const client = db.clients.find((c) => c.id === clientId);
      const project = db.projects.find((p) => p.id === projectId);
      const employee = db.employees.find((e) => e.id === assignedEmployeeId);

      const newTask: Task = {
        id: `tsk-${Date.now()}`,
        title,
        clientId,
        clientName: client ? client.name : 'Unknown Client',
        projectId,
        projectTitle: project ? project.title : 'General Project',
        deliverableId,
        description: description || '',
        assignedEmployeeId,
        assignedEmployeeName: employee ? employee.name : 'Unassigned',
        assignedEmployeeDepartment: employee ? employee.department : 'Video Editing',
        priority: priority || 'medium',
        startDate: startDate || new Date().toISOString().split('T')[0],
        deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'todo',
        referenceFiles: referenceFiles || [],
        requiredOutput: requiredOutput || 'Standard high quality creative asset as briefed.',
        submissions: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };

      db.tasks.unshift(newTask);

      // Notify the assigned employee
      if (employee) {
        const notif: NotificationItem = {
          id: `notif-${Date.now()}`,
          targetRole: 'employee',
          recipientUserId: employee.userId,
          title: 'New Task Assigned',
          message: `You were assigned: "${newTask.title}" for ${newTask.clientName}. Due by ${newTask.deadline}.`,
          type: 'assignment',
          relatedId: newTask.id,
          read: false,
          createdAt: new Date().toISOString(),
        };
        db.notifications.unshift(notif);
      }

      // Audit Log
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: caller?.id || 'sys',
        userName: caller?.name || 'Administrator',
        userRole: caller?.role || 'admin',
        action: 'Task Assigned',
        details: `Created and assigned task "${newTask.title}" to ${newTask.assignedEmployeeName}`,
        targetType: 'task',
        targetId: newTask.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, task: newTask });
    }

    // Action 2: Submit Completed / Revision Work (Employee or Admin/Manager)
    if (action === 'submit_work') {
      const { taskId, fileName, fileUrl, fileSize, notes } = body;
      const taskIndex = db.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const task = db.tasks[taskIndex];
      const isAssigned =
        caller?.employeeId === task.assignedEmployeeId || caller?.id === task.assignedEmployeeId;
      if (!isAssigned && !hasFullAdminAccess(caller)) {
        return NextResponse.json({ error: 'Unauthorized to submit work for this task' }, { status: 403 });
      }

      const newVersion = task.submissions.length + 1;
      const submission: TaskSubmission = {
        id: `sub-${Date.now()}`,
        version: newVersion,
        fileName: fileName || `Submission_v${newVersion}.mp4`,
        fileUrl: fileUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        fileSize: fileSize || '38.4 MB',
        submittedAt: new Date().toISOString(),
        submittedByUserId: caller?.id || 'emp',
        submittedByUserName: caller?.name || 'Assigned Creative',
        notes: notes || '',
      };

      task.submissions.push(submission);
      task.status = 'in_review';

      // If linked deliverable exists, advance or update it to internal review
      if (task.deliverableId) {
        const del = db.deliverables.find((d) => d.id === task.deliverableId);
        if (del) {
          del.currentVersion = newVersion;
          del.mediaUrl = submission.fileUrl;
          if (del.stage === 'video_editing' || del.stage === 'revisions') {
            del.stage = 'internal_video_review';
            del.status = 'internal_review';
          } else if (del.stage === 'scriptwriting') {
            del.stage = 'internal_script_review';
            del.status = 'internal_review';
          }
          del.versions.push({
            version: newVersion,
            mediaUrl: submission.fileUrl,
            scriptText: notes,
            submittedAt: new Date().toISOString(),
            notes,
          });
        }
      }

      // Notify Admin and Manager
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        targetRole: 'all_admin',
        title: 'New Work Submitted for Review',
        message: `${caller?.name} submitted v${newVersion} for "${task.title}" (${task.clientName}).`,
        type: 'submission',
        relatedId: task.id,
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Audit Log
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: caller?.id || 'emp',
        userName: caller?.name || 'Employee',
        userRole: caller?.role || 'employee',
        action: 'Work Submitted',
        details: `Submitted version ${newVersion} for task "${task.title}"`,
        targetType: 'task',
        targetId: task.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, task, submission });
    }

    // Action 3: Add Comment
    if (action === 'comment') {
      const { taskId, text } = body;
      const task = db.tasks.find((t) => t.id === taskId);
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const comment: TaskComment = {
        id: `cmt-${Date.now()}`,
        userId: caller?.id || 'usr',
        userName: caller?.name || 'Team Member',
        userRole: caller?.role || 'employee',
        text,
        createdAt: new Date().toISOString(),
      };

      task.comments.push(comment);
      saveDB(db);
      return NextResponse.json({ success: true, comment });
    }

    // Action 4: Update task status or details
    if (action === 'update_status') {
      const { taskId, status, feedbackNotes } = body;
      const task = db.tasks.find((t) => t.id === taskId);
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      task.status = status;
      if (feedbackNotes !== undefined) {
        task.feedbackNotes = feedbackNotes;
      }
      if (status === 'completed') {
        task.completedAt = new Date().toISOString();
      }

      saveDB(db);
      return NextResponse.json({ success: true, task });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Task operation failed' }, { status: 500 });
  }
}
