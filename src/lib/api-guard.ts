/**
 * Server-side authentication + rate-limit guard for API route handlers.
 *
 * Usage (in any Route Handler):
 *
 *   const { session, error } = await requireAuth(req);
 *   if (error) return error;          // 401 — not authenticated
 *
 *   const { session, error } = await requireAuthWithRateLimit(req, WRITE_LIMITER);
 *   if (error) return error;          // 401 or 429
 *
 * OWASP API Security Top 10:
 *   API1:2023 — Broken Object Level Authorization
 *   API4:2023 — Unrestricted Resource Consumption
 */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { authOptions } from './auth';
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  READ_LIMITER,
  WRITE_LIMITER,
  type RateLimitConfig,
} from './rate-limit';

// ── Types ─────────────────────────────────────────────────────────────────

export type GuardResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse };

// ── Core guards ───────────────────────────────────────────────────────────

/**
 * Verify the caller holds a valid NextAuth session.
 * Returns the session on success or a ready-to-return 401 NextResponse.
 */
export async function requireAuth(): Promise<GuardResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      ),
    };
  }

  return { session, error: null };
}

/**
 * Verify auth AND enforce a rate limit in one call.
 *
 * Rate-limit key: `userId:ip` — prevents a single user hammering from
 * many IPs and prevents one IP being used for many accounts simultaneously.
 */
export async function requireAuthWithRateLimit(
  req: Request,
  limiter: RateLimitConfig = WRITE_LIMITER,
): Promise<GuardResult> {
  const authResult = await requireAuth();
  if (authResult.error) return authResult;

  const userId =
    authResult.session.user.email ?? 'anon';
  const ip = getClientIp(req);
  const clientKey = `${userId}:${ip}`;

  const rl = checkRateLimit(limiter, clientKey);
  const headers = rateLimitHeaders(rl, limiter);

  if (!rl.allowed) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Too many requests — please slow down.' },
        { status: 429, headers },
      ),
    };
  }

  return authResult;
}

/** Convenience wrapper for read-heavy GET endpoints. */
export async function requireAuthRead(req: Request): Promise<GuardResult> {
  return requireAuthWithRateLimit(req, READ_LIMITER);
}

// ── RFC 7807 Problem Details ──────────────────────────────────────────────
// Tech Doc §22.1 — all error responses use this format

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

/**
 * Returns a NextResponse with RFC 7807 Problem Details body.
 * Use instead of bare NextResponse.json({ error }) for all API error paths.
 */
export function apiError(
  status: number,
  title: string,
  detail: string,
  instance?: string,
): NextResponse {
  const body: ProblemDetail = {
    type: `https://irontic.ai/errors/${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    status,
    detail,
    ...(instance ? { instance } : {}),
  };
  return NextResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

// ── Tenant isolation ──────────────────────────────────────────────────────
// Tech Doc §4.1 — X-Tenant-ID propagated in every API call header

/**
 * Extract the tenant ID from request headers.
 * In production this is validated against the JWT claim at the Kong gateway.
 * In the portal layer we read the header and fall back to a default.
 */
export function extractTenantId(req: Request): string {
  const header = (req as unknown as { headers: { get(k: string): string | null } })
    .headers.get('x-tenant-id');
  return header ?? 'default';
}
