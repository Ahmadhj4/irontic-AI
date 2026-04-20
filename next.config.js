/** @type {import('next').NextConfig} */

// OWASP: Security headers applied to every response.
// Tighten script-src once nonce-based CSP is implemented in Phase 2.
const securityHeaders = [
  // Prevent clickjacking — no framing allowed from any origin.
  { key: 'X-Frame-Options', value: 'DENY' },

  // Prevent MIME-type sniffing (OWASP A05:2021).
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Enforce HTTPS for 2 years on all sub-domains (applied once TLS is live).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

  // Restrict Referer header to same-origin on cross-origin requests.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Disable browser features not used by the portal.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },

  // Content Security Policy.
  // 'unsafe-inline' required by Next.js dev/Turbopack; 'unsafe-eval' by recharts.
  // Phase 2: nonce-based CSP to eliminate unsafe-inline for production builds.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      // Prevent <object>/<embed> injection vectors (OWASP A03)
      "object-src 'none'",
      // Block base-tag hijacking
      "base-uri 'self'",
      // Restrict form submissions to same origin (prevent data exfil via forms)
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
