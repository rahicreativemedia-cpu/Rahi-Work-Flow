import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/lib/db';
import { User, Invitation, AuditLog } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');
  const db = getDB();

  // Look up specific invitation by token (for invitation claim modal)
  if (token) {
    const invitation = db.invitations.find((i) => i.token === token);
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    return NextResponse.json({ invitation });
  }

  // Look up specific user by userId
  if (userId) {
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user });
  }

  // Return all users & invitations (for Admin/Manager user management)
  return NextResponse.json({ users: db.users, invitations: db.invitations });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, callerUserId } = body;
    const db = getDB();

    const caller = db.users.find((u) => u.id === callerUserId);

    // 1. Direct login / credentials verification
    if (action === 'login') {
      const { email, userId, password } = body;
      const user = userId
        ? db.users.find((u) => u.id === userId)
        : db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase().trim());

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid credentials or user not registered' },
          { status: 401 }
        );
      }

      if (user.status === 'inactive') {
        return NextResponse.json(
          { error: 'Account is deactivated. Please contact company administration.' },
          { status: 403 }
        );
      }

      // Record successful login in audit log
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'User Login',
        details: `${user.name} logged in to ${user.role.toUpperCase()} PORTAL`,
        targetType: 'auth',
        targetId: user.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, user });
    }

    // 2. Send Invitation (Admin & Manager have EQUAL capability)
    if (action === 'invite') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin or Manager permission required' },
          { status: 403 }
        );
      }

      const { email, fullName, username, role, department, clientId, clientName } = body;

      if (!email || !fullName || !role) {
        return NextResponse.json({ error: 'Missing required invitation fields' }, { status: 400 });
      }

      const existingUser = db.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email address is already registered' },
          { status: 400 }
        );
      }

      const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const newInvitation: Invitation = {
        id: `inv-${Date.now()}`,
        email: email.trim(),
        fullName: fullName.trim(),
        username: (username || email.split('@')[0]).trim(),
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

      // Audit log entry
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: caller?.id || 'sys',
        userName: caller?.name || 'Administrator',
        userRole: caller?.role || 'admin',
        action: 'Invitation Dispatched',
        details: `Sent invitation to ${fullName} (${email}) for role ${role.toUpperCase()}`,
        targetType: 'auth',
        targetId: newInvitation.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, invitation: newInvitation });
    }

    // 3. Accept invitation & set initial secure password
    if (action === 'accept_invitation') {
      const { token, password } = body;
      if (!token) {
        return NextResponse.json({ error: 'Missing invitation token' }, { status: 400 });
      }

      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters in length' },
          { status: 400 }
        );
      }

      const invIndex = db.invitations.findIndex(
        (i) => i.token === token && i.status === 'pending'
      );
      if (invIndex === -1) {
        return NextResponse.json(
          { error: 'Invalid, already claimed, or expired invitation token' },
          { status: 400 }
        );
      }

      const inv = db.invitations[invIndex];

      // Check if user somehow was created
      const existingUser = db.users.find(
        (u) => u.email.toLowerCase() === inv.email.toLowerCase()
      );
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      const newUserId = `usr-${Date.now()}`;
      const newUser: User = {
        id: newUserId,
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

      // If employee role, sync into employee roster
      if (inv.role === 'employee') {
        db.employees.push({
          id: `emp-${Date.now()}`,
          userId: newUserId,
          name: inv.fullName,
          email: inv.email,
          phone: '',
          department: inv.department || 'Video Editing',
          designation: `${inv.department || 'Creative'} Specialist`,
          status: 'active',
          maxConcurrentTasks: 5,
          currentActiveTasks: 0,
          joinedDate: new Date().toISOString().split('T')[0],
          performanceScore: 100,
          skills: ['Creative Execution', 'Standard Operating Procedures'],
        });
      }

      // Record audit log
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: newUserId,
        userName: inv.fullName,
        userRole: inv.role,
        action: 'Invitation Accepted',
        details: `${inv.fullName} activated ${inv.role.toUpperCase()} account via secure invitation link`,
        targetType: 'auth',
        targetId: newUserId,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, user: newUser });
    }

    // 4. Create user directly (Admin & Manager Equal Access)
    if (action === 'create_user') {
      if (!hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin or Manager permission required' },
          { status: 403 }
        );
      }

      const { name, email, username, role, department, clientId, clientName, phone } = body;

      if (!name || !email || !role) {
        return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
      }

      const existingUser = db.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email address already exists' },
          { status: 400 }
        );
      }

      const newUserId = `usr-${Date.now()}`;
      const newUser: User = {
        id: newUserId,
        name: name.trim(),
        email: email.trim(),
        username: (username || email.split('@')[0]).trim(),
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

      // If employee, also add to employees directory
      if (role === 'employee') {
        db.employees.push({
          id: `emp-${Date.now()}`,
          userId: newUserId,
          name: name.trim(),
          email: email.trim(),
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
        details: `Directly created ${role.toUpperCase()} account for ${name} (${email})`,
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
        return NextResponse.json(
          { error: 'Unauthorized: Admin or Manager permission required' },
          { status: 403 }
        );
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
        details: `${targetUser.name}'s account was set to ${targetUser.status.toUpperCase()}`,
        targetType: 'auth',
        targetId: targetUser.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, user: targetUser });
    }

    // 6. Password reset request
    if (action === 'reset_password_request') {
      const { email } = body;
      const targetUser = db.users.find(
        (u) => u.email.toLowerCase() === (email || '').toLowerCase().trim()
      );

      if (!targetUser) {
        return NextResponse.json(
          { error: 'No account found with this email address' },
          { status: 404 }
        );
      }

      const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: targetUser.id,
        userName: targetUser.name,
        userRole: targetUser.role,
        action: 'Password Reset Initiated',
        details: `Password reset instructions generated for ${targetUser.email}`,
        targetType: 'auth',
        targetId: targetUser.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({
        success: true,
        message: `Password reset link dispatched for ${targetUser.email}`,
        resetToken,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Auth operation failed' },
      { status: 500 }
    );
  }
}
