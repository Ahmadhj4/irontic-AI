"use client";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Tech Doc §3.1 — role home routes after sign-in
const ROLE_HOME: Record<string, string> = {
  admin:              "/dashboard",
  soc:                "/soc",
  soc_lead:           "/soc",
  grc_analyst:        "/grc",
  pentester:          "/pt",
  security_engineer:  "/dashboard",
  executive:          "/executive",
};

export default function LoginPage() {
  const router  = useRouter();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const doSignIn = async (em: string, pw: string): Promise<boolean> => {
    const result = await signIn("credentials", {
      email:    em.trim().toLowerCase(),
      password: pw,
      redirect: false,
    });

    if (result?.error || result?.ok === false) {
      setError("Invalid credentials. Please try again.");
      return false;
    }

    const session = await getSession();
    const role    = (session?.user?.role as string) ?? "";
    router.push(ROLE_HOME[role] ?? "/dashboard");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await doSignIn(email, password);
    setLoading(false);
  };

  const quickLogin = async (role: string) => {
    setLoadingRole(role);
    setError("");
    try {
      const res = await fetch("/api/auth/demo-credentials", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed");
      const { email: em, password: pw } = await res.json();
      await doSignIn(em, pw);
    } catch {
      setError("Demo login failed. Please use the credentials form.");
    } finally {
      setLoadingRole(null);
    }
  };

  const busy = loading || loadingRole !== null;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: `
          radial-gradient(1100px 750px at 50% 14%, rgba(109,91,255,.45), transparent 58%),
          radial-gradient(1000px 700px at 45% 32%, rgba(79,140,255,.35), transparent 62%),
          radial-gradient(900px 650px at 55% 48%, rgba(34,211,238,.28), transparent 65%),
          #050b14
        `,
      }}
    >
      <div className="w-full max-w-lg px-6">

        {/* ── Logo ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="relative w-11 h-11">
            <div className="absolute inset-0 bg-irontic-purple/40 rounded-xl blur-[12px]" />
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-irontic-purple to-irontic-indigo flex items-center justify-center shadow-glow-sm">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Irontic AI</h1>
            <p className="text-[11px] text-irontic-sky/60 leading-none mt-0.5">Security Operations Platform</p>
          </div>
        </div>

        {/* ── Demo Role Cards ── */}
        <p className="text-center text-[10px] text-white/30 mb-3 uppercase tracking-widest font-semibold">
          Quick access — select your role
        </p>
        <div className="grid grid-cols-3 gap-2.5 mb-6">

          {/* Administrator */}
          <button onClick={() => quickLogin("admin")} disabled={busy}
            className="group relative p-3 rounded-xl border border-irontic-purple/30 bg-irontic-purple/10 hover:bg-irontic-purple/20 hover:border-irontic-purple/50 transition-all text-left disabled:opacity-50">
            <div className="w-7 h-7 rounded-lg bg-irontic-purple/20 flex items-center justify-center mb-2 group-hover:bg-irontic-purple/30 transition-colors">
              <svg className="w-3.5 h-3.5 text-irontic-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-white">Administrator</p>
            <p className="text-[10px] text-white/35 mt-0.5 leading-snug">Full access</p>
            {loadingRole === "admin" && <Spinner color="irontic-purple" />}
          </button>

          {/* SOC Analyst */}
          <button onClick={() => quickLogin("soc")} disabled={busy}
            className="group relative p-3 rounded-xl border border-irontic-cyan/30 bg-irontic-cyan/10 hover:bg-irontic-cyan/20 hover:border-irontic-cyan/50 transition-all text-left disabled:opacity-50">
            <div className="w-7 h-7 rounded-lg bg-irontic-cyan/20 flex items-center justify-center mb-2 group-hover:bg-irontic-cyan/30 transition-colors">
              <svg className="w-3.5 h-3.5 text-irontic-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-white">SOC Analyst</p>
            <p className="text-[10px] text-white/35 mt-0.5 leading-snug">Alerts · SOC</p>
            {loadingRole === "soc" && <Spinner color="irontic-cyan" />}
          </button>

          {/* SOC Lead */}
          <button onClick={() => quickLogin("soc_lead")} disabled={busy}
            className="group relative p-3 rounded-xl border border-irontic-sky/30 bg-irontic-sky/10 hover:bg-irontic-sky/20 hover:border-irontic-sky/50 transition-all text-left disabled:opacity-50">
            <div className="w-7 h-7 rounded-lg bg-irontic-sky/20 flex items-center justify-center mb-2 group-hover:bg-irontic-sky/30 transition-colors">
              <svg className="w-3.5 h-3.5 text-irontic-sky" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-white">SOC Lead</p>
            <p className="text-[10px] text-white/35 mt-0.5 leading-snug">SOC · Reports</p>
            {loadingRole === "soc_lead" && <Spinner color="irontic-sky" />}
          </button>

          {/* GRC Analyst */}
          <button onClick={() => quickLogin("grc_analyst")} disabled={busy}
            className="group relative p-3 rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 hover:border-green-500/50 transition-all text-left disabled:opacity-50">
            <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center mb-2 group-hover:bg-green-500/30 transition-colors">
              <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-white">GRC Analyst</p>
            <p className="text-[10px] text-white/35 mt-0.5 leading-snug">Compliance · Risk</p>
            {loadingRole === "grc_analyst" && <Spinner color="green-400" />}
          </button>

          {/* Pentester */}
          <button onClick={() => quickLogin("pentester")} disabled={busy}
            className="group relative p-3 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all text-left disabled:opacity-50">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center mb-2 group-hover:bg-orange-500/30 transition-colors">
              <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-white">Pentester</p>
            <p className="text-[10px] text-white/35 mt-0.5 leading-snug">PT · Findings</p>
            {loadingRole === "pentester" && <Spinner color="orange-400" />}
          </button>

          {/* Security Engineer */}
          <button onClick={() => quickLogin("security_engineer")} disabled={busy}
            className="group relative p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all text-left disabled:opacity-50">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-2 group-hover:bg-yellow-500/30 transition-colors">
              <svg className="w-3.5 h-3.5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-white">Sec. Engineer</p>
            <p className="text-[10px] text-white/35 mt-0.5 leading-snug">All agents</p>
            {loadingRole === "security_engineer" && <Spinner color="yellow-400" />}
          </button>

          {/* Executive — full width */}
          <button onClick={() => quickLogin("executive")} disabled={busy}
            className="group relative col-span-3 p-3 rounded-xl border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 hover:border-pink-500/50 transition-all text-left disabled:opacity-50 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0 group-hover:bg-pink-500/30 transition-colors">
              <svg className="w-3.5 h-3.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Executive</p>
              <p className="text-[10px] text-white/35 leading-snug">Read-only posture briefing</p>
            </div>
            {loadingRole === "executive" && <Spinner color="pink-400" />}
          </button>
        </div>

        {/* ── Divider ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-[11px] text-white/25">or sign in with credentials</span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* ── Credentials Form ──────────────────────────────────── */}
        <div className="bg-white/[0.035] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl">
          {error && (
            <div
              className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm p-3 rounded-lg mb-4"
              role="alert"
            >
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                placeholder="you@irontic.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.08] text-white rounded-lg text-sm placeholder-white/20 focus:outline-none focus:border-irontic-purple/50 focus:bg-white/[0.09] transition-colors"
                maxLength={254}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.08] text-white rounded-lg text-sm placeholder-white/20 focus:outline-none focus:border-irontic-purple/50 focus:bg-white/[0.09] transition-colors"
                maxLength={128}
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 bg-irontic-purple hover:bg-irontic-purple/90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/15 mt-6">
          Irontic AI · Security Operations Platform · v2.1
        </p>
      </div>
    </div>
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
      <div
        className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-${color}`}
      />
    </div>
  );
}
