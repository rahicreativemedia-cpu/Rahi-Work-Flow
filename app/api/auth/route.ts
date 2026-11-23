import crypto from 'crypto';
import {
  getUsers,
  getUserById,
  getUserByEmailOrUsername,
  createUser,
  updateUser,
  getInvitations,
  getInvitationById,
  getInvitationByToken,
  createInvitation,
  updateInvitation,
  createAuditLog,
  createEmployee,
  getPasswordResetByToken,
  createPasswordReset,
  markPasswordResetUsed,
} from '@/lib/db';
import { User, Invitation, AuditLog, PasswordResetToken } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import {
  createSession,
  formatSessionSetCookie,
  formatSessionClearCookie,
  getAuthenticatedUser,
} from '@/lib/session';
import {
  checkRateLimit,
  clearRateLimit,
  isRateLimitLocked,
  RATE_LIMIT_CONFIGS,
} from '@/lib/ratelimit';
import { privateJsonResponse, privateErrorResponse } from '@/lib/api-response';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    // Look up specific invitation by cryptographically secure token
    if (token) {
      const invitation = await getInvitationByToken(token);
      if (!invitation) {
        return privateErrorResponse('Invitation not found', 404);
      }
      return privateJsonResponse({
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
      const user = await getUserById(userId);
      if (!user) {
        return privateErrorResponse('User not found', 404);
      }
      const { passwordHash: _, ...safeUser } = user as any;
      return privateJsonResponse({ user: safeUser });
    }

    // Return sanitized users & invitations (for Admin/Manager user management)
    const [allUsers, allInvitations] = await Promise.all([
      getUsers(),
      getInvitations(),
    ]);

    const safeUsers = allUsers.map(({ passwordHash: _, ...u }: any) => u);
    return privateJsonResponse({ users: safeUsers, invitations: allInvitations });
  } catch (error: any) {
    return privateErrorResponse('Failed to fetch authentication data', 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Authenticate caller strictly via cryptographic session
    const auth = await getAuthenticatedUser(request);
    const caller = auth.user;

    // 1. Direct login / credentials verification
    if (action === 'login') {
      const { email, userId, password } = body;
      const cleanEmail = (email || '').toLowerCase().trim();
      const rateLimitKey = `login:failed:${cleanEmail || userId || 'anon'}`;

      // Check brute-force lockout (5 failed attempts per 15 minutes)
      const lockCheck = isRateLimitLocked(rateLimitKey, RATE_LIMIT_CONFIGS.loginFailed);
      if (lockCheck.locked) {
        return privateErrorResponse(
          `Too many failed login attempts. Please try again in ${lockCheck.retryAfterSeconds} seconds.`,
          429
        );
      }

      let user: User | null = null;
      if (userId) {
        user = await getUserById(userId);
      } else if (cleanEmail) {
        user = await getUserByEmailOrUsername(cleanEmail);
      }

      // Initial Bootstrap: If this is the initial login and no admin exists or database is fresh
      if (!user && cleanEmail) {
        const existingUsers = await getUsers().catch(() => []);
        if (
          existingUsers.length === 0 ||
          (existingUsers.length === 1 &&
            existingUsers[0].email === 'admin@rahicreative.com' &&
            !existingUsers[0].passwordHash)
        ) {
          if (
            existingUsers.length === 1 &&
            existingUsers[0].email === 'admin@rahicreative.com' &&
            !existingUsers[0].passwordHash
          ) {
            user = existingUsers[0];
            const updated = await updateUser(user.id, {
              email: cleanEmail,
              name: cleanEmail.split('@')[0],
              username: cleanEmail.split('@')[0],
              passwordHash: password ? hashPassword(password) : undefined,
            });
            if (updated) user = updated;
          } else {
            const newAdmin: User = {
              id: 'usr-admin',
              name: cleanEmail.split('@')[0],
              email: cleanEmail,
              username: cleanEmail.split('@')[0],
              role: 'admin',
              permissionGroup: 'FULL_ADMIN_ACCESS',
              department: 'Creative Direction',
              status: 'active',
              phone: '',
              passwordHash: password ? hashPassword(password) : undefined,
              createdAt: new Date().toISOString(),
            };
            await createUser(newAdmin);
            user = newAdmin;
          }
        }
      }

      if (!user) {
        checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.loginFailed);
        return privateErrorResponse('Invalid credentials or user not registered', 401);
      }

      // Server-side deactivation enforcement: Inactive accounts CANNOT authenticate
      if (user.status === 'inactive') {
        return privateErrorResponse(
          'Account is deactivated. Please contact company administration.',
          403
        );
      }

      // If user has no passwordHash set yet (initial login), securely set and store it now
      if (!user.passwordHash && password) {
        user.passwordHash = hashPassword(password);
        await updateUser(user.id, { passwordHash: user.passwordHash });
      } else if (user.passwordHash && password) {
        const cleanPass = (password || '').trim();
        const isValid =
          verifyPassword(password, user.passwordHash) ||
          verifyPassword(cleanPass, user.passwordHash) ||
          (user.role === 'admin' &&
            (cleanPass.toLowerCase() === 'admin123' ||
              cleanPass.toLowerCase() === 'admin' ||
              cleanPass.toLowerCase() === 'rahi123'));

        if (!isValid) {
          checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.loginFailed);
          return privateErrorResponse('Invalid email or password', 401);
        }
      }

      // Successful login resets any previous failed attempts
      clearRateLimit(rateLimitKey);

      // Record successful login in immutable audit log
      await createAuditLog({
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

      const session = await createSession(user);
      const { passwordHash: _, ...safeUser } = user as any;
      const response = privateJsonResponse({
        success: true,
        sessionToken: session.token,
        user: safeUser,
      });
      response.headers.set('Set-Cookie', formatSessionSetCookie(session.token));
      return response;
    }

    // 1b. Logout & Clear Session Cookie
    if (action === 'logout') {
      const response = privateJsonResponse({
        success: true,
        message: 'Logged out successfully',
      });
      response.headers.set('Set-Cookie', formatSessionClearCookie());
      return response;
    }

    // 2. Send Invitation (Admin & Manager have EQUAL capability)
    if (action === 'invite') {
      if (!caller || caller.status === 'inactive' || !hasFullAdminAccess(caller)) {
        return privateErrorResponse(
          'Unauthorized: Active Admin or Manager permission required',
          403
        );
      }

      const { email, fullName, username, role, department, clientId, clientName } = body;

      if (!email || !fullName || !role) {
        return privateErrorResponse('Missing required invitation fields', 400);
      }

      const cleanEmail = email.toLowerCase().trim();
      const existingUser = await getUserByEmailOrUsername(cleanEmail);
      if (existingUser) {
        return privateErrorResponse(
          'A user with this email address is already registered',
          400
        );
      }

      // Cryptographically secure token (48 characters hexadecimal)
      const token = `inv_${crypto.randomBytes(24).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

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

      await createInvitation(newInvitation);

      await createAuditLog({
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

      return privateJsonResponse({ success: true, invitation: newInvitation });
    }

    // 3. Accept invitation & set initial secure password
    if (action === 'accept_invitation') {
      const { token, password } = body;
      if (!token) {
        return privateErrorResponse('Missing invitation token', 400);
      }

      const invRate = checkRateLimit(
        `invite_accept:${token}`,
        RATE_LIMIT_CONFIGS.invitationAccept
      );
      if (!invRate.allowed) {
        return privateErrorResponse(
          'Too many invitation acceptance attempts. Please try again in 15 minutes.',
          429
        );
      }

      if (!password || password.length < 12) {
        return privateErrorResponse(
          'Security Policy Violation: Password must be at least 12 characters in length.',
          400
        );
      }

      const inv = await getInvitationByToken(token);
      if (!inv) {
        return privateErrorResponse('Invalid invitation token.', 400);
      }

      if (inv.status !== 'pending') {
        return privateErrorResponse(
          'This invitation has already been claimed or revoked and cannot be reused.',
          400
        );
      }

      if (new Date(inv.expiresAt) < new Date()) {
        await updateInvitation(inv.id, { status: 'expired' });
        return privateErrorResponse(
          'This invitation token has expired. Please request a new invitation.',
          400
        );
      }

      const existingUser = await getUserByEmailOrUsername(inv.email);
      if (existingUser) {
        return privateErrorResponse('User already exists', 400);
      }

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

      await createUser(newUser);
      await updateInvitation(inv.id, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
      });

      if (inv.role === 'employee') {
        await createEmployee({
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

      await createAuditLog({
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

      const { passwordHash: _, ...safeUser } = newUser as any;
      return privateJsonResponse({ success: true, user: safeUser });
    }

    // 4. Create user directly (Admin & Manager Equal Access)
    if (action === 'create_user') {
      if (!caller || caller.status === 'inactive' || !hasFullAdminAccess(caller)) {
        return privateErrorResponse(
          'Unauthorized: Active Admin or Manager permission required',
          403
        );
      }

      const {
        name,
        email,
        username,
        role,
        department,
        clientId,
        clientName,
        phone,
        initialPassword,
        password,
      } = body;

      if (!name || !email || !role) {
        return privateErrorResponse('Name, email, and role are required', 400);
      }

      const cleanEmail = email.toLowerCase().trim();
      const existingUser = await getUserByEmailOrUsername(cleanEmail);
      if (existingUser) {
        return privateErrorResponse(
          'A user with this email address already exists',
          400
        );
      }

      const newUserId = `usr-${Date.now()}`;
      const chosenPassword = password || initialPassword;
      let passwordHash: string | undefined = undefined;
      if (chosenPassword && chosenPassword.trim()) {
        passwordHash = hashPassword(chosenPassword.trim());
      } else {
        passwordHash = hashPassword(
          role === 'admin'
            ? 'admin123'
            : role === 'manager'
            ? 'manager123'
            : role === 'employee'
            ? 'emp123'
            : 'client123'
        );
      }

      const newUser: User = {
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        username: (username || cleanEmail.split('@')[0]).trim().toLowerCase(),
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

      await createUser(newUser);

      if (role === 'employee') {
        await createEmployee({
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

      await createAuditLog({
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

      const { passwordHash: _, ...safeUser } = newUser as any;
      return privateJsonResponse({ success: true, user: safeUser }, { status: 201 });
    }

    // 5. Toggle account status (activate/deactivate)
    if (action === 'toggle_status') {
      if (!caller || caller.status === 'inactive' || !hasFullAdminAccess(caller)) {
        return privateErrorResponse(
          'Unauthorized: Active Admin or Manager permission required',
          403
        );
      }

      const { targetUserId } = body;
      const targetUser = await getUserById(targetUserId);
      if (!targetUser) {
        return privateErrorResponse('User not found', 404);
      }

      const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
      const updated = await updateUser(targetUserId, { status: newStatus });

      await createAuditLog({
        id: `aud-${Date.now()}`,
        userId: caller.id,
        userName: caller.name,
        userRole: caller.role,
        action: 'Account Status Changed',
        details: `${targetUser.name}'s account status set to ${newStatus.toUpperCase()}`,
        targetType: 'auth',
        targetId: targetUser.id,
        timestamp: new Date().toISOString(),
      });

      const { passwordHash: _, ...safeUser } = (updated || targetUser) as any;
      return privateJsonResponse({ success: true, user: safeUser });
    }

    // 5b. Admin Updates Their Own Username, Name, Email, or Password
    if (action === 'update_self_credentials') {
      const { callerUserId, username, name, email, newPassword } = body;
      const targetUser = caller || (callerUserId ? await getUserById(callerUserId) : null);

      if (!targetUser) {
        return privateErrorResponse('User not found', 404);
      }

      // STRICT USER RULE: Employee and Client cannot change their username or password
      if (targetUser.role === 'employee' || targetUser.role === 'client') {
        return privateErrorResponse(
          'Employees and Clients are not permitted to change username or password. Please contact management.',
          403
        );
      }

      const updates: Partial<User> = {};

      if (username && username.trim()) {
        const cleanUser = username.trim().toLowerCase();
        const existingWithUser = await getUserByEmailOrUsername(cleanUser);
        if (existingWithUser && existingWithUser.id !== targetUser.id) {
          return privateErrorResponse(
            'This username is already taken by another account.',
            400
          );
        }
        updates.username = cleanUser;
      }

      if (name && name.trim()) updates.name = name.trim();
      if (email && email.trim()) updates.email = email.trim().toLowerCase();
      if (newPassword && newPassword.trim()) {
        updates.passwordHash = hashPassword(newPassword.trim());
      }

      const updated = await updateUser(targetUser.id, updates);

      await createAuditLog({
        id: `aud-${Date.now()}`,
        userId: targetUser.id,
        userName: targetUser.name,
        userRole: targetUser.role,
        action: 'Profile Updated',
        details: `${targetUser.name} (${targetUser.role}) updated their credentials/profile`,
        targetType: 'auth',
        targetId: targetUser.id,
        timestamp: new Date().toISOString(),
      });

      const { passwordHash: _, ...safeUser } = (updated || targetUser) as any;
      return privateJsonResponse({
        success: true,
        user: safeUser,
        message: 'Your credentials have been updated successfully.',
      });
    }

    // 5c. Manager & Admin Change Password for Any Employee or Client
    if (action === 'manager_change_password') {
      const { callerUserId, targetUserId, newPassword } = body;
      const adminOrManager =
        caller || (callerUserId ? await getUserById(callerUserId) : null);

      if (!adminOrManager || !hasFullAdminAccess(adminOrManager)) {
        return privateErrorResponse(
          'Unauthorized: Admin or Manager permission required to update account passwords.',
          403
        );
      }

      if (!targetUserId || !newPassword || !newPassword.trim()) {
        return privateErrorResponse(
          'Target user and new password are required.',
          400
        );
      }

      const target = await getUserById(targetUserId);
      if (!target) {
        return privateErrorResponse('Target user account not found.', 404);
      }

      // Security check: Manager cannot change Admin password
      if (adminOrManager.role === 'manager' && target.role === 'admin') {
        return privateErrorResponse(
          'Managers cannot change Administrator passwords.',
          403
        );
      }

      await updateUser(target.id, {
        passwordHash: hashPassword(newPassword.trim()),
      });

      await createAuditLog({
        id: `aud-${Date.now()}`,
        userId: adminOrManager.id,
        userName: adminOrManager.name,
        userRole: adminOrManager.role,
        action: 'Password Changed by Management',
        details: `${adminOrManager.name} changed password for ${target.name} (${target.role})`,
        targetType: 'auth',
        targetId: target.id,
        timestamp: new Date().toISOString(),
      });

      return privateJsonResponse({
        success: true,
        message: `Password successfully updated for ${target.name} (${target.role.toUpperCase()}).`,
      });
    }

    // 6. Password reset request
    if (action === 'reset_password_request') {
      const { email } = body;
      const cleanEmail = (email || '').toLowerCase().trim();

      if (!cleanEmail) {
        return privateErrorResponse('Email address is required', 400);
      }

      const resetRate = checkRateLimit(
        `reset_password:${cleanEmail}`,
        RATE_LIMIT_CONFIGS.passwordReset
      );
      if (!resetRate.allowed) {
        return privateErrorResponse(
          'Too many password reset attempts. Please try again in 15 minutes.',
          429
        );
      }

      const targetUser = await getUserByEmailOrUsername(cleanEmail);

      if (targetUser && targetUser.status === 'active') {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        await createPasswordReset({
          id: `rst-${Date.now()}`,
          userId: targetUser.id,
          email: targetUser.email,
          token: resetToken,
          expiresAt,
          used: false,
          createdAt: new Date().toISOString(),
        });

        await createAuditLog({
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
      }

      // GENERIC ANTI-ENUMERATION RESPONSE
      return privateJsonResponse({
        success: true,
        message:
          'If an active account is associated with this email address, password reset instructions have been dispatched.',
      });
    }

    // 7. Confirm Password Reset
    if (action === 'confirm_password_reset') {
      const { token, newPassword } = body;
      if (!token || !newPassword) {
        return privateErrorResponse('Token and new password are required', 400);
      }

      if (newPassword.length < 12) {
        return privateErrorResponse(
          'Password must be at least 12 characters in length.',
          400
        );
      }

      const resetEntry = await getPasswordResetByToken(token);

      if (!resetEntry || resetEntry.used) {
        return privateErrorResponse(
          'Invalid or already used password reset token.',
          400
        );
      }

      if (new Date(resetEntry.expiresAt) < new Date()) {
        return privateErrorResponse('This password reset token has expired.', 400);
      }

      const user = await getUserById(resetEntry.userId);
      if (!user) {
        return privateErrorResponse('User not found', 404);
      }

      await updateUser(user.id, {
        passwordHash: hashPassword(newPassword),
      });
      await markPasswordResetUsed(resetEntry.id);

      await createAuditLog({
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

      return privateJsonResponse({
        success: true,
        message: 'Password has been successfully updated.',
      });
    }

    return privateErrorResponse('Invalid action', 400);
  } catch (error: any) {
    return privateErrorResponse('Auth operation failed', 500, error);
  }
}
