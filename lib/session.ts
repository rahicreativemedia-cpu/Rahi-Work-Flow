import crypto from 'crypto';
import { getSessionByToken, createSessionRecord, getUserById } from './db';
import { User, UserSession } from './types';

export const SESSION_COOKIE_NAME = 'flowdesk_session';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Creates a cryptographically random session token and stores it in Supabase PostgreSQL sessions table.
 */
export async function createSession(user: User): Promise<UserSession> {
  // 64-character hexadecimal cryptographically secure token
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS).toISOString();

  const newSession: UserSession = {
    id: `sess-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    token,
    userId: user.id,
    role: user.role,
    permissionGroup: user.permissionGroup,
    clientId: user.clientId,
    createdAt: now.toISOString(),
    expiresAt,
  };

  await createSessionRecord(newSession);
  return newSession;
}

/**
 * Parses cookie string to extract flowdesk_session token
 */
export function extractSessionTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Resolves the authenticated user directly from Supabase PostgreSQL:
 * 1. HttpOnly Cookie: flowdesk_session
 * 2. Authorization Header: Bearer <token>
 * 3. Fallback candidateUserId (development mode fallback only)
 *
 * Enforces:
 * - Session expiration
 * - User existence in Supabase
 * - Server-side account deactivation check (status !== 'inactive')
 */
export async function getAuthenticatedUser(
  request: Request,
  explicitUserId?: string | null
): Promise<{ user: User | null; isCryptographicSession: boolean; error?: string; status?: number }> {
  // 1. Check HttpOnly Cookie
  const cookieHeader = request.headers.get('cookie');
  const cookieToken = extractSessionTokenFromCookie(cookieHeader);

  // 2. Check Authorization Bearer Header
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  const sessionToken = cookieToken || bearerToken;

  if (sessionToken) {
    try {
      const session = await getSessionByToken(sessionToken);
      if (!session) {
        return { user: null, isCryptographicSession: false, error: 'Invalid or revoked session', status: 401 };
      }

      // Check expiration
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        return { user: null, isCryptographicSession: false, error: 'Session has expired', status: 401 };
      }

      const user = await getUserById(session.userId);
      if (!user) {
        return { user: null, isCryptographicSession: false, error: 'User associated with session not found', status: 401 };
      }

      if (user.status === 'inactive') {
        return { user: null, isCryptographicSession: false, error: 'Account is deactivated', status: 403 };
      }

      return { user, isCryptographicSession: true };
    } catch (err: any) {
      console.error('Session authentication error:', err);
      return { user: null, isCryptographicSession: false, error: 'Authentication database error', status: 500 };
    }
  }

  // 3. Fallback for development / backwards compatibility ONLY
  const isStrictProduction = process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_DEV_AUTH !== 'true';

  const headerUserId = request.headers.get('x-user-id');
  const url = new URL(request.url);
  const queryUserId = url.searchParams.get('userId');
  const candidateUserId = explicitUserId || headerUserId || queryUserId;

  if (isStrictProduction || !candidateUserId) {
    return {
      user: null,
      isCryptographicSession: false,
      error: 'Authentication required: Valid active session cookie or Bearer token is required',
      status: 401,
    };
  }

  try {
    const user = await getUserById(candidateUserId);
    if (!user) {
      return { user: null, isCryptographicSession: false, error: 'User not found', status: 401 };
    }

    if (user.status === 'inactive') {
      return { user: null, isCryptographicSession: false, error: 'Account is deactivated', status: 403 };
    }

    return { user, isCryptographicSession: false };
  } catch (err: any) {
    return { user: null, isCryptographicSession: false, error: 'User resolution database error', status: 500 };
  }
}

/**
 * Returns formatted Set-Cookie header for session creation
 */
export function formatSessionSetCookie(token: string): string {
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
}

/**
 * Returns formatted Set-Cookie header to clear session
 */
export function formatSessionClearCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`;
}
