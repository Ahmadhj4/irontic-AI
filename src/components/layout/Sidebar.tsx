'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { clsx } from '@/lib/clsx';

// Tech Doc §3.1 — route access per role
// Each nav item declares which roles may see it.
// 'all' means every authenticated role.
type NavItem = {
  href:        string;
  label:       string;
  description?: string;
  roles:       string[] | 'all';
  icon:        React.ReactNode;
};

const overviewNav: NavItem[] = [
  {
    href:  '/dashboard',
    label: 'Overview',
    roles: 'all',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 1a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
      </svg>
    ),
  },
];

const agentNav: NavItem[] = [
  {
    href:        '/soc',
    label:       'SOC',
    description: 'Security Operations Center',
    // §3.1: SOC Analyst, SOC Lead, Security Engineer, Admin
    roles: ['soc', 'soc_lead', 'security_engineer', 'admin'],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    href:        '/grc',
    label:       'GRC',
    description: 'Governance · Risk · Compliance',
    // §3.1: GRC Analyst, Security Engineer, Admin
    roles: ['grc_analyst', 'security_engineer', 'admin'],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href:        '/av',
    label:       'Endpoint Protection',
    description: 'Endpoint threat detection',
    // §3.1: Security Engineer, Admin
    roles: ['security_engineer', 'admin'],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  {
    href:        '/pt',
    label:       'Pentest',
    description: 'Penetration Testing',
    // §3.1: Pentester, Security Engineer, Admin
    roles: ['pentester', 'security_engineer', 'admin'],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
];

const platformNav: NavItem[] = [
  {
    href:        '/agents',
    label:       'Agent Activity',
    description: 'Lifecycle & orchestration',
    // §3.1: Security Engineer, Admin
    roles: ['security_engineer', 'admin'],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    href:  '/reports',
    label: 'Reports',
    // §3.1: All roles (scoped by role)
    roles: 'all',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href:        '/audit',
    label:       'Audit Log',
    description: 'Immutable HMAC trail',
    // §3.1: Admin only
    roles: ['admin'],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href:        '/executive',
    label:       'Executive Briefing',
    description: 'Read-only posture view',
    // §3.1: Executive (read-only) + Admin
    roles: ['executive', 'admin'],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    ),
  },
  {
    href:  '/settings',
    label: 'Settings',
    // §3.1: Admin only
    roles: ['admin'],
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function canSee(item: NavItem, role: string): boolean {
  if (item.roles === 'all') return true;
  return item.roles.includes(role);
}

function SidebarNavItem({ href, label, icon, active, description }: {
  href: string; label: string; icon: React.ReactNode; active: boolean; description?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        active
          ? 'bg-irontic-purple/20 text-white border border-irontic-purple/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
          : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
      )}
    >
      <span className={clsx(
        'flex-shrink-0 transition-colors',
        active ? 'text-irontic-cyan' : 'text-white/30 group-hover:text-irontic-purple/70'
      )}>
        {icon}
      </span>
      <span className="flex-1 leading-none">
        {label}
        {description && (
          <span className="block text-[9px] font-normal mt-0.5 text-white/25">{description}</span>
        )}
      </span>
      {active && (
        <span className="w-1 h-4 rounded-full bg-irontic-purple shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
      )}
    </Link>
  );
}

const SEVERITY_FILTERS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const DOMAIN_FILTERS   = ['SOC', 'GRC', 'PT', 'EP']           as const;

export function Sidebar() {
  const path = usePathname();
  const { data: session } = useSession();
  const role = (session?.user?.role as string) ?? '';

  const [filterOpen,       setFilterOpen]       = useState(false);
  const [activeSeverities, setActiveSeverities] = useState<string[]>([]);
  const [activeDomains,    setActiveDomains]    = useState<string[]>([]);

  const toggleSeverity = (s: string) =>
    setActiveSeverities(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleDomain = (d: string) =>
    setActiveDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const isActive = (href: string) =>
    href === '/dashboard' ? path === href : path === href || path.startsWith(href + '/');

  const visibleAgents   = agentNav.filter(item => canSee(item, role));
  const visiblePlatform = platformNav.filter(item => canSee(item, role));

  // Role badge shown in footer
  const ROLE_LABELS: Record<string, string> = {
    admin:             'Administrator',
    soc:               'SOC Analyst',
    soc_lead:          'SOC Lead',
    grc_analyst:       'GRC Analyst',
    pentester:         'Pentester',
    security_engineer: 'Security Engineer',
    executive:         'Executive',
  };

  return (
    <aside className="w-60 min-h-screen flex flex-col py-4 border-r border-white/[0.07] bg-black/40 backdrop-blur-xl">

      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-irontic-purple/40 rounded-lg blur-[8px]" />
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-irontic-purple to-irontic-indigo flex items-center justify-center shadow-glow-sm">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight">Irontic AI</span>
            <p className="text-[10px] text-irontic-sky/60 leading-none mt-0.5">Security Platform</p>
          </div>
        </div>
      </div>

      {/* ── Role badge ───────────────────────────────────────── */}
      {role && (
        <div className="px-5 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] font-medium text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-irontic-cyan" />
            {ROLE_LABELS[role] ?? role}
          </span>
        </div>
      )}

      {/* ── Overview ─────────────────────────────────────────── */}
      <nav className="px-3 space-y-0.5 mb-4">
        {overviewNav.filter(item => canSee(item, role)).map(item => (
          <SidebarNavItem key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* ── AI Agents ────────────────────────────────────────── */}
      {visibleAgents.length > 0 && (
        <>
          <p className="px-5 mb-2 text-[10px] font-semibold tracking-widest uppercase text-white/25">AI Agents</p>
          <nav className="px-3 space-y-0.5 mb-4">
            {visibleAgents.map(item => (
              <SidebarNavItem key={item.href} {...item} active={isActive(item.href)} />
            ))}
          </nav>
        </>
      )}

      {/* ── Platform ─────────────────────────────────────────── */}
      {visiblePlatform.length > 0 && (
        <>
          <p className="px-5 mb-2 text-[10px] font-semibold tracking-widest uppercase text-white/25">Platform</p>
          <nav className="flex-1 px-3 space-y-0.5">
            {visiblePlatform.map(item => (
              <SidebarNavItem key={item.href} {...item} active={isActive(item.href)} />
            ))}
          </nav>
        </>
      )}

      {/* ── Filter Panel ─────────────────────────────────────── */}
      <div className="px-3 mt-2">
        <button
          onClick={() => setFilterOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-white/25 hover:text-white/50 uppercase tracking-wider rounded-lg hover:bg-white/[0.03] transition-colors"
          aria-expanded={filterOpen}
        >
          <span className="flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0014 13.828V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17v-3.172a1 1 0 00-.293-.707L1.293 6.707A1 1 0 011 6V4z"/>
            </svg>
            Filter
          </span>
          <svg className={`w-3 h-3 transition-transform ${filterOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        {filterOpen && (
          <div className="mt-2 px-2 pb-3 space-y-3">
            <div>
              <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-1.5">Severity</p>
              <div className="flex flex-wrap gap-1">
                {SEVERITY_FILTERS.map(s => {
                  const active = activeSeverities.includes(s);
                  const colors: Record<string, string> = {
                    CRITICAL: 'text-red-400 border-red-500/30 bg-red-500/10',
                    HIGH:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
                    MEDIUM:   'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
                    LOW:      'text-blue-400 border-blue-500/30 bg-blue-500/10',
                  };
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSeverity(s)}
                      className={clsx(
                        'text-[9px] px-1.5 py-0.5 rounded border font-semibold transition-opacity',
                        colors[s],
                        !active && 'opacity-40'
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-1.5">Domain</p>
              <div className="flex flex-wrap gap-1">
                {DOMAIN_FILTERS.map(d => {
                  const active = activeDomains.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDomain(d)}
                      className={clsx(
                        'text-[9px] px-1.5 py-0.5 rounded border font-semibold transition-opacity',
                        'text-irontic-sky/70 border-irontic-sky/25 bg-irontic-sky/10',
                        !active && 'opacity-40'
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-1.5">Quick Actions</p>
              {[
                { label: 'Run Full Scan',  icon: '⚡' },
                { label: 'Export Report', icon: '↓'  },
                { label: 'New Engagement', icon: '+' },
              ].map(qa => (
                <button
                  key={qa.label}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/[0.03] rounded-lg transition-colors"
                >
                  <span>{qa.icon}</span>{qa.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="px-5 pt-4 mt-auto border-t border-white/[0.06]">
        {/* §4 Tenant context */}
        <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-lg bg-irontic-purple/[0.08] border border-irontic-purple/15">
          <svg className="w-3 h-3 text-irontic-purple/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-irontic-purple/70 truncate">Green Circle</p>
            <p className="text-[9px] text-white/20">Tenant · ISO 27001</p>
          </div>
          <span className="text-[8px] font-bold text-irontic-cyan/50 border border-irontic-cyan/20 px-1 py-0.5 rounded">LIVE</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-irontic-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-irontic-cyan" />
          </span>
          <p className="text-[10px] text-white/25">All systems operational</p>
        </div>
        <p className="text-[10px] text-white/15 pl-3.5">v2.1 · 4 agents active</p>
      </div>
    </aside>
  );
}
