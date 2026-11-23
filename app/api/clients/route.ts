import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  getUsers,
  createUser,
  getUserByEmailOrUsername,
  createAuditLog,
  getProjects,
  getTasks,
  getDeliverables,
} from '@/lib/db';
import { Client, AuditLog, User } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { getAuthenticatedUser } from '@/lib/session';
import { hashPassword } from '@/lib/crypto';
import { privateJsonResponse, privateErrorResponse } from '@/lib/api-response';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const explicitUserId = searchParams.get('userId');
    const auth = await getAuthenticatedUser(request, explicitUserId);

    // 1. Strict Authentication Enforcement
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required to access client directory',
        auth.status || 401
      );
    }

    const user = auth.user;

    // 2. Client Role Isolation: Client can ONLY access their own organization data.
    if (user.role === 'client') {
      if (!user.clientId) {
        return privateJsonResponse({ clients: [] });
      }
      const client = await getClientById(user.clientId);
      return privateJsonResponse({ clients: client ? [client] : [] });
    }

    // 3. Admin & Manager Parity: Full access to all client profiles including financial retainers
    if (hasFullAdminAccess(user)) {
      const allClients = await getClients();
      return privateJsonResponse({ clients: allClients });
    }

    // 4. Employee Boundary Enforcement:
    // Employees only access clients they are actively assigned to (via projects, tasks, or deliverables).
    // All financial retainers and currencies are strictly hidden.
    if (user.role === 'employee') {
      const empId = user.employeeId || user.id;
      const [allClients, allProjects, allTasks, allDeliverables] = await Promise.all([
        getClients(),
        getProjects(),
        getTasks(),
        getDeliverables(),
      ]);

      const assignedClientIds = new Set<string>();

      allProjects.forEach((p) => {
        if (p.assignedEmployees?.includes(user.id) || p.assignedEmployees?.includes(empId)) {
          assignedClientIds.add(p.clientId);
        }
      });
      allTasks.forEach((t) => {
        if (t.assignedEmployeeId === empId || t.assignedEmployeeId === user.id) {
          assignedClientIds.add(t.clientId);
        }
      });
      allDeliverables.forEach((d) => {
        if (d.assignedEmployeeId === empId || d.assignedEmployeeId === user.id) {
          assignedClientIds.add(d.clientId);
        }
      });

      const assignedClients = allClients
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

      return privateJsonResponse({ clients: assignedClients });
    }

    return privateErrorResponse('Forbidden: Insufficient privileges', 403);
  } catch (error: any) {
    return privateErrorResponse('Failed to retrieve clients', 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { callerUserId, ...clientData } = body;
    const auth = await getAuthenticatedUser(request, callerUserId);

    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required',
        auth.status || 401
      );
    }

    const caller = auth.user;

    // Strict Authorization Check: Only Admin and Manager (FULL_ADMIN_ACCESS) can create clients
    if (!hasFullAdminAccess(caller)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to create clients',
        403
      );
    }

    if (!clientData.name || !clientData.email) {
      return privateErrorResponse('Client name and email are required', 400);
    }

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: clientData.name,
      company: clientData.company || clientData.name,
      email: clientData.email,
      phone: clientData.phone || '',
      logoUrl: clientData.logoUrl || '',
      servicePackage: clientData.servicePackage || 'Full Marketing',
      contractStartDate: clientData.contractStartDate || new Date().toISOString().split('T')[0],
      contractEndDate:
        clientData.contractEndDate ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthlyRetainer: Number(clientData.monthlyRetainer) || 150000,
      currency: clientData.currency || 'INR',
      monthlyCommitment: {
        reels: Number(clientData.reels ?? clientData.monthlyCommitment?.reels ?? 16),
        marketingReels: Number(
          clientData.marketingReels ?? clientData.monthlyCommitment?.marketingReels ?? 8
        ),
        posts: Number(
          clientData.posts ??
            clientData.graphics ??
            clientData.monthlyCommitment?.posts ??
            clientData.monthlyCommitment?.graphics ??
            12
        ),
        graphics: Number(
          clientData.posts ??
            clientData.graphics ??
            clientData.monthlyCommitment?.posts ??
            clientData.monthlyCommitment?.graphics ??
            12
        ),
        carousels: Number(
          clientData.carousels ?? clientData.monthlyCommitment?.carousels ?? 4
        ),
        showreels: Number(
          clientData.showreels ?? clientData.monthlyCommitment?.showreels ?? 2
        ),
        longVideos: Number(
          clientData.longVideos ?? clientData.monthlyCommitment?.longVideos ?? 2
        ),
        customTargetNote:
          clientData.customTargetNote ?? clientData.monthlyCommitment?.customTargetNote ?? '',
        trackingFrequency:
          clientData.trackingFrequency ??
          clientData.monthlyCommitment?.trackingFrequency ??
          (clientData.servicePackage === 'Video Production Only' ? 'weekly' : 'monthly'),
        weeklyCommitment:
          clientData.weeklyCommitment ?? clientData.monthlyCommitment?.weeklyCommitment,
        weeklyDeadlineDay:
          clientData.weeklyDeadlineDay ??
          clientData.monthlyCommitment?.weeklyDeadlineDay ??
          'Friday',
      },
      status: clientData.status || 'active',
      primaryContactName: clientData.primaryContactName || clientData.name,
      notes: clientData.notes || '',
      createdAt: new Date().toISOString(),
    };

    await createClient(newClient);

    // Create user login record for client with assigned password and username if not exists
    const clientUserPassword = (clientData.password || 'client123').trim();
    const clientUsername = (clientData.username || clientData.email.split('@')[0])
      .trim()
      .toLowerCase();

    const existingUser = await getUserByEmailOrUsername(newClient.email);
    if (!existingUser) {
      await createUser({
        id: `usr-cli-${Date.now()}`,
        name: newClient.name,
        email: newClient.email.toLowerCase().trim(),
        username: clientUsername,
        role: 'client',
        permissionGroup: 'CLIENT_ACCESS',
        clientId: newClient.id,
        clientName: newClient.company || newClient.name,
        phone: newClient.phone,
        passwordHash: hashPassword(clientUserPassword),
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }

    // Audit log
    await createAuditLog({
      id: `aud-${Date.now()}`,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'Client Created',
      details: `Added new client "${newClient.name}" with package ${newClient.servicePackage} (${newClient.monthlyRetainer} ${newClient.currency}/mo)`,
      targetType: 'client',
      targetId: newClient.id,
      timestamp: new Date().toISOString(),
    });

    return privateJsonResponse({ success: true, client: newClient }, { status: 201 });
  } catch (error: any) {
    return privateErrorResponse('Failed to create client', 500, error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { callerUserId, id, ...updates } = body;
    const auth = await getAuthenticatedUser(request, callerUserId);

    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required',
        auth.status || 401
      );
    }

    const caller = auth.user;

    // Strict Authorization Check: Only Admin and Manager (FULL_ADMIN_ACCESS) can update clients
    if (!hasFullAdminAccess(caller)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to update clients',
        403
      );
    }

    const existing = await getClientById(id);
    if (!existing) {
      return privateErrorResponse('Client not found', 404);
    }

    const newMonthlyCommitment = {
      reels:
        updates.reels !== undefined
          ? Number(updates.reels)
          : (updates.monthlyCommitment?.reels ?? existing.monthlyCommitment?.reels ?? 0),
      marketingReels:
        updates.marketingReels !== undefined
          ? Number(updates.marketingReels)
          : (updates.monthlyCommitment?.marketingReels ??
            existing.monthlyCommitment?.marketingReels ??
            0),
      posts:
        updates.posts !== undefined
          ? Number(updates.posts)
          : (updates.monthlyCommitment?.posts ??
            updates.monthlyCommitment?.graphics ??
            existing.monthlyCommitment?.posts ??
            existing.monthlyCommitment?.graphics ??
            0),
      graphics:
        updates.posts !== undefined
          ? Number(updates.posts)
          : (updates.monthlyCommitment?.posts ??
            updates.monthlyCommitment?.graphics ??
            existing.monthlyCommitment?.graphics ??
            0),
      carousels:
        updates.carousels !== undefined
          ? Number(updates.carousels)
          : (updates.monthlyCommitment?.carousels ??
            existing.monthlyCommitment?.carousels ??
            0),
      showreels:
        updates.showreels !== undefined
          ? Number(updates.showreels)
          : (updates.monthlyCommitment?.showreels ??
            existing.monthlyCommitment?.showreels ??
            0),
      longVideos:
        updates.longVideos !== undefined
          ? Number(updates.longVideos)
          : (updates.monthlyCommitment?.longVideos ??
            existing.monthlyCommitment?.longVideos ??
            0),
      customTargetNote:
        updates.customTargetNote !== undefined
          ? updates.customTargetNote
          : (updates.monthlyCommitment?.customTargetNote ??
            existing.monthlyCommitment?.customTargetNote ??
            ''),
      trackingFrequency:
        updates.trackingFrequency !== undefined
          ? updates.trackingFrequency
          : (updates.monthlyCommitment?.trackingFrequency ??
            existing.monthlyCommitment?.trackingFrequency ??
            'monthly'),
      weeklyCommitment:
        updates.weeklyCommitment !== undefined
          ? updates.weeklyCommitment
          : (updates.monthlyCommitment?.weeklyCommitment ??
            existing.monthlyCommitment?.weeklyCommitment),
      weeklyDeadlineDay:
        updates.weeklyDeadlineDay !== undefined
          ? updates.weeklyDeadlineDay
          : (updates.monthlyCommitment?.weeklyDeadlineDay ??
            existing.monthlyCommitment?.weeklyDeadlineDay ??
            'Friday'),
    };

    const updated = await updateClient(id, {
      name: updates.name !== undefined ? updates.name : existing.name,
      company: updates.company !== undefined ? updates.company : existing.company,
      email: updates.email !== undefined ? updates.email : existing.email,
      phone: updates.phone !== undefined ? updates.phone : existing.phone,
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl : existing.logoUrl,
      servicePackage:
        updates.servicePackage !== undefined ? updates.servicePackage : existing.servicePackage,
      contractStartDate:
        updates.contractStartDate !== undefined
          ? updates.contractStartDate
          : existing.contractStartDate,
      contractEndDate:
        updates.contractEndDate !== undefined
          ? updates.contractEndDate
          : existing.contractEndDate,
      monthlyRetainer:
        updates.monthlyRetainer !== undefined
          ? Number(updates.monthlyRetainer)
          : existing.monthlyRetainer,
      currency: updates.currency !== undefined ? updates.currency : existing.currency,
      status: updates.status !== undefined ? updates.status : existing.status,
      primaryContactName:
        updates.primaryContactName !== undefined
          ? updates.primaryContactName
          : existing.primaryContactName,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
      monthlyCommitment: newMonthlyCommitment,
    });

    await createAuditLog({
      id: `aud-${Date.now()}`,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'Client Updated',
      details: `Updated client "${updated?.name || id}" (Status: ${updated?.status}, Retainer: ${updated?.monthlyRetainer} ${updated?.currency}/mo)`,
      targetType: 'client',
      targetId: id,
      timestamp: new Date().toISOString(),
    });

    return privateJsonResponse({ success: true, client: updated });
  } catch (error: any) {
    return privateErrorResponse('Failed to update client', 500, error);
  }
}

