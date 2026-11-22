import { getDB, saveDB } from './db';

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
 * Extracts client IP address safely from standard proxy headers
 */
export function getClientIp(request: Request): string {
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
  const db = getDB() as any;
  if (!db.rateLimits) return { locked: false, retryAfterSeconds: 0 };
  const record: RateLimitRecord | undefined = db.rateLimits.find((r: RateLimitRecord) => r.key === key);
  if (!record || !record.timestamps || record.timestamps.length === 0) {
    return { locked: false, retryAfterSeconds: 0 };
  }
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const activeTimestamps = record.timestamps.filter((t: number) => t > windowStart);
  if (activeTimestamps.length >= config.maxAttempts) {
    const oldest = activeTimestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + config.windowMs - now) / 1000));
    return { locked: true, retryAfterSeconds };
  }
  return { locked: false, retryAfterSeconds: 0 };
}

/**
 * Persistent Rate Limiter.
 * Uses atomic state in db.rateLimits to ensure persistence across server restarts
 * and provide the blueprint for the PostgreSQL / Redis distributed rate-limiting table.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const db = getDB() as any;
  if (!db.rateLimits) {
    db.rateLimits = [];
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;

  let record: RateLimitRecord | undefined = db.rateLimits.find((r: RateLimitRecord) => r.key === key);

  if (!record) {
    record = {
      key,
      timestamps: [],
      updatedAt: new Date(now).toISOString(),
    };
    db.rateLimits.push(record);
  }

  // Filter timestamps within the active sliding window
  const activeTimestamps = record.timestamps.filter((t: number) => t > windowStart);
  record.timestamps = activeTimestamps;

  if (activeTimestamps.length >= config.maxAttempts) {
    const oldestTimestamp = activeTimestamps[0];
    const retryAfterMs = oldestTimestamp + config.windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // Record this attempt
  activeTimestamps.push(now);
  record.timestamps = activeTimestamps;
  record.updatedAt = new Date(now).toISOString();
  saveDB(db);

  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - activeTimestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Resets / clears rate limit counter (e.g. after successful login)
 */
export function clearRateLimit(key: string): void {
  const db = getDB() as any;
  if (!db.rateLimits) return;
  const index = db.rateLimits.findIndex((r: RateLimitRecord) => r.key === key);
  if (index !== -1) {
    db.rateLimits.splice(index, 1);
    saveDB(db);
  }
}
