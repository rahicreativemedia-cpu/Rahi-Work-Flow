import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getTasks,
  createUser,
  getUserByEmailOrUsername,
  createAuditLog,
} from '@/lib/db';
import { Employee } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';
import { hashPassword } from '@/lib/crypto';
import { privateJsonResponse, privateErrorResponse } from '@/lib/api-response';


export async function GET(request: Request) {
  try {
    // 1. Authenticate caller session via HttpOnly cookie or Bearer token
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Valid active session required',
        auth.status || 401
      );
    }
    const user = auth.user;

    // 2. Client role cannot inspect internal employee rosters or performance data
    if (user.role === 'client') {
      return privateErrorResponse(
        'Forbidden: Clients cannot access internal agency employee roster',
        403
      );
    }

    const [allEmployees, allTasks] = await Promise.all([
      getEmployees(),
      getTasks(),
    ]);

    // 3. Compute dynamic live active workload per employee from active tasks
    const employeesWithWorkload = allEmployees.map((emp) => {
      const activeTasks = allTasks.filter(
        (t) =>
          (t.assignedEmployeeId === emp.id || t.assignedEmployeeId === emp.userId) &&
          t.status !== 'completed' &&
          t.status !== 'backlog'
      ).length;

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

    return privateJsonResponse({
      success: true,
      employees: employeesWithWorkload,
    });
  } catch (error: any) {
    return privateErrorResponse('Failed to retrieve employees', 500, error);
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

    // 2. Strict parity: Admin and Manager have equal administrative authority
    if (!hasFullAdminAccess(user)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to add employees',
        403
      );
    }

    const body = await request.json();

    if (!body.name || !body.email) {
      return privateErrorResponse('Employee name and email are required', 400);
    }

    const cleanEmail = body.email.trim().toLowerCase();
    const existingUser = await getUserByEmailOrUsername(cleanEmail);
    if (existingUser) {
      return privateErrorResponse('An employee or user with this email already exists', 400);
    }

    const timestamp = Date.now();
    const newEmpId = `emp-${timestamp}`;
    const newUserId = `usr-emp-${timestamp}`;

    const newEmp: Employee = {
      id: newEmpId,
      userId: newUserId,
      name: body.name.trim(),
      email: cleanEmail,
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

    await createEmployee(newEmp);

    // Create corresponding user login record with assigned password and username
    const employeePassword = (body.password || 'emp123').trim();
    const employeeUsername = (body.username || newEmp.email.split('@')[0]).trim().toLowerCase();

    const isManagerRole = body.portalRole === 'manager';
    const portalRole = isManagerRole ? 'manager' : 'employee';
    const permissionGroup = isManagerRole ? 'FULL_ADMIN_ACCESS' : 'EMPLOYEE_ACCESS';

    await createUser({
      id: newEmp.userId,
      name: newEmp.name,
      email: newEmp.email,
      username: employeeUsername,
      role: portalRole,
      permissionGroup,
      department: newEmp.department,
      employeeId: newEmp.id,
      phone: newEmp.phone,
      status: 'active',
      passwordHash: hashPassword(employeePassword),
      createdAt: new Date().toISOString(),
    });

    // Audit log
    await createAuditLog({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Employee Added',
      details: `Added ${newEmp.name} (${newEmp.department}) with portal role ${portalRole.toUpperCase()}`,
      targetType: 'employee',
      targetId: newEmp.id,
      timestamp: new Date().toISOString(),
    });

    return privateJsonResponse({ success: true, employee: newEmp }, { status: 201 });
  } catch (error: any) {
    return privateErrorResponse('Failed to create employee', 500, error);
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
        'Forbidden: Admin or Manager permission required to update employee profiles',
        403
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return privateErrorResponse('Employee ID is required', 400);
    }

    const existing = await getEmployeeById(id);
    if (!existing) {
      return privateErrorResponse('Employee not found', 404);
    }

    const updated = await updateEmployee(id, {
      name: updates.name !== undefined ? updates.name : existing.name,
      phone: updates.phone !== undefined ? updates.phone : existing.phone,
      department: updates.department !== undefined ? updates.department : existing.department,
      designation: updates.designation !== undefined ? updates.designation : existing.designation,
      status: updates.status !== undefined ? updates.status : existing.status,
      maxConcurrentTasks:
        updates.maxConcurrentTasks !== undefined
          ? Number(updates.maxConcurrentTasks)
          : existing.maxConcurrentTasks,
      performanceScore:
        updates.performanceScore !== undefined
          ? Number(updates.performanceScore)
          : existing.performanceScore,
      skills: Array.isArray(updates.skills) ? updates.skills : existing.skills,
    });

    await createAuditLog({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Employee Profile Updated',
      details: `Updated details for ${updated?.name || id}`,
      targetType: 'employee',
      targetId: id,
      timestamp: new Date().toISOString(),
    });

    return privateJsonResponse({ success: true, employee: updated });
  } catch (error: any) {
    return privateErrorResponse('Failed to update employee', 500, error);
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
        'Forbidden: Admin or Manager permission required to archive employees',
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const empId = searchParams.get('id');

    if (!empId) {
      return privateErrorResponse('Employee ID is required', 400);
    }

    const existing = await getEmployeeById(empId);
    if (!existing) {
      return privateErrorResponse('Employee not found', 404);
    }

    // Soft delete / archive
    const updated = await updateEmployee(empId, { status: 'inactive' });

    await createAuditLog({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Employee Deactivated',
      details: `Deactivated employee ${existing.name}`,
      targetType: 'employee',
      targetId: empId,
      timestamp: new Date().toISOString(),
    });

    return privateJsonResponse({
      success: true,
      message: 'Employee deactivated successfully',
      employee: updated,
    });
  } catch (error: any) {
    return privateErrorResponse('Failed to deactivate employee', 500, error);
  }
}
