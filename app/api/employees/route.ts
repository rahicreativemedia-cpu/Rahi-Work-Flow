import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { Employee } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';

export async function GET(request: Request) {
  // 1. Authenticate caller session via HttpOnly cookie or Bearer token
  const auth = getAuthenticatedUser(request);
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized: Valid active session required' },
      { status: auth.status || 401 }
    );
  }
  const user = auth.user;

  // 2. Client role cannot inspect internal employee rosters or performance data
  if (user.role === 'client') {
    return NextResponse.json(
      { error: 'Forbidden: Clients cannot access internal agency employee roster' },
      { status: 403 }
    );
  }

  const db = getDB();

  // 3. Compute dynamic live active workload per employee from active tasks
  const employeesWithWorkload = db.employees.map((emp) => {
    const activeTasks = db.tasks.filter(
      (t) =>
        (t.assignedEmployeeId === emp.id || t.assignedEmployeeId === emp.userId) &&
        t.status !== 'completed' &&
        t.status !== 'backlog'
    ).length;

    // Base employee object with live active task count
    const enriched: Employee = {
      ...emp,
      currentActiveTasks: activeTasks,
    };

    // Employees viewing colleagues receive a sanitized roster
    if (user.role === 'employee') {
      return {
        id: enriched.id,
        userId: enriched.userId,
        name: enriched.name,
        email: enriched.email,
        phone: enriched.phone,
        department: enriched.department,
        designation: enriched.designation,
        status: enriched.status,
        skills: enriched.skills,
        currentActiveTasks: enriched.currentActiveTasks,
        maxConcurrentTasks: enriched.maxConcurrentTasks,
      };
    }

    return enriched;
  });

  return NextResponse.json({
    success: true,
    employees: employeesWithWorkload,
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

    // 2. Strict parity: Admin and Manager have equal administrative authority
    if (!hasFullAdminAccess(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager permission required to add employees' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const db = getDB();

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Employee name and email are required' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    if (db.employees.some((e) => e.email.toLowerCase() === body.email.toLowerCase())) {
      return NextResponse.json(
        { error: 'An employee with this email already exists' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const newEmpId = `emp-${timestamp}`;
    const newUserId = `usr-emp-${timestamp}`;

    const newEmp: Employee = {
      id: newEmpId,
      userId: newUserId,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone || '',
      department: body.department || 'Video Editing',
      designation: body.designation || 'Creative Specialist',
      status: 'active',
      maxConcurrentTasks: Number(body.maxConcurrentTasks) || 5,
      currentActiveTasks: 0,
      joinedDate: body.joinedDate || new Date().toISOString().split('T')[0],
      performanceScore: Number(body.performanceScore) || 95,
      skills: Array.isArray(body.skills)
        ? body.skills
        : typeof body.skills === 'string'
        ? body.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : ['Creative Production'],
    };

    db.employees.unshift(newEmp);

    // Create corresponding user login record
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

    // Record immutable audit log
    db.auditLogs.unshift({
      id: `aud-${timestamp}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Employee Created',
      details: `Added new employee ${newEmp.name} (${newEmp.designation}) in ${newEmp.department} department`,
      targetType: 'employee',
      targetId: newEmp.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, employee: newEmp });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add employee' },
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
        { error: 'Forbidden: Admin or Manager permission required to update employees' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const db = getDB();
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
        ? updates.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : existing.skills,
    };

    db.employees[index] = updated;

    // Synchronize updates with corresponding login user record
    const userIndex = db.users.findIndex(
      (u) => u.employeeId === id || u.id === updated.userId
    );
    if (userIndex !== -1) {
      if (updated.name) db.users[userIndex].name = updated.name;
      if (updated.email) db.users[userIndex].email = updated.email;
      if (updated.department) db.users[userIndex].department = updated.department;
      if (updated.phone) db.users[userIndex].phone = updated.phone;
      if (updated.status) db.users[userIndex].status = updated.status;
    }

    // Record immutable audit log
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Employee Updated',
      details: `Updated profile and settings for ${updated.name} (${updated.department})`,
      targetType: 'employee',
      targetId: updated.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update employee' },
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
        { error: 'Forbidden: Admin or Manager permission required to deactivate employees' },
        { status: 403 }
      );
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const db = getDB();
    const employee = db.employees.find((e) => e.id === id);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Non-destructive soft deactivation
    employee.status = 'inactive';
    employee.deactivatedAt = new Date().toISOString();
    employee.deactivatedByUserId = user.id;

    // Deactivate user login account to block further access
    const userToDeactivate = db.users.find(
      (u) => u.employeeId === id || u.id === employee.userId
    );
    if (userToDeactivate) {
      userToDeactivate.status = 'inactive';
    }

    // Record immutable audit log
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Employee Deactivated',
      details: `Deactivated employee ${employee.name} (${employee.department}). Historical assignments and tasks preserved.`,
      targetType: 'employee',
      targetId: employee.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({
      success: true,
      message: `Employee ${employee.name} successfully deactivated`,
      employee,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate employee' },
      { status: 500 }
    );
  }
}
