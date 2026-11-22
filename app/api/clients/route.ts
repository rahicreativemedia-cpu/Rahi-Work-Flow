import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { Client, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const db = getDB();

  // 1. Strict Authentication Enforcement: Unauthenticated requests are rejected with 401
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to access client directory' },
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

  // 2. Client Role Isolation: Client can ONLY access their own organization data.
  // Query parameters attempting to access another organization are strictly ignored.
  if (user.role === 'client') {
    const client = db.clients.filter((c) => c.id === user.clientId);
    return NextResponse.json({ clients: client });
  }

  // 3. Admin & Manager Parity: Full access to all client profiles including financial retainers
  if (hasFullAdminAccess(user)) {
    return NextResponse.json({ clients: db.clients });
  }

  // 4. Employee Boundary Enforcement:
  // Employees only access clients they are assigned to (via projects, tasks, or deliverables).
  // All financial retainers and currencies are strictly hidden.
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

    const assignedClients = db.clients
      .filter((c) => assignedClientIds.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company,
        logoUrl: c.logoUrl,
        servicePackage: c.servicePackage,
        status: c.status,
        primaryContactName: c.primaryContactName,
        contractStartDate: c.contractStartDate,
        contractEndDate: c.contractEndDate,
        monthlyCommitment: c.monthlyCommitment,
        createdAt: c.createdAt,
        // STRICT SECURITY: monthlyRetainer and currency are excluded
      }));

    return NextResponse.json({ clients: assignedClients });
  }

  return NextResponse.json(
    { error: 'Forbidden: Insufficient privileges' },
    { status: 403 }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { callerUserId, ...clientData } = body;
    const db = getDB();

    // 1. Strict Authentication Check
    if (!callerUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const caller = db.users.find((u) => u.id === callerUserId);
    if (!caller || caller.status === 'inactive') {
      return NextResponse.json(
        { error: 'Unauthorized: Active authenticated session required' },
        { status: 401 }
      );
    }

    // 2. Strict Authorization Check: Only Admin and Manager (FULL_ADMIN_ACCESS) can create clients
    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager permission required to create clients' },
        { status: 403 }
      );
    }

    if (!clientData.name || !clientData.email) {
      return NextResponse.json(
        { error: 'Client name and email are required' },
        { status: 400 }
      );
    }

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: clientData.name,
      company: clientData.company || clientData.name,
      email: clientData.email,
      phone: clientData.phone || '',
      logoUrl: clientData.logoUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&q=80',
      servicePackage: clientData.servicePackage || 'Full Marketing',
      contractStartDate: clientData.contractStartDate || new Date().toISOString().split('T')[0],
      contractEndDate: clientData.contractEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthlyRetainer: Number(clientData.monthlyRetainer) || 150000,
      currency: clientData.currency || 'INR',
      monthlyCommitment: {
        reels: Number(clientData.reels ?? clientData.monthlyCommitment?.reels ?? 15),
        longVideos: Number(clientData.longVideos ?? clientData.monthlyCommitment?.longVideos ?? 2),
        graphics: Number(clientData.graphics ?? clientData.monthlyCommitment?.graphics ?? 6),
        carousels: Number(clientData.carousels ?? clientData.monthlyCommitment?.carousels ?? 4),
        customTargetNote: clientData.customTargetNote ?? clientData.monthlyCommitment?.customTargetNote ?? '',
      },
      status: clientData.status || 'active',
      primaryContactName: clientData.primaryContactName || clientData.name,
      notes: clientData.notes || '',
      createdAt: new Date().toISOString(),
    };

    db.clients.unshift(newClient);

    // Audit log
    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'Client Created',
      details: `Added new client "${newClient.name}" with package ${newClient.servicePackage} (${newClient.monthlyRetainer} ${newClient.currency}/mo)`,
      targetType: 'client',
      targetId: newClient.id,
      timestamp: new Date().toISOString(),
    };
    db.auditLogs.unshift(audit);

    saveDB(db);
    return NextResponse.json({ success: true, client: newClient });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create client' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { callerUserId, id, ...updates } = body;
    const db = getDB();

    // 1. Strict Authentication Check
    if (!callerUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const caller = db.users.find((u) => u.id === callerUserId);
    if (!caller || caller.status === 'inactive') {
      return NextResponse.json(
        { error: 'Unauthorized: Active authenticated session required' },
        { status: 401 }
      );
    }

    // 2. Strict Authorization Check: Only Admin and Manager (FULL_ADMIN_ACCESS) can update clients
    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager permission required to update clients' },
        { status: 403 }
      );
    }

    const index = db.clients.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const existing = db.clients[index];
    const newMonthlyCommitment = {
      reels: updates.reels !== undefined ? Number(updates.reels) : (updates.monthlyCommitment?.reels ?? existing.monthlyCommitment.reels),
      longVideos: updates.longVideos !== undefined ? Number(updates.longVideos) : (updates.monthlyCommitment?.longVideos ?? existing.monthlyCommitment.longVideos),
      graphics: updates.graphics !== undefined ? Number(updates.graphics) : (updates.monthlyCommitment?.graphics ?? existing.monthlyCommitment.graphics),
      carousels: updates.carousels !== undefined ? Number(updates.carousels) : (updates.monthlyCommitment?.carousels ?? existing.monthlyCommitment.carousels),
      customTargetNote: updates.customTargetNote !== undefined ? updates.customTargetNote : (updates.monthlyCommitment?.customTargetNote ?? existing.monthlyCommitment.customTargetNote),
    };

    const updated: Client = {
      ...existing,
      name: updates.name !== undefined ? updates.name : existing.name,
      company: updates.company !== undefined ? updates.company : existing.company,
      email: updates.email !== undefined ? updates.email : existing.email,
      phone: updates.phone !== undefined ? updates.phone : existing.phone,
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl : existing.logoUrl,
      servicePackage: updates.servicePackage !== undefined ? updates.servicePackage : existing.servicePackage,
      contractStartDate: updates.contractStartDate !== undefined ? updates.contractStartDate : existing.contractStartDate,
      contractEndDate: updates.contractEndDate !== undefined ? updates.contractEndDate : existing.contractEndDate,
      monthlyRetainer: updates.monthlyRetainer !== undefined ? Number(updates.monthlyRetainer) : existing.monthlyRetainer,
      currency: updates.currency !== undefined ? updates.currency : existing.currency,
      status: updates.status !== undefined ? updates.status : existing.status,
      primaryContactName: updates.primaryContactName !== undefined ? updates.primaryContactName : existing.primaryContactName,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
      monthlyCommitment: newMonthlyCommitment,
    };

    db.clients[index] = updated;

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'Client Updated',
      details: `Updated client "${updated.name}" (Status: ${updated.status}, Retainer: ${updated.monthlyRetainer} ${updated.currency}/mo)`,
      targetType: 'client',
      targetId: updated.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, client: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idFromQuery = searchParams.get('id');
    const callerUserIdFromQuery = searchParams.get('callerUserId');

    let clientId = idFromQuery;
    let callerUserId = callerUserIdFromQuery;

    // Support payload from body as well if present
    try {
      const body = await request.json();
      if (body.id) clientId = body.id;
      if (body.callerUserId) callerUserId = body.callerUserId;
    } catch {
      // Body was empty or query param used
    }

    if (!callerUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const db = getDB();
    const caller = db.users.find((u) => u.id === callerUserId);
    if (!caller || caller.status === 'inactive') {
      return NextResponse.json(
        { error: 'Unauthorized: Active authenticated session required' },
        { status: 401 }
      );
    }

    if (!hasFullAdminAccess(caller)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager permission required to delete clients' },
        { status: 403 }
      );
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const index = db.clients.findIndex((c) => c.id === clientId);
    if (index === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const removedClient = db.clients[index];
    db.clients.splice(index, 1);

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'Client Deleted',
      details: `Deleted client "${removedClient.name}" (${removedClient.id})`,
      targetType: 'client',
      targetId: removedClient.id,
      timestamp: new Date().toISOString(),
    });

    saveDB(db);
    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete client' }, { status: 500 });
  }
}
