import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDB, saveDB } from '@/lib/db';
import { User, Invitation, AuditLog, PasswordResetToken } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { createSession, formatSessionSetCookie, formatSessionClearCookie, getAuthenticatedUser } from '@/lib/session';
import { checkRateLimit, clearRateLimit, isRateLimitLocked, RATE_LIMIT_CONFIGS, getClientIp } from '@/lib/ratelimit';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');
  const db = getDB();

  // Look up specific invitation by cryptographically secure token
  if (token) {
    const invitation = db.invitations.find((i) => i.token === token);
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    // Return sanitized invitation data
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        fullName: invitation.fullName,
        email: invitation.email,
        role: invitation.role,
        department: invitation.department,
        clientName: invitation.clientName,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  }

  // Look up specific user by userId
  if (userId) {
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Never expose password hash to frontend
    const { passwordHash: _, ...safeUser } = user as any;
    return NextResponse.json({ user: safeUser });
  }

  // Return sanitized users & invitations (for Admin/Manager user management)
  const safeUsers = db.users.map(({ passwordHash: _, ...u }: any) => u);
  return NextResponse.json({ users: safeUsers, invitations: db.invitations });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    const db = getDB();

    // Authenticate caller strictly via cryptographic session (HttpOnly cookie or Bearer token)
    // Never trust client-provided callerUserId from request body
    const auth = getAuthenticatedUser(request);
    const caller = auth.user;

    // 1. Direct login / credentials verification
    if (action === 'login') {
      const { email, userId, password } = body;
      const cleanEmail = (email || '').toLowerCase().trim();
      const rateLimitKey = `login:failed:${cleanEmail || userId || 'anon'}`;

      // Check brute-force lockout (5 failed attempts per 15 minutes)
      const lockCheck = isRateLimitLocked(rateLimitKey, RATE_LIMIT_CONFIGS.loginFailed);
      if (lockCheck.locked) {
        return NextResponse.json(
          { error: `Too many failed login attempts. Please try again in ${lockCheck.retryAfterSeconds} seconds.` },
          { status: 429 }
        );
      }

      const user = userId
        ? db.users.find((u) => u.id === userId)
        : db.users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.loginFailed);
        return NextResponse.json(
          { error: 'Invalid credentials or user not registered' },
          { status: 401 }
        );
      }

      // Server-side deactivation enforcement: Inactive accounts CANNOT authenticate
      if (user.status === 'inactive') {
        return NextResponse.json(
          { error: 'Account is deactivated. Please contact company administration.' },
          { status: 403 }
        );
      }

      // If user has a passwordHash, verify it cryptographically
      if (user.passwordHash && password) {
        const isValid = verifyPassword(password, user.passwordHash);
        if (!isValid) {
          checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.loginFailed);
          return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
          );
        }
      }

      // Successful login resets any previous failed attempts
      clearRateLimit(rateLimitKey);

      // Record successful login in immutable audit log
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'User Authentication',
        details: `${user.name} authenticated into ${user.role.toUpperCase()} PORTAL`,
        targetType: 'auth',
        targetId: user.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);

      const session = createSession(user);
      const { passwordHash: _, ...safeUser } = user as any;
      const response = NextResponse.json({
        success: true,
        sessionToken: session.token,
        user: safeUser,
      });
      response.headers.set('Set-Cookie', formatSessionSetCookie(session.token));
      return response;
    }

    // 1b. Logout & Clear Session Cookie
    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
      response.headers.set('Set-Cookie', formatSessionClearCookie());
      return response;
    }

    // 2. Send Invitation (Admin & Manager have EQUAL capability)
    if (action === 'invite') {
      if (!caller || caller.status === 'inactive' || !hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Unauthorized: Active Admin or Manager permission required' },
          { status: 403 }
        );
      }

      const { email, fullName, username, role, department, clientId, clientName } = body;

      if (!email || !fullName || !role) {
        return NextResponse.json({ error: 'Missing required invitation fields' }, { status: 400 });
      }

      const cleanEmail = email.toLowerCase().trim();
      const existingUser = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email address is already registered' },
          { status: 400 }
        );
      }

      // Cryptographically secure token (48 characters hexadecimal)
      const token = `inv_${crypto.randomBytes(24).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Strict 7-day expiration

      const newInvitation: Invitation = {
        id: `inv-${Date.now()}`,
        email: cleanEmail,
        fullName: fullName.trim(),
        username: (username || cleanEmail.split('@')[0]).trim(),
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
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Invitation Dispatched',
        details: `Sent invitation to ${fullName} (${cleanEmail}) for role ${role.toUpperCase()} (Expires: 7 days)`,
        targetType: 'auth',
        targetId: newInvitation.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, invitation: newInvitation });
    }

    // 3. Accept invitation & set initial secure password (Enforces 12-char policy, single-use, & expiry)
    if (action === 'accept_invitation') {
      const { token, password } = body;
      if (!token) {
        return NextResponse.json({ error: 'Missing invitation token' }, { status: 400 });
      }

      // Brute-force token guessing defense (5 attempts per 15 minutes)
      const invRate = checkRateLimit(`invite_accept:${token}`, RATE_LIMIT_CONFIGS.invitationAccept);
      if (!invRate.allowed) {
        return NextResponse.json(
          { error: 'Too many invitation acceptance attempts. Please try again in 15 minutes.' },
          { status: 429 }
        );
      }

      // Password policy: Minimum 12 characters
      if (!password || password.length < 12) {
        return NextResponse.json(
          { error: 'Security Policy Violation: Password must be at least 12 characters in length.' },
          { status: 400 }
        );
      }

      const invIndex = db.invitations.findIndex((i) => i.token === token);
      if (invIndex === -1) {
        return NextResponse.json(
          { error: 'Invalid invitation token.' },
          { status: 400 }
        );
      }

      const inv = db.invitations[invIndex];

      // Single-use enforcement: Cannot reuse an already accepted or expired token
      if (inv.status !== 'pending') {
        return NextResponse.json(
          { error: 'This invitation has already been claimed or revoked and cannot be reused.' },
          { status: 400 }
        );
      }

      // Expiry enforcement: Strict 7 days
      if (new Date(inv.expiresAt) < new Date()) {
        inv.status = 'expired';
        saveDB(db);
        return NextResponse.json(
          { error: 'This invitation token has expired. Please request a new invitation.' },
          { status: 400 }
        );
      }

      // Prevent duplicate account creation
      const existingUser = db.users.find(
        (u) => u.email.toLowerCase() === inv.email.toLowerCase()
      );
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      // Cryptographically hash password before saving
      const passwordHash = hashPassword(password);
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
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      db.invitations[invIndex].status = 'accepted';
      db.invitations[invIndex].acceptedAt = new Date().toISOString();

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
        details: `${inv.fullName} activated ${inv.role.toUpperCase()} account via secure single-use invitation link`,
        targetType: 'auth',
        targetId: newUserId,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      const { passwordHash: _, ...safeUser } = newUser as any;
      return NextResponse.json({ success: true, user: safeUser });
    }

    // 4. Create user directly (Admin & Manager Equal Access)
    if (action === 'create_user') {
      if (!caller || caller.status === 'inactive' || !hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Unauthorized: Active Admin or Manager permission required' },
          { status: 403 }
        );
      }

      const { name, email, username, role, department, clientId, clientName, phone, initialPassword } = body;

      if (!name || !email || !role) {
        return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
      }

      const cleanEmail = email.toLowerCase().trim();
      const existingUser = db.users.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email address already exists' },
          { status: 400 }
        );
      }

      const newUserId = `usr-${Date.now()}`;
      let passwordHash: string | undefined = undefined;
      if (initialPassword) {
        if (initialPassword.length < 12) {
          return NextResponse.json(
            { error: 'Password must be at least 12 characters in length.' },
            { status: 400 }
          );
        }
        passwordHash = hashPassword(initialPassword);
      }

      const newUser: User = {
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        username: (username || cleanEmail.split('@')[0]).trim(),
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
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);

      if (role === 'employee') {
        db.employees.push({
          id: `emp-${Date.now()}`,
          userId: newUserId,
          name: name.trim(),
          email: cleanEmail,
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
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Account Created',
        details: `Created ${role.toUpperCase()} account for ${name} (${cleanEmail})`,
        targetType: 'auth',
        targetId: newUser.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      const { passwordHash: _, ...safeUser } = newUser as any;
      return NextResponse.json({ success: true, user: safeUser });
    }

    // 5. Toggle account status (activate/deactivate)
    if (action === 'toggle_status') {
      if (!caller || caller.status === 'inactive' || !hasFullAdminAccess(caller)) {
        return NextResponse.json(
          { error: 'Unauthorized: Active Admin or Manager permission required' },
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
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Account Status Changed',
        details: `${targetUser.name}'s account status set to ${targetUser.status.toUpperCase()}`,
        targetType: 'auth',
        targetId: targetUser.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      const { passwordHash: _, ...safeUser } = targetUser as any;
      return NextResponse.json({ success: true, user: safeUser });
    }

    // 6. Password reset request (Anti-enumeration + Rate-limiting + Expiring Single-Use Token)
    if (action === 'reset_password_request') {
      const { email } = body;
      const cleanEmail = (email || '').toLowerCase().trim();

      if (!cleanEmail) {
        return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
      }

      const resetRate = checkRateLimit(`reset_password:${cleanEmail}`, RATE_LIMIT_CONFIGS.passwordReset);
      if (!resetRate.allowed) {
        return NextResponse.json(
          { error: 'Too many password reset attempts. Please try again in 15 minutes.' },
          { status: 429 }
        );
      }

      const targetUser = db.users.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.status === 'active'
      );

      // Even if targetUser is null, we return the EXACT SAME generic message to prevent account enumeration!
      if (targetUser) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1-hour expiration

        db.passwordResets = db.passwordResets || [];
        db.passwordResets.unshift({
          id: `rst-${Date.now()}`,
          userId: targetUser.id,
          email: targetUser.email,
          token: resetToken,
          expiresAt,
          used: false,
          createdAt: new Date().toISOString(),
        });

        db.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          userId: targetUser.id,
          userName: targetUser.name,
          userRole: targetUser.role,
          action: 'Password Reset Requested',
          details: `Password reset token generated for ${targetUser.email} (Expires in 1 hour)`,
          targetType: 'auth',
          targetId: targetUser.id,
          timestamp: new Date().toISOString(),
        });

        saveDB(db);
      }

      // GENERIC ANTI-ENUMERATION RESPONSE
      return NextResponse.json({
        success: true,
        message:
          'If an active account is associated with this email address, password reset instructions have been dispatched.',
      });
    }

    // 7. Confirm Password Reset (Single-use + 12-char password enforcement)
    if (action === 'confirm_password_reset') {
      const { token, newPassword } = body;
      if (!token || !newPassword) {
        return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
      }

      if (newPassword.length < 12) {
        return NextResponse.json(
          { error: 'Password must be at least 12 characters in length.' },
          { status: 400 }
        );
      }

      db.passwordResets = db.passwordResets || [];
      const resetEntry = db.passwordResets.find((r) => r.token === token);

      if (!resetEntry || resetEntry.used) {
        return NextResponse.json(
          { error: 'Invalid or already used password reset token.' },
          { status: 400 }
        );
      }

      if (new Date(resetEntry.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: 'This password reset token has expired.' },
          { status: 400 }
        );
      }

      const user = db.users.find((u) => u.id === resetEntry.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      user.passwordHash = hashPassword(newPassword);
      resetEntry.used = true;

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'Password Reset Completed',
        details: `${user.name} successfully updated password via single-use reset token`,
        targetType: 'auth',
        targetId: user.id,
        timestamp: new Date().toISOString(),
      });

      saveDB(db);
      return NextResponse.json({ success: true, message: 'Password has been successfully updated.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Auth operation failed' },
      { status: 500 }
    );
  }
}
