import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import {
  Task,
  TaskSubmission,
  TaskComment,
  NotificationItem,
  TaskStatus,
  Priority,
} from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';

export async function GET(request: Request) {
  // 1. Authenticate caller session
  const auth = getAuthenticatedUser(request);
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized: Valid active session required' },
      { status: auth.status || 401 }
    );
  }
  const user = auth.user;

  // 2. Client role cannot access internal operational tasks
  if (user.role === 'client') {
    return NextResponse.json(
      { error: 'Forbidden: Clients cannot access internal operational tasks' },
      { status: 403 }
    );
  }

  const db = getDB();

  // 3. Employee boundary: strictly restricted to tasks assigned to them
  if (user.role === 'employee') {
    const employeeRecord = db.employees.find(
      (e) => e.userId === user.id || e.id === user.employeeId
    );
    const empId = employeeRecord?.id || user.employeeId;

    const employeeTasks = db.tasks.filter(
      (t) =>
        (empId && t.assignedEmployeeId === empId) ||
        t.assignedEmployeeId === user.id ||
        t.assignedEmployeeName.toLowerCase() === user.name.toLowerCase()
    );

    return NextResponse.json({
      success: true,
      tasks: employeeTasks,
    });
  }

  // 4. Admin and Manager have full access across all company tasks
  return NextResponse.json({
    success: true,
    tasks: db.tasks,
  });
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate caller session
    const auth = getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: Valid active session required' },
        { status: auth.status || 401 }
      );
    }
    const user = auth.user;

    const body = await request.json();
    const { action } = body;
    const db = getDB();

    // -------------------------------------------------------------
    // ACTION 1: CREATE TASK (Admin & Manager Equal Parity)
    // -------------------------------------------------------------
    if (!action || action === 'create') {
      if (!hasFullAdminAccess(user)) {
        return NextResponse.json(
          { error: 'Forbidden: Admin or Manager permission required to create tasks' },
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

      if (!title || !clientId || !assignedEmployeeId) {
        return NextResponse.json(
          { error: 'Task title, client, and assigned employee are required' },
          { status: 400 }
        );
      }

      const client = db.clients.find((c) => c.id === clientId);
      const project = db.projects.find((p) => p.id === projectId);
      const employee = db.employees.find((e) => e.id === assignedEmployeeId);

      // Check current active workload for the assigned employee
      const activeTasksCount = db.tasks.filter(
        (t) =>
          t.assignedEmployeeId === assignedEmployeeId &&
          t.status !== 'completed' &&
          t.status !== 'backlog'
      ).length;

      const maxTasks = employee?.maxConcurrentTasks || 5;
      const isOverloaded = activeTasksCount >= maxTasks;
      const warning = isOverloaded
        ? `Warning: ${employee?.name || 'Assignee'} currently has ${activeTasksCount} active tasks (max capacity is ${maxTasks}).`
        : undefined;

      const newTask: Task = {
        id: `tsk-${Date.now()}`,
        title: title.trim(),
        clientId,
        clientName: client ? client.name : 'General Client',
        projectId: projectId || (project ? project.id : 'proj-gen'),
        projectTitle: project ? project.title : 'General Project',
        deliverableId: deliverableId || undefined,
        description: description || '',
        assignedEmployeeId,
        assignedEmployeeName: employee ? employee.name : 'Unassigned',
        assignedEmployeeDepartment: employee ? employee.department : 'Video Editing',
        priority: (priority as Priority) || 'medium',
        startDate: startDate || new Date().toISOString().split('T')[0],
        deadline:
          deadline ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'todo',
        referenceFiles: referenceFiles || [],
        requiredOutput: requiredOutput || 'Standard creative asset meeting agency guidelines.',
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

      // Record immutable audit log
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'Task Assigned',
        details: `Assigned task "${newTask.title}" to ${newTask.assignedEmployeeName} (${newTask.priority.toUpperCase()} priority).${
          isOverloaded ? ' [Assigned despite high capacity]' : ''
        }`,
        targetType: 'task',
        targetId: newTask.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({
        success: true,
        task: newTask,
        warning,
        isOverloaded,
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: SUBMIT WORK (Assigned Employee OR Admin/Manager)
    // -------------------------------------------------------------
    if (action === 'submit_work') {
      const { taskId, fileName, fileUrl, fileSize, notes } = body;
      const taskIndex = db.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const task = db.tasks[taskIndex];
      const employeeRecord = db.employees.find((e) => e.userId === user.id);
      const isAssigned =
        task.assignedEmployeeId === user.id ||
        task.assignedEmployeeId === user.employeeId ||
        (employeeRecord && task.assignedEmployeeId === employeeRecord.id);

      if (!isAssigned && !hasFullAdminAccess(user)) {
        return NextResponse.json(
          { error: 'Forbidden: You can only submit work for your assigned tasks' },
          { status: 403 }
        );
      }

      const newVersion = task.submissions.length + 1;
      const submission: TaskSubmission = {
        id: `sub-${Date.now()}`,
        version: newVersion,
        fileName: fileName || `Submission_v${newVersion}.mp4`,
        fileUrl:
          fileUrl ||
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        fileSize: fileSize || '38.4 MB',
        submittedAt: new Date().toISOString(),
        submittedByUserId: user.id,
        submittedByUserName: user.name,
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
        title: 'New Creative Submission for Review',
        message: `${user.name} submitted Version ${newVersion} for "${task.title}" (${task.clientName}).`,
        type: 'submission',
        relatedId: task.id,
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Record immutable audit log
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'Work Submitted',
        details: `Submitted version ${newVersion} for task "${task.title}"`,
        targetType: 'task',
        targetId: task.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, task, submission });
    }

    // -------------------------------------------------------------
    // ACTION 3: ADD COMMENT
    // -------------------------------------------------------------
    if (action === 'comment') {
      const { taskId, text } = body;
      const task = db.tasks.find((t) => t.id === taskId);
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      if (!text || !text.trim()) {
        return NextResponse.json({ error: 'Comment text cannot be empty' }, { status: 400 });
      }

      const comment: TaskComment = {
        id: `cmt-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      task.comments.push(comment);
      saveDB(db);
      return NextResponse.json({ success: true, comment });
    }

    // -------------------------------------------------------------
    // ACTION 4: UPDATE STATUS
    // -------------------------------------------------------------
    if (action === 'update_status') {
      const { taskId, status, feedbackNotes } = body;
      const task = db.tasks.find((t) => t.id === taskId);
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      task.status = status as TaskStatus;
      if (feedbackNotes !== undefined) {
        task.feedbackNotes = feedbackNotes;
      }
      if (status === 'completed') {
        task.completedAt = new Date().toISOString();
      }

      saveDB(db);
      return NextResponse.json({ success: true, task });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Task operation failed' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // 1. Authenticate caller session
    const auth = getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: Valid active session required' },
        { status: auth.status || 401 }
      );
    }
    const user = auth.user;

    // 2. Strict parity: Admin and Manager have equal administrative authority
    if (!hasFullAdminAccess(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager permission required to edit/reassign tasks' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { taskId, assignedEmployeeId, priority, deadline, status, title, description, requiredOutput } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const db = getDB();
    const taskIndex = db.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = db.tasks[taskIndex];
    const oldAssigneeName = task.assignedEmployeeName;
    const oldAssigneeId = task.assignedEmployeeId;
    let isReassigned = false;
    let warning: string | undefined = undefined;

    // Handle Employee Reassignment
    if (assignedEmployeeId && assignedEmployeeId !== task.assignedEmployeeId) {
      const newEmployee = db.employees.find((e) => e.id === assignedEmployeeId);
      if (!newEmployee) {
        return NextResponse.json({ error: 'New assignee employee not found' }, { status: 404 });
      }

      // Workload capacity check for the new assignee
      const newAssigneeActiveTasks = db.tasks.filter(
        (t) =>
          t.assignedEmployeeId === assignedEmployeeId &&
          t.id !== taskId &&
          t.status !== 'completed' &&
          t.status !== 'backlog'
      ).length;

      if (newAssigneeActiveTasks >= newEmployee.maxConcurrentTasks) {
        warning = `Warning: ${newEmployee.name} is currently at capacity (${newAssigneeActiveTasks}/${newEmployee.maxConcurrentTasks} tasks).`;
      }

      task.assignedEmployeeId = newEmployee.id;
      task.assignedEmployeeName = newEmployee.name;
      task.assignedEmployeeDepartment = newEmployee.department;
      isReassigned = true;

      // Notify new assignee
      db.notifications.unshift({
        id: `notif-${Date.now()}-new`,
        targetRole: 'employee',
        recipientUserId: newEmployee.userId,
        title: 'Task Reassigned to You',
        message: `You were reassigned "${task.title}" (${task.clientName}) by ${user.name}.`,
        type: 'assignment',
        relatedId: task.id,
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Notify previous assignee
      const oldEmp = db.employees.find((e) => e.id === oldAssigneeId);
      if (oldEmp) {
        db.notifications.unshift({
          id: `notif-${Date.now()}-old`,
          targetRole: 'employee',
          recipientUserId: oldEmp.userId,
          title: 'Task Reassigned',
          message: `Task "${task.title}" was reassigned to ${newEmployee.name}.`,
          type: 'assignment',
          relatedId: task.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Update other metadata fields if provided
    if (priority) task.priority = priority as Priority;
    if (deadline) task.deadline = deadline;
    if (status) task.status = status as TaskStatus;
    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (requiredOutput !== undefined) task.requiredOutput = requiredOutput;

    // Record immutable audit log
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: isReassigned ? 'Task Reassigned' : 'Task Updated',
      details: isReassigned
        ? `Reassigned task "${task.title}" from ${oldAssigneeName} to ${task.assignedEmployeeName}`
        : `Updated task details for "${task.title}"`,
      targetType: 'task',
      targetId: task.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({
      success: true,
      task,
      warning,
      isReassigned,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update/reassign task' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // 1. Authenticate caller session
    const auth = getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: Valid active session required' },
        { status: auth.status || 401 }
      );
    }
    const user = auth.user;

    // 2. Strict parity: Admin and Manager have equal administrative authority
    if (!hasFullAdminAccess(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager permission required to cancel/delete tasks' },
        { status: 403 }
      );
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const db = getDB();
    const task = db.tasks.find((t) => t.id === id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Soft-cancellation: mark status as completed/cancelled and preserve in audit log
    task.status = 'completed';
    task.cancelledAt = new Date().toISOString();
    task.cancelledByUserId = user.id;

    // Record immutable audit log
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Task Cancelled',
      details: `Cancelled task "${task.title}" for ${task.clientName}. Historical records preserved.`,
      targetType: 'task',
      targetId: task.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({
      success: true,
      message: `Task "${task.title}" cancelled successfully`,
      task,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to cancel task' },
      { status: 500 }
    );
  }
}
