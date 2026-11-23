import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getClients,
  getClientById,
  getEmployees,
  getTasks,
  getUsers,
  createAuditLog,
} from '@/lib/db';
import { Project, ProjectStatus, Priority, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';
import { privateJsonResponse, privateErrorResponse } from '@/lib/api-response';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const explicitUserId = searchParams.get('userId');
    const clientIdFilter = searchParams.get('clientId');
    const statusFilter = searchParams.get('status');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const auth = await getAuthenticatedUser(request, explicitUserId);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required to access projects',
        auth.status || 401
      );
    }

    const user = auth.user;
    if (user.status === 'inactive') {
      return privateErrorResponse('Forbidden: Account is inactive', 403);
    }

    let projects = await getProjects();

    // 1. Client Isolation
    if (user.role === 'client') {
      projects = projects.filter((p) => p.clientId === user.clientId && p.status !== 'archived');
      // Sanitize: strip internal budget from client view
      const sanitized = projects.map((p) => {
        const { budget, currency, ...rest } = p;
        return rest;
      });
      return privateJsonResponse({ projects: sanitized });
    }

    // 2. Employee Assigned Boundary
    if (user.role === 'employee') {
      const [allEmployees, allTasks] = await Promise.all([getEmployees(), getTasks()]);
      const empRecord = allEmployees.find(
        (e) => e.userId === user.id || e.id === user.employeeId
      );
      const empId = empRecord?.id || user.employeeId || user.id;

      projects = projects.filter((p) => {
        if (p.status === 'archived') return false;
        const isAssigned =
          (p.assignedEmployees || []).includes(empId) ||
          (p.assignedEmployees || []).includes(user.id);
        const hasAssignedTask = allTasks.some(
          (t) =>
            t.projectId === p.id &&
            (t.assignedEmployeeId === empId || t.assignedEmployeeId === user.id)
        );
        return isAssigned || hasAssignedTask;
      });

      // Sanitize: hide budget from employees
      const sanitized = projects.map((p) => {
        const { budget, currency, ...rest } = p;
        return rest;
      });
      return privateJsonResponse({ projects: sanitized });
    }

    // 3. Admin & Manager: Full company-wide access
    if (!includeArchived) {
      projects = projects.filter((p) => p.status !== 'archived');
    }

    if (clientIdFilter) {
      projects = projects.filter((p) => p.clientId === clientIdFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      projects = projects.filter((p) => p.status === statusFilter);
    }

    return privateJsonResponse({ projects });
  } catch (error: any) {
    return privateErrorResponse('Failed to retrieve projects', 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      callerUserId,
      clientId,
      title,
      description,
      objective,
      startDate,
      targetEndDate,
      deadline,
      priority,
      status,
      assignedEmployees,
      projectManagerId,
      budget,
      currency,
      totalDeliverablesTarget,
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

    // Role check: Admin and Manager only
    if (!hasFullAdminAccess(caller)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to create projects',
        403
      );
    }

    // Validation: Title
    if (!title || !title.trim()) {
      return privateErrorResponse('Project title is required', 400);
    }

    // Validation: Foreign Key - Client must exist
    const client = await getClientById(clientId);
    if (!client) {
      return privateErrorResponse(
        'Invalid client reference: Project must belong to an existing client',
        400
      );
    }

    // Validation: Foreign Key - Assigned employees must exist
    const allEmployees = await getEmployees();
    const validAssignedEmployees: string[] = [];
    if (Array.isArray(assignedEmployees)) {
      for (const empId of assignedEmployees) {
        const empExists = allEmployees.some((e) => e.id === empId || e.userId === empId);
        if (empExists) {
          validAssignedEmployees.push(empId);
        }
      }
    }

    // Resolve project manager name if provided
    let pmName = undefined;
    if (projectManagerId) {
      const allUsers = await getUsers();
      const pmUser = allUsers.find(
        (u) => u.id === projectManagerId || u.employeeId === projectManagerId
      );
      pmName = pmUser?.name;
    }

    const finalEndDate =
      targetEndDate ||
      deadline ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newProject: Project = {
      id: `prj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clientId: client.id,
      clientName: client.name,
      title: title.trim(),
      description: description?.trim() || '',
      objective: objective?.trim() || '',
      startDate: startDate || new Date().toISOString().split('T')[0],
      targetEndDate: finalEndDate,
      priority: (priority as Priority) || 'medium',
      status: (status as ProjectStatus) || 'planning',
      assignedEmployees: validAssignedEmployees,
      projectManagerId: projectManagerId || undefined,
      projectManagerName: pmName,
      budget: budget !== undefined && budget !== null ? Number(budget) : undefined,
      currency: currency || client.currency || 'INR',
      progress: 0,
      totalDeliverablesTarget: Number(totalDeliverablesTarget) || 10,
      completedDeliverablesCount: 0,
      createdAt: new Date().toISOString(),
    };

    await createProject(newProject);

    // Immutable Audit Log
    await createAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'Project Created',
      details: `${caller.name} created project "${newProject.title}" for client ${newProject.clientName} (Budget: ${newProject.currency} ${newProject.budget || 0})`,
      targetType: 'project',
      targetId: newProject.id,
      timestamp: new Date().toISOString(),
    });

    return privateJsonResponse({ success: true, project: newProject }, { status: 201 });
  } catch (error: any) {
    return privateErrorResponse('Failed to create project', 500, error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { callerUserId, id, action, ...updates } = body;

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

    // Role check: Admin and Manager only
    if (!hasFullAdminAccess(caller)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to modify projects',
        403
      );
    }

    const existingProject = await getProjectById(id);
    if (!existingProject) {
      return privateErrorResponse('Project not found', 404);
    }

    // Handle Archive Action
    if (action === 'archive') {
      const archived = await updateProject(id, {
        status: 'archived',
        archivedAt: new Date().toISOString(),
        archivedByUserId: caller.id,
      });

      await createAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Project Archived',
        details: `${caller.name} archived project "${existingProject.title}"`,
        targetType: 'project',
        targetId: existingProject.id,
        timestamp: new Date().toISOString(),
      });

      return privateJsonResponse({
        success: true,
        project: archived,
        message: 'Project archived successfully',
      });
    }

    // Handle Restore Action
    if (action === 'restore') {
      const restored = await updateProject(id, {
        status: 'active',
        archivedAt: undefined,
        archivedByUserId: undefined,
      });

      await createAuditLog({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Project Restored',
        details: `${caller.name} restored archived project "${existingProject.title}"`,
        targetType: 'project',
        targetId: existingProject.id,
        timestamp: new Date().toISOString(),
      });

      return privateJsonResponse({
        success: true,
        project: restored,
        message: 'Project restored successfully',
      });
    }

    // Standard Project Edit / Update
    const projectUpdates: Partial<Project> = {};

    if (updates.clientId && updates.clientId !== existingProject.clientId) {
      const client = await getClientById(updates.clientId);
      if (!client) {
        return privateErrorResponse('Invalid client reference', 400);
      }
      projectUpdates.clientId = client.id;
      projectUpdates.clientName = client.name;
    }

    if (updates.title) projectUpdates.title = updates.title.trim();
    if (updates.description !== undefined)
      projectUpdates.description = updates.description.trim();
    if (updates.objective !== undefined)
      projectUpdates.objective = updates.objective.trim();
    if (updates.startDate) projectUpdates.startDate = updates.startDate;
    if (updates.targetEndDate || updates.deadline) {
      projectUpdates.targetEndDate = updates.targetEndDate || updates.deadline;
    }
    if (updates.priority) projectUpdates.priority = updates.priority;
    if (updates.status) projectUpdates.status = updates.status;
    if (Array.isArray(updates.assignedEmployees))
      projectUpdates.assignedEmployees = updates.assignedEmployees;
    if (updates.projectManagerId !== undefined) {
      projectUpdates.projectManagerId = updates.projectManagerId;
      const allUsers = await getUsers();
      const pmUser = allUsers.find((u) => u.id === updates.projectManagerId);
      projectUpdates.projectManagerName = pmUser?.name;
    }
    if (updates.budget !== undefined) projectUpdates.budget = Number(updates.budget);
    if (updates.currency) projectUpdates.currency = updates.currency;
    if (updates.progress !== undefined) projectUpdates.progress = Number(updates.progress);
    if (updates.totalDeliverablesTarget !== undefined) {
      projectUpdates.totalDeliverablesTarget = Number(updates.totalDeliverablesTarget);
    }

    const updated = await updateProject(id, projectUpdates);

    await createAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'Project Updated',
      details: `${caller.name} updated project details for "${updated?.title || existingProject.title}"`,
      targetType: 'project',
      targetId: existingProject.id,
      timestamp: new Date().toISOString(),
    });

    return privateJsonResponse({ success: true, project: updated });
  } catch (error: any) {
    return privateErrorResponse('Failed to update project', 500, error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const callerUserId = searchParams.get('userId');

    const auth = await getAuthenticatedUser(request, callerUserId);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required',
        auth.status || 401
      );
    }

    const caller = auth.user;
    if (!hasFullAdminAccess(caller)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to archive projects',
        403
      );
    }

    if (!id) {
      return privateErrorResponse('Project ID is required', 400);
    }

    const project = await getProjectById(id);
    if (!project) {
      return privateErrorResponse('Project not found', 404);
    }

    // Soft-archive to preserve historical records and task associations
    const archived = await updateProject(id, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
      archivedByUserId: caller.id,
    });

    await createAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'Project Archived',
      details: `${caller.name} archived project "${project.title}" via DELETE`,
      targetType: 'project',
      targetId: project.id,
      timestamp: new Date().toISOString(),
    });

    return privateJsonResponse({
      success: true,
      message: `Project "${project.title}" has been safely archived. Historical deliverables and tasks are preserved.`,
      project: archived,
    });
  } catch (error: any) {
    return privateErrorResponse('Failed to archive project', 500, error);
  }
}
