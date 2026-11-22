import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { Employee, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const db = getDB();

  const user = db.users.find((u) => u.id === userId);

  // Clients shouldn't access internal employee performance metrics
  if (user && user.role === 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Calculate dynamic active task count per employee
  const employeesWithWorkload = db.employees.map((emp) => {
    const activeTasks = db.tasks.filter(
      (t) =>
        t.assignedEmployeeId === emp.id &&
        t.status !== 'completed' &&
        t.status !== 'backlog'
    ).length;
    return {
      ...emp,
      currentActiveTasks: activeTasks,
    };
  });

  return NextResponse.json({ employees: employeesWithWorkload });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { callerUserId, ...empData } = body;
    const db = getDB();

    const caller = db.users.find((u) => u.id === callerUserId);
    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin or Manager permission required' },
        { status: 403 }
      );
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      userId: `usr-${Date.now()}`,
      name: empData.name,
      email: empData.email,
      phone: empData.phone || '',
      department: empData.department || 'Video Editing',
      designation: empData.designation || 'Creative Specialist',
      status: 'active',
      maxConcurrentTasks: Number(empData.maxConcurrentTasks) || 5,
      currentActiveTasks: 0,
      joinedDate: empData.joinedDate || new Date().toISOString().split('T')[0],
      performanceScore: Number(empData.performanceScore) || 95,
      skills: empData.skills ? empData.skills.split(',').map((s: string) => s.trim()) : ['Creative Production'],
    };

    db.employees.unshift(newEmp);

    // Also create login user for employee
    db.users.push({
      id: newEmp.userId,
      name: newEmp.name,
      email: newEmp.email,
      username: newEmp.email.split('@')[0],
      role: 'employee',
      permissionGroup: 'EMPLOYEE_ACCESS',
      department: newEmp.department,
      employeeId: newEmp.id,
      phone: newEmp.phone,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: caller?.id || 'sys',
      userName: caller?.name || 'Administrator',
      userRole: caller?.role || 'admin',
      action: 'Employee Added',
      details: `Added employee ${newEmp.name} in department ${newEmp.department}`,
      targetType: 'employee',
      targetId: newEmp.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, employee: newEmp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add employee' }, { status: 500 });
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

    const index = db.employees.findIndex((e) => e.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const existing = db.employees[index];
    const updated: Employee = {
      ...existing,
      ...updates,
      skills: Array.isArray(updates.skills)
        ? updates.skills
        : typeof updates.skills === 'string'
        ? updates.skills.split(',').map((s: string) => s.trim())
        : existing.skills,
    };

    db.employees[index] = updated;

    // Update corresponding user profile if name/email changed
    const userIndex = db.users.findIndex((u) => u.employeeId === id || u.id === updated.userId);
    if (userIndex !== -1) {
      db.users[userIndex].name = updated.name;
      db.users[userIndex].email = updated.email;
      db.users[userIndex].department = updated.department;
      db.users[userIndex].status = updated.status;
    }

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: caller?.id || 'sys',
      userName: caller?.name || 'Administrator',
      userRole: caller?.role || 'admin',
      action: 'Employee Profile Updated',
      details: `Updated profile for employee ${updated.name}`,
      targetType: 'employee',
      targetId: updated.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update employee' }, { status: 500 });
  }
}
