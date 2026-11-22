import crypto from 'crypto';

/**
 * Cryptographically secure password hashing using Node.js scrypt.
 * Uses a unique 16-byte random salt per password and 64-byte derived key.
 * Format: `${salt}:${derivedKey}`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Timing-safe password verification to prevent side-channel timing attacks.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure random token.
 */
export function generateSecureToken(prefix = '', byteLength = 32): string {
  const randomHex = crypto.randomBytes(byteLength).toString('hex');
  return prefix ? `${prefix}_${randomHex}` : randomHex;
}
