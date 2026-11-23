import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getClientById,
  getProjectById,
  getEmployees,
  getEmployeeById,
  createNotification,
  createAuditLog,
  getDeliverableById,
  updateDeliverable,
} from '@/lib/db';
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
import { privateJsonResponse, privateErrorResponse } from '@/lib/api-response';


export async function GET(request: Request) {
  try {
    // 1. Authenticate caller session
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Valid active session required',
        auth.status || 401
      );
    }
    const user = auth.user;

    // 2. Client role cannot access internal operational tasks
    if (user.role === 'client') {
      return privateErrorResponse(
        'Forbidden: Clients cannot access internal operational tasks',
        403
      );
    }

    const allTasks = await getTasks();

    // 3. Employee boundary: strictly restricted to tasks assigned to them
    if (user.role === 'employee') {
      const allEmployees = await getEmployees();
      const employeeRecord = allEmployees.find(
        (e) => e.userId === user.id || e.id === user.employeeId
      );
      const empId = employeeRecord?.id || user.employeeId;

      const employeeTasks = allTasks.filter(
        (t) =>
          (empId && t.assignedEmployeeId === empId) ||
          t.assignedEmployeeId === user.id ||
          t.assignedEmployeeName.toLowerCase() === user.name.toLowerCase()
      );

      return privateJsonResponse({
        success: true,
        tasks: employeeTasks,
      });
    }

    // 4. Admin and Manager have full access across all company tasks
    return privateJsonResponse({
      success: true,
      tasks: allTasks,
    });
  } catch (error: any) {
    return privateErrorResponse('Failed to retrieve tasks', 500, error);
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate caller session
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Valid active session required',
        auth.status || 401
      );
    }
    const user = auth.user;

    const body = await request.json();
    const { action } = body;

    // -------------------------------------------------------------
    // ACTION 1: CREATE TASK (Admin & Manager Equal Parity)
    // -------------------------------------------------------------
    if (!action || action === 'create') {
      if (!hasFullAdminAccess(user)) {
        return privateErrorResponse(
          'Forbidden: Admin or Manager permission required to create tasks',
          403
        );
      }

      const {
        title,
        clientId,
        projectId,
        deliverableId,
        description,
        assignedEmployeeId,
        assignedEmployeeIds,
        priority,
        startDate,
        deadline,
        estimatedHours,
        requiredOutput,
        referenceFiles,
      } = body;

      if (!title || !clientId || !assignedEmployeeId) {
        return privateErrorResponse(
          'Task title, client, and assigned employee are required',
          400
        );
      }

      const client = await getClientById(clientId);
      if (!client) {
        return privateErrorResponse(
          'Invalid client reference: Task must reference a valid client',
          400
        );
      }

      let project = null;
      if (projectId) {
        project = await getProjectById(projectId);
        if (!project) {
          return privateErrorResponse(
            'Invalid project reference: Task must reference a valid project',
            400
          );
        }
      }

      const employee = await getEmployeeById(assignedEmployeeId);
      const allTasks = await getTasks();

      // Check current active workload for the assigned employee
      const activeTasksCount = allTasks.filter(
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

      const finalEmployeeIds =
        Array.isArray(assignedEmployeeIds) && assignedEmployeeIds.length > 0
          ? assignedEmployeeIds
          : [assignedEmployeeId];

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
        assignedEmployeeIds: finalEmployeeIds,
        priority: (priority as Priority) || 'medium',
        startDate: startDate || new Date().toISOString().split('T')[0],
        deadline:
          deadline ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours:
          estimatedHours !== undefined && estimatedHours !== null
            ? Number(estimatedHours)
            : undefined,
        status: 'todo',
        referenceFiles: referenceFiles || [],
        requiredOutput:
          requiredOutput || 'Standard creative asset meeting agency guidelines.',
        submissions: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };

      await createTask(newTask);

      // Notify the assigned employee
      if (employee) {
        await createNotification({
          id: `notif-${Date.now()}`,
          targetRole: 'employee',
          recipientUserId: employee.userId,
          title: 'New Task Assigned',
          message: `You were assigned: "${newTask.title}" for ${newTask.clientName}. Due by ${newTask.deadline}.`,
          type: 'assignment',
          relatedId: newTask.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Record immutable audit log
      await createAuditLog({
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

      return privateJsonResponse({
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
      const task = await getTaskById(taskId);
      if (!task) {
        return privateErrorResponse('Task not found', 404);
      }

      const allEmployees = await getEmployees();
      const employeeRecord = allEmployees.find((e) => e.userId === user.id);
      const isAssigned =
        task.assignedEmployeeId === user.id ||
        task.assignedEmployeeId === user.employeeId ||
        (employeeRecord && task.assignedEmployeeId === employeeRecord.id);

      if (!isAssigned && !hasFullAdminAccess(user)) {
        return privateErrorResponse(
          'Forbidden: You can only submit work for your assigned tasks',
          403
        );
      }

      const newVersion = (task.submissions?.length || 0) + 1;
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

      const submissions = [...(task.submissions || []), submission];
      const updatedTask = await updateTask(taskId, {
        submissions,
        status: 'in_review',
      });

      // If linked deliverable exists, advance or update it to internal review
      if (task.deliverableId) {
        const del = await getDeliverableById(task.deliverableId);
        if (del) {
          const versions = [
            ...(del.versions || []),
            {
              version: newVersion,
              mediaUrl: submission.fileUrl,
              scriptText: notes,
              submittedAt: new Date().toISOString(),
              notes,
            },
          ];

          let newStage = del.stage;
          let newStatus = del.status;
          if (del.stage === 'video_editing' || del.stage === 'revisions') {
            newStage = 'internal_video_review';
            newStatus = 'internal_review';
          } else if (del.stage === 'scriptwriting') {
            newStage = 'internal_script_review';
            newStatus = 'internal_review';
          }

          await updateDeliverable(del.id, {
            currentVersion: newVersion,
            mediaUrl: submission.fileUrl,
            stage: newStage,
            status: newStatus,
            versions,
          });
        }
      }

      // Notify Admin and Manager
      await createNotification({
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
      await createAuditLog({
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

      return privateJsonResponse({ success: true, task: updatedTask, submission });
    }

    // -------------------------------------------------------------
    // ACTION 3: ADD COMMENT
    // -------------------------------------------------------------
    if (action === 'comment') {
      const { taskId, text } = body;
      const task = await getTaskById(taskId);
      if (!task) {
        return privateErrorResponse('Task not found', 404);
      }

      if (!text || !text.trim()) {
        return privateErrorResponse('Comment text cannot be empty', 400);
      }

      const comment: TaskComment = {
        id: `cmt-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      const comments = [...(task.comments || []), comment];
      await updateTask(taskId, { comments });
      return privateJsonResponse({ success: true, comment });
    }

    // -------------------------------------------------------------
    // ACTION 4: UPDATE STATUS
    // -------------------------------------------------------------
    if (action === 'update_status') {
      const { taskId, status, feedbackNotes } = body;
      const task = await getTaskById(taskId);
      if (!task) {
        return privateErrorResponse('Task not found', 404);
      }

      const taskUpdates: Partial<Task> = {
        status: status as TaskStatus,
      };
      if (feedbackNotes !== undefined) {
        taskUpdates.feedbackNotes = feedbackNotes;
      }
      if (status === 'completed') {
        taskUpdates.completedAt = new Date().toISOString();
      }

      const updated = await updateTask(taskId, taskUpdates);
      return privateJsonResponse({ success: true, task: updated });
    }

    return privateErrorResponse('Invalid action specified', 400);
  } catch (error: any) {
    return privateErrorResponse('Task operation failed', 500, error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Valid active session required',
        auth.status || 401
      );
    }
    const user = auth.user;

    if (!hasFullAdminAccess(user)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to edit/reassign tasks',
        403
      );
    }

    const body = await request.json();
    const {
      taskId,
      assignedEmployeeId,
      priority,
      deadline,
      status,
      title,
      description,
      requiredOutput,
    } = body;

    if (!taskId) {
      return privateErrorResponse('Task ID is required', 400);
    }

    const task = await getTaskById(taskId);
    if (!task) {
      return privateErrorResponse('Task not found', 404);
    }

    const oldAssigneeName = task.assignedEmployeeName;
    const oldAssigneeId = task.assignedEmployeeId;
    let isReassigned = false;
    let warning: string | undefined = undefined;

    const taskUpdates: Partial<Task> = {};

    // Handle Employee Reassignment
    if (assignedEmployeeId && assignedEmployeeId !== task.assignedEmployeeId) {
      const newEmployee = await getEmployeeById(assignedEmployeeId);
      if (!newEmployee) {
        return privateErrorResponse('New assignee employee not found', 404);
      }

      const allTasks = await getTasks();
      const newAssigneeActiveTasks = allTasks.filter(
        (t) =>
          t.assignedEmployeeId === assignedEmployeeId &&
          t.id !== taskId &&
          t.status !== 'completed' &&
          t.status !== 'backlog'
      ).length;

      if (newAssigneeActiveTasks >= newEmployee.maxConcurrentTasks) {
        warning = `Warning: ${newEmployee.name} is currently at capacity (${newAssigneeActiveTasks}/${newEmployee.maxConcurrentTasks} tasks).`;
      }

      taskUpdates.assignedEmployeeId = newEmployee.id;
      taskUpdates.assignedEmployeeName = newEmployee.name;
      taskUpdates.assignedEmployeeDepartment = newEmployee.department;
      isReassigned = true;

      // Notify new assignee
      await createNotification({
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
      const oldEmp = await getEmployeeById(oldAssigneeId);
      if (oldEmp) {
        await createNotification({
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

    if (priority) taskUpdates.priority = priority as Priority;
    if (deadline) taskUpdates.deadline = deadline;
    if (status) taskUpdates.status = status as TaskStatus;
    if (title) taskUpdates.title = title.trim();
    if (description !== undefined) taskUpdates.description = description;
    if (requiredOutput !== undefined) taskUpdates.requiredOutput = requiredOutput;

    const updated = await updateTask(taskId, taskUpdates);

    await createAuditLog({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: isReassigned ? 'Task Reassigned' : 'Task Updated',
      details: isReassigned
        ? `Reassigned task "${task.title}" from ${oldAssigneeName} to ${taskUpdates.assignedEmployeeName}`
        : `Updated task details for "${task.title}"`,
      targetType: 'task',
      targetId: task.id,
      timestamp: new Date().toISOString(),
    });

    return privateJsonResponse({
      success: true,
      task: updated,
      warning,
      isReassigned,
    });
  } catch (error: any) {
    return privateErrorResponse('Failed to update/reassign task', 500, error);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Valid active session required',
        auth.status || 401
      );
    }
    const user = auth.user;

    if (!hasFullAdminAccess(user)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to cancel/delete tasks',
        403
      );
    }

    const { id } = await request.json();
    if (!id) {
      return privateErrorResponse('Task ID is required', 400);
    }

    const task = await getTaskById(id);
    if (!task) {
      return privateErrorResponse('Task not found', 404);
    }

    // Soft-cancellation: mark status as completed/cancelled and preserve in audit log
    const updated = await updateTask(id, {
      status: 'completed',
    });

    await createAuditLog({
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

    return privateJsonResponse({
      success: true,
      message: `Task "${task.title}" cancelled successfully`,
      task: updated,
    });
  } catch (error: any) {
    return privateErrorResponse('Failed to cancel task', 500, error);
  }
}
