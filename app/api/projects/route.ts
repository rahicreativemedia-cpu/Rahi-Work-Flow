import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { Project, ProjectStatus, Priority, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const explicitUserId = searchParams.get('userId');
  const clientIdFilter = searchParams.get('clientId');
  const statusFilter = searchParams.get('status');
  const includeArchived = searchParams.get('includeArchived') === 'true';

  const auth = getAuthenticatedUser(request, explicitUserId);
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized: Authentication required to access projects' },
      { status: auth.status || 401 }
    );
  }

  const user = auth.user;
  if (user.status === 'inactive') {
    return NextResponse.json({ error: 'Forbidden: Account is inactive' }, { status: 403 });
  }

  const db = getDB();
  let projects = [...db.projects];

  // 1. Client Isolation
  if (user.role === 'client') {
    projects = projects.filter((p) => p.clientId === user.clientId && p.status !== 'archived');
    // Sanitize: strip internal budget from client view
    const sanitized = projects.map((p) => {
      const { budget, currency, ...rest } = p;
      return rest;
    });
    return NextResponse.json({ projects: sanitized });
  }

  // 2. Employee Assigned Boundary
  if (user.role === 'employee') {
    const empRecord = db.employees.find((e) => e.userId === user.id || e.id === user.employeeId);
    const empId = empRecord?.id || user.employeeId || user.id;

    projects = projects.filter((p) => {
      if (p.status === 'archived') return false;
      const isAssigned = (p.assignedEmployees || []).includes(empId) || (p.assignedEmployees || []).includes(user.id);
      const hasAssignedTask = db.tasks.some(
        (t) => t.projectId === p.id && (t.assignedEmployeeId === empId || t.assignedEmployeeId === user.id)
      );
      return isAssigned || hasAssignedTask;
    });

    // Sanitize: hide budget from employees
    const sanitized = projects.map((p) => {
      const { budget, currency, ...rest } = p;
      return rest;
    });
    return NextResponse.json({ projects: sanitized });
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

  return NextResponse.json({ projects });
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

    const auth = getAuthenticatedUser(request, callerUserId);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: Authentication required' },
        { status: auth.status || 401 }
      );
    }

    const caller = auth.user;
    if (caller.status === 'inactive') {
      return NextResponse.json({ error: 'Forbidden: Account is inactive' }, { status: 403 });
    }

    // Role check: Admin and Manager only
    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager permission required to create projects' },
        { status: 403 }
      );
    }

    // Validation: Title
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Project title is required' }, { status: 400 });
    }

    const db = getDB();

    // Validation: Foreign Key - Client must exist
    const client = db.clients.find((c) => c.id === clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'Invalid client reference: Project must belong to an existing client' },
        { status: 400 }
      );
    }

    // Validation: Foreign Key - Assigned employees must exist
    const validAssignedEmployees: string[] = [];
    if (Array.isArray(assignedEmployees)) {
      for (const empId of assignedEmployees) {
        const empExists = db.employees.some((e) => e.id === empId || e.userId === empId);
        if (empExists) {
          validAssignedEmployees.push(empId);
        }
      }
    }

    // Resolve project manager name if provided
    let pmName = undefined;
    if (projectManagerId) {
      const pmUser = db.users.find((u) => u.id === projectManagerId || u.employeeId === projectManagerId);
      pmName = pmUser?.name;
    }

    const finalEndDate = targetEndDate || deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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

    db.projects.unshift(newProject);

    // Immutable Audit Log
    db.auditLogs.unshift({
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

    saveDB(db);
    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { callerUserId, id, action, ...updates } = body;

    const auth = getAuthenticatedUser(request, callerUserId);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: Authentication required' },
        { status: auth.status || 401 }
      );
    }

    const caller = auth.user;
    if (caller.status === 'inactive') {
      return NextResponse.json({ error: 'Forbidden: Account is inactive' }, { status: 403 });
    }

    // Role check: Admin and Manager only
    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager permission required to modify projects' },
        { status: 403 }
      );
    }

    const db = getDB();
    const index = db.projects.findIndex((p) => p.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const existingProject = db.projects[index];

    // Handle Archive Action
    if (action === 'archive') {
      existingProject.status = 'archived';
      existingProject.archivedAt = new Date().toISOString();
      existingProject.archivedByUserId = caller.id;

      db.auditLogs.unshift({
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

      saveDB(db);
      return NextResponse.json({ success: true, project: existingProject, message: 'Project archived successfully' });
    }

    // Handle Restore Action
    if (action === 'restore') {
      existingProject.status = 'active';
      delete existingProject.archivedAt;
      delete existingProject.archivedByUserId;

      db.auditLogs.unshift({
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

      saveDB(db);
      return NextResponse.json({ success: true, project: existingProject, message: 'Project restored successfully' });
    }

    // Standard Project Edit / Update
    if (updates.clientId && updates.clientId !== existingProject.clientId) {
      const client = db.clients.find((c) => c.id === updates.clientId);
      if (!client) {
        return NextResponse.json({ error: 'Invalid client reference' }, { status: 400 });
      }
      existingProject.clientId = client.id;
      existingProject.clientName = client.name;
    }

    if (updates.title) existingProject.title = updates.title.trim();
    if (updates.description !== undefined) existingProject.description = updates.description.trim();
    if (updates.objective !== undefined) existingProject.objective = updates.objective.trim();
    if (updates.startDate) existingProject.startDate = updates.startDate;
    if (updates.targetEndDate || updates.deadline) {
      existingProject.targetEndDate = updates.targetEndDate || updates.deadline;
    }
    if (updates.priority) existingProject.priority = updates.priority;
    if (updates.status) existingProject.status = updates.status;
    if (Array.isArray(updates.assignedEmployees)) existingProject.assignedEmployees = updates.assignedEmployees;
    if (updates.projectManagerId !== undefined) {
      existingProject.projectManagerId = updates.projectManagerId;
      const pmUser = db.users.find((u) => u.id === updates.projectManagerId);
      existingProject.projectManagerName = pmUser?.name;
    }
    if (updates.budget !== undefined) existingProject.budget = Number(updates.budget);
    if (updates.currency) existingProject.currency = updates.currency;
    if (updates.progress !== undefined) existingProject.progress = Number(updates.progress);
    if (updates.totalDeliverablesTarget !== undefined) {
      existingProject.totalDeliverablesTarget = Number(updates.totalDeliverablesTarget);
    }

    db.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'Project Updated',
      details: `${caller.name} updated project details for "${existingProject.title}"`,
      targetType: 'project',
      targetId: existingProject.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, project: existingProject });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const callerUserId = searchParams.get('userId');

    const auth = getAuthenticatedUser(request, callerUserId);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: Authentication required' },
        { status: auth.status || 401 }
      );
    }

    const caller = auth.user;
    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager permission required to archive projects' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const db = getDB();
    const project = db.projects.find((p) => p.id === id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Soft-archive to preserve historical records and task associations
    project.status = 'archived';
    project.archivedAt = new Date().toISOString();
    project.archivedByUserId = caller.id;

    db.auditLogs.unshift({
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

    saveDB(db);
    return NextResponse.json({
      success: true,
      message: `Project "${project.title}" has been safely archived. Historical deliverables and tasks are preserved.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to archive project' }, { status: 500 });
  }
}
