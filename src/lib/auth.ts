// OWASP A02:2021 — Cryptographic Failures / A07:2021 — Identification & Authentication Failures
//
// Credentials are read from environment variables — never hard-coded.
// Phase 2: replace CredentialsProvider with an enterprise IdP
// (SAML / OIDC via Auth0, Okta, or Azure AD) and add MFA.

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Resolve demo users from env at startup.
// In production, replace this with a database/IdP lookup and bcrypt comparison.
function buildDemoUsers(): Record<string, { id: string; password: string; role: string }> {
  const required = {
    DEMO_ADMIN_EMAIL:      process.env.DEMO_ADMIN_EMAIL,
    DEMO_ADMIN_PASSWORD:   process.env.DEMO_ADMIN_PASSWORD,
    DEMO_SOC_EMAIL:        process.env.DEMO_SOC_EMAIL,
    DEMO_SOC_PASSWORD:     process.env.DEMO_SOC_PASSWORD,
    DEMO_SOC_LEAD_EMAIL:   process.env.DEMO_SOC_LEAD_EMAIL,
    DEMO_SOC_LEAD_PASSWORD:process.env.DEMO_SOC_LEAD_PASSWORD,
    DEMO_GRC_EMAIL:        process.env.DEMO_GRC_EMAIL,
    DEMO_GRC_PASSWORD:     process.env.DEMO_GRC_PASSWORD,
    DEMO_PENTESTER_EMAIL:  process.env.DEMO_PENTESTER_EMAIL,
    DEMO_PENTESTER_PASSWORD:process.env.DEMO_PENTESTER_PASSWORD,
    DEMO_ENGINEER_EMAIL:   process.env.DEMO_ENGINEER_EMAIL,
    DEMO_ENGINEER_PASSWORD:process.env.DEMO_ENGINEER_PASSWORD,
    DEMO_EXECUTIVE_EMAIL:  process.env.DEMO_EXECUTIVE_EMAIL,
    DEMO_EXECUTIVE_PASSWORD:process.env.DEMO_EXECUTIVE_PASSWORD,
  };

  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  return {
    [required.DEMO_ADMIN_EMAIL!]:    { id: "1", password: required.DEMO_ADMIN_PASSWORD!,    role: "admin"             },
    [required.DEMO_SOC_EMAIL!]:      { id: "2", password: required.DEMO_SOC_PASSWORD!,       role: "soc"               },
    [required.DEMO_SOC_LEAD_EMAIL!]: { id: "3", password: required.DEMO_SOC_LEAD_PASSWORD!,  role: "soc_lead"          },
    [required.DEMO_GRC_EMAIL!]:      { id: "4", password: required.DEMO_GRC_PASSWORD!,       role: "grc_analyst"       },
    [required.DEMO_PENTESTER_EMAIL!]:{ id: "5", password: required.DEMO_PENTESTER_PASSWORD!, role: "pentester"         },
    [required.DEMO_ENGINEER_EMAIL!]: { id: "6", password: required.DEMO_ENGINEER_PASSWORD!,  role: "security_engineer" },
    [required.DEMO_EXECUTIVE_EMAIL!]:{ id: "7", password: required.DEMO_EXECUTIVE_PASSWORD!, role: "executive"         },
  };
}

// Build once at module load; throws at startup if env is incomplete.
const DEMO_USERS = buildDemoUsers();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email    = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        // Reject obviously malformed input before touching the user store.
        if (!email || !password) return null;
        if (email.length > 254 || password.length > 128) return null;

        const account = DEMO_USERS[email];
        // Constant-time comparison is not needed here (in-memory demo store),
        // but add timing-safe compare (crypto.timingSafeEqual) if migrating to
        // a real credential store.
        if (!account || account.password !== password) return null;

        return { id: account.id, email, role: account.role };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role;
        if (user.email) token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id   as string;
        session.user.role = token.role as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },

  pages:   { signIn: "/login" },
  session: { strategy: "jwt" },
  secret:  process.env.NEXTAUTH_SECRET,
};
