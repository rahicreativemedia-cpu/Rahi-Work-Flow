import crypto from 'crypto';
import { getDB, saveDB } from './db';
import { User, UserSession } from './types';

export const SESSION_COOKIE_NAME = 'flowdesk_session';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Creates a cryptographically random session token and stores it in db.sessions
 */
export function createSession(user: User): UserSession {
  const db = getDB();
  if (!db.sessions) {
    db.sessions = [];
  }

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

  db.sessions.unshift(newSession);
  saveDB(db);

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
 * Resolves the authenticated user from:
 * 1. HttpOnly Cookie: flowdesk_session
 * 2. Authorization Header: Bearer <token>
 * 3. Fallback X-User-Id / query parameter / body callerUserId (development mode fallback only)
 *
 * Enforces:
 * - Session expiration
 * - User existence
 * - Server-side account deactivation check (status !== 'inactive')
 */
export function getAuthenticatedUser(
  request: Request,
  explicitUserId?: string | null
): { user: User | null; isCryptographicSession: boolean; error?: string; status?: number } {
  const db = getDB();

  // 1. Check HttpOnly Cookie
  const cookieHeader = request.headers.get('cookie');
  const cookieToken = extractSessionTokenFromCookie(cookieHeader);

  // 2. Check Authorization Bearer Header
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  const sessionToken = cookieToken || bearerToken;

  if (sessionToken && db.sessions) {
    const session = db.sessions.find((s) => s.token === sessionToken);
    if (!session) {
      return { user: null, isCryptographicSession: false, error: 'Invalid or revoked session', status: 401 };
    }

    // Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return { user: null, isCryptographicSession: false, error: 'Session has expired', status: 401 };
    }

    const user = db.users.find((u) => u.id === session.userId);
    if (!user) {
      return { user: null, isCryptographicSession: false, error: 'User associated with session not found', status: 401 };
    }

    if (user.status === 'inactive') {
      return { user: null, isCryptographicSession: false, error: 'Account is deactivated', status: 403 };
    }

    return { user, isCryptographicSession: true };
  }

  // 3. Fallback for development / backwards compatibility ONLY
  // In production mode (or whenever ALLOW_INSECURE_DEV_AUTH !== 'true'), unauthenticated candidateUserId is strictly rejected!
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

  const user = db.users.find((u) => u.id === candidateUserId);
  if (!user) {
    return { user: null, isCryptographicSession: false, error: 'User not found', status: 401 };
  }

  if (user.status === 'inactive') {
    return { user: null, isCryptographicSession: false, error: 'Account is deactivated', status: 403 };
  }

  return { user, isCryptographicSession: false };
}

/**
 * Returns formatted Set-Cookie header for session creation
 */
export function formatSessionSetCookie(token: string): string {
  // HttpOnly, SameSite=Lax, Path=/, 7 days lifetime
  const maxAge = Math.floor(SESSION_DURATION_MS / 1000);
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
}

/**
 * Returns formatted Set-Cookie header to clear session
 */
export function formatSessionClearCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`;
}
