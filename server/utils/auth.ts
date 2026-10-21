import crypto from 'crypto';

/**
 * Secure password hashing using Node's native crypto.scryptSync with cryptographically random salt.
 * Formatted as: `${saltHex}:${derivedKeyHex}`
 */
export function hashPassword(password: string): string {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a candidate password against stored salt:hash format using timing-safe comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // Handle existing demo passwords if un-hashed
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }

  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;

  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    return false;
  }
}

/**
 * Generate cryptographically secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate secure password reset code / token
 */
export function generateResetToken(): { token: string; code: string } {
  const token = crypto.randomBytes(24).toString('hex');
  // 6-digit numeric verification code for quick mobile/SMS simulation
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return { token, code };
}

/**
 * Simple in-memory rate limiter for authentication endpoints to prevent brute force.
 */
interface RateLimitRecord {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 mins
): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now });
    return { allowed: true };
  }

  // Check if locked
  if (record.lockedUntil && now < record.lockedUntil) {
    const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  // Reset window if past windowMs
  if (now - record.lastAttempt > windowMs) {
    record.attempts = 1;
    record.lastAttempt = now;
    record.lockedUntil = undefined;
    return { allowed: true };
  }

  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts > maxAttempts) {
    record.lockedUntil = now + windowMs;
    const waitSeconds = Math.ceil(windowMs / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

export function resetRateLimit(identifier: string) {
  rateLimitStore.delete(identifier);
}
