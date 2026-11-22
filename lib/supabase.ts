/**
 * RAHI FLOWDESK — SUPABASE AUTHENTICATION & ROW LEVEL SECURITY (RLS) BRIDGE
 *
 * This module defines the architectural bridge between:
 * 1. Flowdesk Session Cookie (`flowdesk_session`)
 * 2. Server-side session verification via `getAuthenticatedUser()`
 * 3. Supabase Client Initialization (Anon vs Service-Role vs Scoped User Client)
 * 4. PostgreSQL JWT Claims Propagation and RLS Policy Enforcement
 */

import crypto from 'crypto';
import { User } from './types';

export interface FlowdeskJWTClaims {
  sub: string;
  aud: 'authenticated';
  role: 'authenticated';
  flowdesk_role: string;
  flowdesk_permission_group: string;
  flowdesk_client_id: string;
  flowdesk_employee_id: string;
  iat: number;
  exp: number;
}

/**
 * Validates that private service-role keys are NEVER exposed to browser client environments.
 */
function assertServerEnvironment(operation: string): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      `CRITICAL SECURITY VIOLATION: ${operation} was attempted in a browser environment. Service-role keys must NEVER be exposed to frontend code.`
    );
  }
}

/**
 * Returns configuration status of Supabase environment variables
 */
export function getSupabaseConfigStatus(): {
  isConfigured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  hasJwtSecret: boolean;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const jwtSecret = process.env.SUPABASE_JWT_SECRET || '';

  const hasUrl = Boolean(url && !url.includes('your-project-ref'));
  const hasAnonKey = Boolean(anonKey && !anonKey.includes('PUBLIC_ANON_KEY'));
  const hasServiceRoleKey = Boolean(serviceKey && !serviceKey.includes('PRIVATE_SERVICE_ROLE_KEY'));
  const hasJwtSecret = Boolean(jwtSecret && !jwtSecret.includes('YOUR_SUPABASE_JWT_SECRET'));

  return {
    isConfigured: hasUrl && hasAnonKey && hasServiceRoleKey && hasJwtSecret,
    hasUrl,
    hasAnonKey,
    hasServiceRoleKey,
    hasJwtSecret,
  };
}

/**
 * Creates an HMAC-SHA256 signed JWT containing verified server-side claims
 * for PostgreSQL Row Level Security (RLS) enforcement.
 *
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * - Claims are NEVER accepted from client HTTP request headers or cookies.
 * - Claims are derived STRICTLY from the server-verified User record in the database.
 * - This token is passed to PostgreSQL to populate `request.jwt.claims`.
 */
export function mintScopedUserJWT(user: User, secret: string, expiresInSeconds = 3600): string {
  assertServerEnvironment('mintScopedUserJWT');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };

  const claims: FlowdeskJWTClaims = {
    sub: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    flowdesk_role: user.role,
    flowdesk_permission_group: user.permissionGroup,
    flowdesk_client_id: user.clientId || '',
    flowdesk_employee_id: user.employeeId || '',
    iat: now,
    exp: now + expiresInSeconds,
  };

  const base64UrlEncode = (obj: any): string =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(claims);
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

/**
 * ARCHITECTURAL SPECIFICATION: SERVICE ROLE VS RLS ENFORCEMENT
 *
 * In PostgreSQL, connecting with the Supabase `service_role` key grants the
 * `service_role` database user, which has the `BYPASSRLS` attribute enabled by default.
 *
 * Therefore:
 * 1. IF using the Service-Role Key directly:
 *    - Row Level Security (RLS) policies are BYPASSED by the PostgreSQL engine.
 *    - Authorization MUST be enforced 100% server-side in the Next.js API route handlers
 *      (e.g., via `hasFullAdminAccess(user)`, `canAccessClientData(user, clientId)`).
 *    - All mutations and queries MUST be explicitly scoped with WHERE clauses on the server.
 *
 * 2. IF using the Scoped User JWT Client:
 *    - The connection authenticates as the `authenticated` role with verified JWT claims.
 *    - PostgreSQL actively executes all RLS policies defined in `20261122000001_rahi_flowdesk_production_schema.sql`.
 *    - Client isolation and employee boundary checks are enforced in the database kernel.
 */
export function getDatabaseAuthorizationStrategy(): {
  mode: 'JSON_DEVELOPMENT' | 'SERVICE_ROLE_GATEWAY' | 'JWT_SCOPED_RLS';
  description: string;
} {
  const config = getSupabaseConfigStatus();
  if (!config.isConfigured) {
    return {
      mode: 'JSON_DEVELOPMENT',
      description:
        'Development Atomic JSON Database (data/db.json). Authorization is enforced server-side in Next.js API route handlers.',
    };
  }

  return {
    mode: 'JWT_SCOPED_RLS',
    description:
      'Supabase PostgreSQL with Scoped User JWT Claims. Authorization is enforced dual-layer: server-side in API handlers AND at database level via PostgreSQL Row Level Security (RLS).',
  };
}
