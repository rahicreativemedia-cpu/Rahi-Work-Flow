import { NextResponse } from 'next/server';

export const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
} as const;

/**
 * Returns a private JSON response protected from CDN / proxy caching.
 */
export function privateJsonResponse<T extends Record<string, any>>(
  body: T,
  init?: ResponseInit
): NextResponse<T> {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

/**
 * Sanitizes errors to never leak internal SQL, credentials or stack traces to clients.
 */
export function privateErrorResponse(
  message: string,
  status: number = 400,
  internalError?: any
): NextResponse<{ error: string }> {
  // Let Next.js handle dynamic prerender bailout natively
  if (
    internalError &&
    (internalError.digest === 'DYNAMIC_SERVER_USAGE' ||
      internalError.message?.includes('bail out of prerendering'))
  ) {
    throw internalError;
  }

  if (internalError) {
    console.error(`[API ERROR ${status}] ${message}:`, internalError?.message || internalError);
  }

  return privateJsonResponse(
    { error: message },
    { status }
  );
}
