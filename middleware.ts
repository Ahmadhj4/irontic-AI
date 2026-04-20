import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Tech Doc §3.1 — Navigation Structure / §24.2 — RBAC Matrix
// Each entry: [path prefix, roles that MAY access it]
// Evaluated top-to-bottom; first match wins.
const ROUTE_RULES: [string, string[]][] = [
  // Root "/" — let all authenticated roles through; page.tsx redirects to /login
  ["/",          ["admin", "security_engineer", "soc_lead", "soc", "grc_analyst", "pentester", "executive"]],
  ["/audit",     ["admin"]],
  ["/settings",  ["admin"]],
  ["/agents",    ["admin", "security_engineer"]],
  ["/av",        ["admin", "security_engineer"]],
  ["/pt",        ["admin", "security_engineer", "pentester"]],
  ["/grc",       ["admin", "security_engineer", "grc_analyst"]],
  ["/executive", ["admin", "executive"]],
  ["/soc",       ["admin", "security_engineer", "soc_lead", "soc"]],
  // §3.1: Reports — all roles (scoped by role in UI)
  ["/reports",   ["admin", "security_engineer", "soc_lead", "soc", "grc_analyst", "pentester", "executive"]],
  // Operations Center — default for all authenticated users
  ["/dashboard", ["admin", "security_engineer", "soc_lead", "soc", "grc_analyst", "pentester", "executive"]],
];

function roleHomeFor(role: string): string {
  const homes: Record<string, string> = {
    admin:             "/dashboard",
    security_engineer: "/dashboard",
    soc_lead:          "/soc",
    soc:               "/soc",
    grc_analyst:       "/grc",
    pentester:         "/pt",
    executive:         "/executive",
  };
  return homes[role] ?? "/dashboard";
}

export default withAuth(
  function middleware(req) {
    const token   = req.nextauth.token;
    const role    = (token?.role as string) ?? "";
    const { pathname } = req.nextUrl;

    // Find the first matching route rule
    const matched = ROUTE_RULES.find(
      ([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/")
    );

    if (matched) {
      const [, allowed] = matched;
      if (!allowed.includes(role)) {
        return NextResponse.redirect(new URL(roleHomeFor(role), req.url));
      }
    } else {
      // No rule matched — admin-only fallback
      if (role !== "admin") {
        return NextResponse.redirect(new URL(roleHomeFor(role), req.url));
      }
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      // Only verifies a token exists; role checks happen in the middleware fn above
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     *  - /login           (sign-in page)
     *  - /api/auth/*      (NextAuth + demo-credentials endpoints)
     *  - /_next/*         (Next.js internals)
     *  - /favicon.ico and static assets
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
