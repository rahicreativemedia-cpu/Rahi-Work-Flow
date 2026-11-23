export interface RateLimitRecord {
  key: string;
  timestamps: number[];
  updatedAt: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
}

export const RATE_LIMIT_CONFIGS = {
  loginFailed: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,           // 5 failed password attempts before lockout
  },
  passwordReset: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 3,           // 3 password reset requests per 15 minutes
  },
  invitationAccept: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,           // 5 token submission attempts per 15 minutes
  },
  apiMutate: {
    windowMs: 60 * 1000,      // 1 minute
    maxAttempts: 60,          // 60 mutations per minute
  },
} as const;

/**
 * In-memory sliding window rate limiter cache (zero filesystem dependency).
 * Works reliably in Cloudflare Workers and serverless Node runtimes.
 */
const rateLimitMemoryMap = new Map<string, number[]>();

/**
 * Extracts client IP address safely from standard proxy headers
 */
export function getClientIp(request: Request): string {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Checks whether an action is currently locked without recording an attempt
 */
export function isRateLimitLocked(
  key: string,
  config: RateLimitConfig
): { locked: boolean; retryAfterSeconds: number } {
  const timestamps = rateLimitMemoryMap.get(key);
  if (!timestamps || timestamps.length === 0) {
    return { locked: false, retryAfterSeconds: 0 };
  }
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const activeTimestamps = timestamps.filter((t) => t > windowStart);
  if (activeTimestamps.length >= config.maxAttempts) {
    const oldest = activeTimestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + config.windowMs - now) / 1000));
    return { locked: true, retryAfterSeconds };
  }
  return { locked: false, retryAfterSeconds: 0 };
}

/**
 * Checks and records an attempt in the sliding window limiter
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let timestamps = rateLimitMemoryMap.get(key) || [];
  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= config.maxAttempts) {
    const oldestTimestamp = timestamps[0];
    const retryAfterMs = oldestTimestamp + config.windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // Record this attempt
  timestamps.push(now);
  rateLimitMemoryMap.set(key, timestamps);

  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - timestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Resets / clears rate limit counter (e.g. after successful login)
 */
export function clearRateLimit(key: string): void {
  rateLimitMemoryMap.delete(key);
}