/**
 * CLIENT DELETION SAFETY: SOFT DELETION / ARCHIVAL
 * Preserves all projects, tasks, deliverables, approvals, and financial history.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idFromQuery = searchParams.get('id');
    const callerUserIdFromQuery = searchParams.get('callerUserId');

    let clientId = idFromQuery;
    let explicitUserId = callerUserIdFromQuery;

    try {
      const body = await request.json();
      if (body.id) clientId = body.id;
      if (body.callerUserId) explicitUserId = body.callerUserId;
    } catch {
      // Body was empty or query param used
    }

    const auth = await getAuthenticatedUser(request, explicitUserId);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Authentication required',
        auth.status || 401
      );
    }

    const caller = auth.user;

    // Strict Authorization Check: Only Admin and Manager (FULL_ADMIN_ACCESS) can delete/archive clients
    if (!hasFullAdminAccess(caller)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to delete/archive clients',
        403
      );
    }

    if (!clientId) {
      return privateErrorResponse('Client ID is required', 400);
    }

    const existing = await getClientById(clientId);
    if (!existing) {
      return privateErrorResponse('Client not found', 404);
    }

    // SOFT DELETION / ARCHIVAL IMPLEMENTATION
    const archived = await updateClient(clientId, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
      archivedByUserId: caller.id,
    });

    await createAuditLog({
      id: `aud-${Date.now()}`,
      userId: caller.id,
      userName: caller.name,
      userRole: caller.role,
      action: 'Client Archived',
      details: `Archived client "${existing.name}" (${existing.id}). Historical projects, tasks, deliverables, and approvals permanently preserved.`,
      targetType: 'client',
      targetId: existing.id,
      timestamp: new Date().toISOString(),
    });

    return privateJsonResponse({
      success: true,
      message:
        'Client successfully archived. Historical projects, deliverables, and approvals preserved.',
      client: archived,
    });
  } catch (error: any) {
    return privateErrorResponse('Failed to archive client', 500, error);
  }
}
