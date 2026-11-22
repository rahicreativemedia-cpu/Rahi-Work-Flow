import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { User, Invitation, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const db = getDB();

  if (userId) {
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user });
  }

  // Return all users (for Admin/Manager user management)
  return NextResponse.json({ users: db.users, invitations: db.invitations });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, callerUserId } = body;
    const db = getDB();

    const caller = db.users.find((u) => u.id === callerUserId);

    // 1. Direct login or Switch role
    if (action === 'login') {
      const { email, userId } = body;
      const user = userId
        ? db.users.find((u) => u.id === userId)
        : db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials or user not found' }, { status: 401 });
      }

      if (user.status === 'inactive') {
        return NextResponse.json({ error: 'Account is deactivated. Contact administration.' }, { status: 403 });
      }

      return NextResponse.json({ success: true, user });
    }

    // 2. Send Invitation (Admin & Manager have EQUAL capability)
    if (action === 'invite') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
      }

      const { email, fullName, username, role, department, clientId, clientName } = body;

      if (!email || !fullName || !role) {
        return NextResponse.json({ error: 'Missing required invitation fields' }, { status: 400 });
      }

      const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
      }

      const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const newInvitation: Invitation = {
        id: `inv-${Date.now()}`,
        email,
        fullName,
        username: username || email.split('@')[0],
        role,
        department,
        clientId,
        clientName,
        token,
        status: 'pending',
        expiresAt,
        createdAt: new Date().toISOString(),
      };

      db.invitations.unshift(newInvitation);

      // Audit log
      const audit: AuditLog = {
        id: `aud-${Date.now()}`,
        userId: caller?.id || 'sys',
        userName: caller?.name || 'Authorized Admin',
        userRole: caller?.role || 'admin',
        action: 'Invitation Sent',
        details: `Sent invitation to ${fullName} (${email}) for role ${role}`,
        targetType: 'auth',
        targetId: newInvitation.id,
        timestamp: new Date().toISOString(),
      };
      db.auditLogs.unshift(audit);

      saveDB(db);
      return NextResponse.json({ success: true, invitation: newInvitation });
    }

    // 3. Accept invitation & set password
    if (action === 'accept_invitation') {
      const { token } = body;
      const invIndex = db.invitations.findIndex((i) => i.token === token && i.status === 'pending');
      if (invIndex === -1) {
        return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 400 });
      }

      const inv = db.invitations[invIndex];
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: inv.fullName,
        email: inv.email,
        username: inv.username,
        role: inv.role,
        permissionGroup:
          inv.role === 'admin' || inv.role === 'manager'
            ? 'FULL_ADMIN_ACCESS'
            : inv.role === 'employee'
            ? 'EMPLOYEE_ACCESS'
            : 'CLIENT_ACCESS',
        department: inv.department,
        clientId: inv.clientId,
        clientName: inv.clientName,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      db.invitations[invIndex].status = 'accepted';

      saveDB(db);
      return NextResponse.json({ success: true, user: newUser });
    }

    // 4. Create user directly (Admin & Manager)
    if (action === 'create_user') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
      }

      const { name, email, username, role, department, clientId, clientName, phone } = body;

      const newUser: User = {
        id: `usr-${Date.now()}`,
        name,
        email,
        username: username || email.split('@')[0],
        role,
        permissionGroup:
          role === 'admin' || role === 'manager'
            ? 'FULL_ADMIN_ACCESS'
            : role === 'employee'
            ? 'EMPLOYEE_ACCESS'
            : 'CLIENT_ACCESS',
        department,
        clientId,
        clientName,
        phone,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);

      // If employee, also add to employees array
      if (role === 'employee') {
        db.employees.push({
          id: `emp-${Date.now()}`,
          userId: newUser.id,
          name,
          email,
          phone: phone || '',
          department: department || 'Video Editing',
          designation: `${department || 'Creative'} Specialist`,
          status: 'active',
          maxConcurrentTasks: 5,
          currentActiveTasks: 0,
          joinedDate: new Date().toISOString().split('T')[0],
          performanceScore: 100,
          skills: ['Creative Execution', 'Standard Operating Procedures'],
        });
      }

      // Audit log
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: caller?.id || 'sys',
        userName: caller?.name || 'Administrator',
        userRole: caller?.role || 'admin',
        action: 'Account Created',
        details: `Created ${role} account for ${name} (${email})`,
        targetType: 'auth',
        targetId: newUser.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, user: newUser });
    }

    // 5. Toggle account status (activate/deactivate)
    if (action === 'toggle_status') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json({ error: 'Unauthorized: Admin or Manager permission required' }, { status: 403 });
      }

      const { targetUserId } = body;
      const targetUser = db.users.find((u) => u.id === targetUserId);
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      targetUser.status = targetUser.status === 'active' ? 'inactive' : 'active';

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: caller?.id || 'sys',
        userName: caller?.name || 'Administrator',
        userRole: caller?.role || 'admin',
        action: 'Account Status Changed',
        details: `${targetUser.name}'s account set to ${targetUser.status}`,
        targetType: 'auth',
        targetId: targetUser.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, user: targetUser });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Auth operation failed' }, { status: 500 });
  }
}
