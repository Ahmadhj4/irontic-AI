'use client';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { DualApprovalModal, DualApprovalAction } from '@/components/ui/DualApprovalModal';

/**
 * §3.2 Right Panel — persistent 320px layout zone.
 * Shows: pending approval cards (§9.1) + AI agent context stream.
 * Collapsible via toggle button.
 */

interface PendingApproval {
  id: string;
  action: string;
  domain: string;
  requestedBy: string;
  impact: 'critical' | 'high';
  age: string;
}

const INITIAL_APPROVALS: PendingApproval[] = [
  { id:'APR-001', action:'Bulk Close 3 Alerts',    domain:'SOC', requestedBy:'K. Chen',  impact:'high',     age:'4m ago'  },
  { id:'APR-002', action:'Disable Control AC-2.1', domain:'GRC', requestedBy:'R. Patel', impact:'critical', age:'12m ago' },
];

const AI_CONTEXT = [
  { ts:'14:58', agent:'SOC',     msg:'Correlated 3 alerts to single threat actor · ATT&CK cluster T1071+T1059' },
  { ts:'14:55', agent:'EP',      msg:'Definition update applied to 47 endpoints — 0 failures' },
  { ts:'14:52', agent:'GRC',     msg:'ISO A.9.4.2 gap evidence package collected — ready for review' },
  { ts:'14:49', agent:'Orch',    msg:'Cross-domain CRS recalculated: 67 → 69 (+2 SOC remediation)' },
  { ts:'14:44', agent:'Pentest', msg:'Recon phase completed for ENG-APR-003 — 14 hosts enumerated' },
];

export function RightPanel() {
  const [open, setOpen] = useState(true);
  const [approvals, setApprovals] = useState<PendingApproval[]>(INITIAL_APPROVALS);
  const [reviewingApproval, setReviewingApproval] = useState<PendingApproval | null>(null);
  const { show } = useToast();

  const dismiss = (id: string) => {
    setApprovals(p => p.filter(a => a.id !== id));
    show('Approval request dismissed', 'info');
  };

  const onApproved = (ap: PendingApproval) => {
    setApprovals(p => p.filter(a => a.id !== ap.id));
    setReviewingApproval(null);
    show(`"${ap.action}" approved and executed · logged to audit trail`, 'success');
  };

  return (
    <>
      {/* Collapse toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-5 h-16 bg-white/[0.05] border border-r-0 border-white/[0.10] rounded-l-lg hover:bg-white/[0.08] transition-colors"
        aria-label={open ? 'Collapse right panel' : 'Expand right panel'}
      >
        <svg
          className={`w-3 h-3 text-white/30 transition-transform ${open ? 'rotate-0' : 'rotate-180'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>

      <aside
        className={`irontic-right-panel shrink-0 overflow-y-auto border-l border-white/[0.06] bg-[#0d0d14] transition-all duration-200 ${
          open ? 'w-80' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="w-80 p-4 space-y-4">

          {/* Pending approvals */}
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Pending Approvals
              {approvals.length > 0 && (
                <span className="ml-auto text-[9px] bg-amber-400/15 text-amber-400 px-1.5 py-0.5 rounded">{approvals.length}</span>
              )}
            </p>
            {approvals.length === 0 && (
              <p className="text-[10px] text-white/20 py-2">No pending approvals</p>
            )}
            <div className="space-y-2">
              {approvals.map(ap => (
                <div
                  key={ap.id}
                  className={`rounded-lg border p-2.5 space-y-1.5 ${
                    ap.impact === 'critical'
                      ? 'bg-red-500/[0.04] border-red-500/20'
                      : 'bg-amber-500/[0.04] border-amber-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${ap.impact === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                      §9.1 · {ap.impact.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-white/25">{ap.age}</span>
                  </div>
                  <p className="text-xs font-semibold text-white/80">{ap.action}</p>
                  <p className="text-[10px] text-white/35">Requested by {ap.requestedBy} · {ap.domain}</p>
                  <div className="flex gap-1.5 pt-0.5">
                    <button
                      onClick={() => setReviewingApproval(ap)}
                      className="flex-1 py-1 text-[10px] font-semibold text-irontic-purple/80 bg-irontic-purple/10 border border-irontic-purple/20 rounded-md hover:bg-irontic-purple/20 transition-colors"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => dismiss(ap.id)}
                      className="flex-1 py-1 text-[10px] font-semibold text-white/30 bg-white/[0.03] border border-white/[0.08] rounded-md hover:text-white/60 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI agent context stream */}
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-irontic-cyan opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-irontic-cyan" />
              </span>
              AI Context Stream
            </p>
            <div className="space-y-2">
              {AI_CONTEXT.map((ev, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-[9px] text-white/20 w-9 shrink-0 mt-0.5">{ev.ts}</span>
                  <span className="text-[9px] font-bold text-irontic-cyan/60 w-10 shrink-0">{ev.agent}</span>
                  <p className="text-[10px] text-white/45 leading-relaxed">{ev.msg}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[8px] text-white/10 text-center pt-2 border-t border-white/[0.04]">
            §3.2 Right Panel · approval cards + AI context · 320px persistent zone
          </p>
        </div>
      </aside>

      {/* §9.1 Dual-approval modal triggered from right panel Review button */}
      {reviewingApproval && (
        <DualApprovalModal
          action={{
            id: reviewingApproval.id,
            label: reviewingApproval.action,
            description: `Requested by ${reviewingApproval.requestedBy} · ${reviewingApproval.domain} domain`,
            impact: reviewingApproval.impact,
          } satisfies DualApprovalAction}
          onConfirmed={() => onApproved(reviewingApproval)}
          onCancel={() => setReviewingApproval(null)}
        />
      )}
    </>
  );
}
