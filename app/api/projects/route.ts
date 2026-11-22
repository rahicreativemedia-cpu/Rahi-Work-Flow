import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { Project, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const db = getDB();

  const user = db.users.find((u) => u.id === userId);

  // If Client, strictly return only this client's projects
  if (user && user.role === 'client') {
    const clientProjects = db.projects.filter((p) => p.clientId === user.clientId);
    return NextResponse.json({ projects: clientProjects });
  }

  // If Employee, return projects assigned to them or active agency projects
  if (user && user.role === 'employee') {
    const employeeProjects = db.projects.filter(
      (p) =>
        p.assignedEmployees.includes(user.employeeId || '') ||
        p.assignedEmployees.includes(user.id) ||
        db.tasks.some(
          (t) =>
            t.projectId === p.id &&
            (t.assignedEmployeeId === user.employeeId || t.assignedEmployeeId === user.id)
        )
    );
    return NextResponse.json({ projects: employeeProjects });
  }

  // Admin and Manager see all projects
  return NextResponse.json({ projects: db.projects });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { callerUserId, ...projectData } = body;
    const db = getDB();

    const caller = db.users.find((u) => u.id === callerUserId);
    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin or Manager permission required' },
        { status: 403 }
      );
    }

    const client = db.clients.find((c) => c.id === projectData.clientId);

    const newProject: Project = {
      id: `prj-${Date.now()}`,
      clientId: projectData.clientId,
      clientName: client ? client.name : projectData.clientName || 'General Client',
      title: projectData.title,
      description: projectData.description || '',
      startDate: projectData.startDate || new Date().toISOString().split('T')[0],
      targetEndDate: projectData.targetEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: projectData.status || 'planning',
      assignedEmployees: projectData.assignedEmployees || [],
      totalDeliverablesTarget: Number(projectData.totalDeliverablesTarget) || 10,
      completedDeliverablesCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.projects.unshift(newProject);

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: caller?.id || 'sys',
      userName: caller?.name || 'Administrator',
      userRole: caller?.role || 'admin',
      action: 'Project Created',
      details: `Created project "${newProject.title}" for client ${newProject.clientName}`,
      targetType: 'project',
      targetId: newProject.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, project: newProject });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { callerUserId, id, ...updates } = body;
    const db = getDB();

    const caller = db.users.find((u) => u.id === callerUserId);
    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
    }

    const index = db.projects.findIndex((p) => p.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updated = { ...db.projects[index], ...updates };
    db.projects[index] = updated;

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: caller?.id || 'sys',
      userName: caller?.name || 'Administrator',
      userRole: caller?.role || 'admin',
      action: 'Project Updated',
      details: `Updated project "${updated.title}"`,
      targetType: 'project',
      targetId: updated.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update project' }, { status: 500 });
  }
}
