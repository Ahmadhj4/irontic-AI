/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for single-instance portal deployments.
 * Phase 2: swap the Map backing store for Redis (ioredis) to support
 * horizontally-scaled deployments without shared-state issues.
 *
 * OWASP API Security Top 10 — API4:2023 Unrestricted Resource Consumption
 */

interface WindowEntry {
  tokens: number;
  resetAt: number; // epoch ms
}

// Keyed by `${limiterId}:${clientKey}`
const store = new Map<string, WindowEntry>();

// Evict expired windows every 5 minutes to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60_000).unref(); // .unref() so this timer doesn't block process exit

export interface RateLimitConfig {
  /** Unique name for this limiter — used as the store key prefix. */
  id: string;
  /** Maximum requests allowed within the window. */
  max: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

/**
 * Check and consume one token for a client key.
 * Thread-safe for a single Node.js process (event loop is single-threaded).
 */
export function checkRateLimit(
  config: RateLimitConfig,
  clientKey: string,
): RateLimitResult {
  const key = `${config.id}:${clientKey}`;
  const now = Date.now();

  let entry = store.get(key);

  // Initialise or reset an expired window
  if (!entry || entry.resetAt <= now) {
    entry = { tokens: config.max, resetAt: now + config.windowMs };
    store.set(key, entry);
  }

  if (entry.tokens <= 0) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.tokens -= 1;
  return { allowed: true, remaining: entry.tokens, resetAt: entry.resetAt };
}

/**
 * Extract the real client IP from request headers.
 * Checks x-forwarded-for (set by reverse proxies / load balancers) then
 * x-real-ip (nginx). Falls back to "unknown" — never throws.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for is comma-separated; the first entry is the original client.
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Build standard rate-limit response headers.
 * Follows IETF draft-ietf-httpapi-ratelimit-headers.
 */
export function rateLimitHeaders(
  result: RateLimitResult,
  config: RateLimitConfig,
): Record<string, string> {
  return {
    'X-RateLimit-Limit':     String(config.max),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset':     String(Math.ceil(result.resetAt / 1000)), // Unix seconds
    ...(result.allowed
      ? {}
      : { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
  };
}

// ── Pre-configured limiters ────────────────────────────────────────────────

/** Login: 10 attempts per IP per 15 minutes (brute-force protection). */
export const LOGIN_LIMITER: RateLimitConfig = {
  id: 'login', max: 10, windowMs: 15 * 60_000,
};

/** Standard read endpoints: 120 requests per user per minute. */
export const READ_LIMITER: RateLimitConfig = {
  id: 'api-read', max: 120, windowMs: 60_000,
};

/** Write endpoints (POST/PATCH/DELETE): 60 requests per user per minute. */
export const WRITE_LIMITER: RateLimitConfig = {
  id: 'api-write', max: 60, windowMs: 60_000,
};

/** High-cost operations (scan, report generation): 5 per user per minute. */
export const COSTLY_LIMITER: RateLimitConfig = {
  id: 'api-costly', max: 5, windowMs: 60_000,
};
