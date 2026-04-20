import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitHeaders, LOGIN_LIMITER } from "@/lib/rate-limit";

const nextAuthHandler = NextAuth(authOptions);

/**
 * Wrap the NextAuth handler to rate-limit credential sign-in attempts.
 * Only the POST to /api/auth/callback/credentials is throttled — all
 * other NextAuth routes (session, providers, CSRF) pass through freely.
 *
 * OWASP A07:2021 — Identification & Authentication Failures (brute-force)
 */
async function handler(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  // Only throttle the credentials sign-in POST.
  const isCredentialSignIn =
    req.method === "POST" &&
    req.nextUrl.pathname.includes("/callback/credentials");

  if (isCredentialSignIn) {
    const ip = getClientIp(req);
    const rl = checkRateLimit(LOGIN_LIMITER, ip);
    const headers = rateLimitHeaders(rl, LOGIN_LIMITER);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait before trying again." },
        { status: 429, headers },
      );
    }
  }

  // Delegate to the standard NextAuth handler.
  return nextAuthHandler(req, context);
}

export { handler as GET, handler as POST };
