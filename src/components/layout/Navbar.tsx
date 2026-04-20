'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { NotificationsPanel } from '@/components/ui/NotificationsPanel';
import { ApprovalCard, Approval, ApprovalDecision } from '@/components/ui/ApprovalCard';
import { useTheme } from '@/components/providers/ThemeProvider';

const ROLE_LABELS: Record<string, string> = {
  admin:             'Administrator',
  soc:               'SOC Analyst',
  soc_lead:          'SOC Lead',
  grc_analyst:       'GRC Analyst',
  pentester:         'Pentester',
  security_engineer: 'Security Engineer',
  executive:         'Executive',
};

// Seed approval cards — in production fetched from GET /v1/approvals (§22.2)
const SEED_APPROVALS: Approval[] = [
  {
    id: 'APR-441',
    action: 'PLAYBOOK_EXECUTE',
    description: 'Execute host isolation on WIN-SERVER-04 — lateral movement T1021.002 confirmed (confidence 96%). This will terminate all active sessions and block SMB traffic.',
    riskLevel: 'HIGH',
    agent: 'SOC Agent',
    confidence: 0.96,
    createdAgo: '2 min ago',
    expiryMins: 15,
    rollbackPlan: 'Restore host network connectivity via firewall rule revert. ETA: 2 min. ServiceNow change CR-2041 pre-staged for rollback.',
  },
  {
    id: 'APR-442',
    action: 'PT_SCOPE_EXTEND',
    description: 'Extend PT engagement ENG-APR-003 scope to 10.20.0.0/16 subnet. Client written authorisation required before execution proceeds.',
    riskLevel: 'MEDIUM',
    agent: 'PT Agent',
    confidence: 0.85,
    createdAgo: '18 min ago',
    expiryMins: 12,
    rollbackPlan: 'Revert scope to original 10.10.0.0/24. Nuclei agent will halt new scans; in-progress scans complete current target then stop.',
  },
];

export function Navbar() {
  const { data: session } = useSession();
  const rawEmail   = session?.user?.email ?? '';
  const displayName = rawEmail.split('@')[0]
    ? rawEmail.split('@')[0].charAt(0).toUpperCase() + rawEmail.split('@')[0].slice(1)
    : 'User';
  const initial   = displayName.charAt(0).toUpperCase();
  const role      = (session?.user?.role as string) ?? '';
  const roleLabel = ROLE_LABELS[role] ?? role;

  const { theme, toggle: toggleTheme } = useTheme();

  const [searchOpen,    setSearchOpen]    = useState(false);
  const [approvalOpen,  setApprovalOpen]  = useState(false);
  const [approvals,     setApprovals]     = useState<Approval[]>(SEED_APPROVALS);
  const approvalRef = useRef<HTMLDivElement>(null);

  const handleDecide = useCallback((_id: string, _decision: ApprovalDecision) => {
    setApprovals(prev => prev.filter(a => a.id !== _id));
    // In production: POST /v1/approvals/{id}/decide (§22.2)
  }, []);

  // Close approval panel on outside click
  useEffect(() => {
    if (!approvalOpen) return;
    const handler = (e: MouseEvent) => {
      if (approvalRef.current && !approvalRef.current.contains(e.target as Node)) {
        setApprovalOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [approvalOpen]);

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const openSearch  = useCallback(() => setSearchOpen(true),  []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <>
      <CommandPalette open={searchOpen} onClose={closeSearch} />

      <header className="irontic-navbar h-14 border-b border-white/[0.07] bg-black/30 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">

        {/* Search trigger */}
        <button
          onClick={openSearch}
          aria-label="Open search (⌘K)"
          className="flex items-center gap-2.5 text-sm text-white/30 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 w-64 hover:border-irontic-purple/40 hover:bg-white/[0.06] transition-colors cursor-text text-left"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"/>
          </svg>
          <span className="text-xs flex-1">Search agents, findings…</span>
          <kbd className="text-[10px] bg-white/[0.06] border border-white/[0.08] rounded px-1 text-white/20" aria-hidden="true">⌘K</kbd>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Human Approval Cards button (§9.2 — right panel, 320px) */}
          <div className="relative" ref={approvalRef}>
            <button
              onClick={() => setApprovalOpen(o => !o)}
              aria-label={`Pending approvals${approvals.length > 0 ? ` (${approvals.length})` : ''}`}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {approvals.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
              )}
            </button>

            {/* Approval right-panel (320px per §3.2) */}
            {approvalOpen && (
              <div className="irontic-dropdown absolute right-0 top-10 w-80 bg-[#0d1526] border border-white/[0.10] rounded-xl shadow-2xl z-50 overflow-hidden max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-white/80">Human Approvals</h3>
                    {approvals.length > 0 && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-1.5 py-0.5 font-bold">
                        {approvals.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setApprovalOpen(false)}
                    className="text-white/20 hover:text-white/60 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                <div className="overflow-y-auto p-3 space-y-3">
                  {approvals.length === 0 ? (
                    <p className="text-center text-xs text-white/25 py-8">✓ No pending approvals</p>
                  ) : (
                    approvals.map(a => (
                      <ApprovalCard key={a.id} approval={a} onDecide={handleDecide} />
                    ))
                  )}
                  {/* MCP context feed */}
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-irontic-cyan opacity-60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-irontic-cyan" />
                      </span>
                      <span className="text-[10px] font-semibold text-white/50">MCP Context · /v1/ws/dashboard</span>
                    </div>
                    <div className="space-y-1 text-[10px] text-white/30">
                      <p>› SOC Agent: 47 alerts processed last hour</p>
                      <p>› T1021.002 correlated across 3 assets</p>
                      <p>› GRC gap report ready — ISO 27001 A.9.4.2</p>
                      <p>› PT Nuclei agent at 65% completion</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationsPanel />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
          >
            {theme === 'dark' ? (
              /* Sun icon */
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z"/>
              </svg>
            ) : (
              /* Moon icon */
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-white/[0.08]" aria-hidden="true" />

          {/* User */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-full bg-irontic-purple/30 blur-[6px]" aria-hidden="true" />
              <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-irontic-purple to-irontic-indigo flex items-center justify-center text-white text-xs font-bold shadow-glow-sm">
                {initial}
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-white/90 leading-none">{displayName}</p>
              <p className="text-[10px] text-white/35 mt-0.5 leading-none">{roleLabel}</p>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            aria-label="Sign out"
            title="Sign out"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </header>
    </>
  );
}
