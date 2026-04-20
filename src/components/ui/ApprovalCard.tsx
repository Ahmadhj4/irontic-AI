'use client';
import { useState } from 'react';
import { SLATimer } from './SLATimer';

export type ApprovalDecision = 'APPROVE' | 'REJECT' | 'CLARIFY';
export type ApprovalRisk = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Approval {
  id: string;
  action: string;
  description: string;
  riskLevel: ApprovalRisk;
  agent: string;
  confidence: number;
  createdAgo: string;
  /** Minutes until card expires — default 15 (§9.2) */
  expiryMins?: number;
  /** §9.2: Full context — rollback plan shown on card */
  rollbackPlan?: string;
}

interface ApprovalCardProps {
  approval: Approval;
  onDecide: (id: string, decision: ApprovalDecision, justification?: string) => void;
}

const riskStyles: Record<ApprovalRisk, string> = {
  CRITICAL: 'border-red-500/40 bg-red-500/5',
  HIGH:     'border-orange-500/30 bg-orange-500/5',
  MEDIUM:   'border-yellow-500/25 bg-yellow-500/5',
  LOW:      'border-white/[0.08] bg-white/[0.02]',
};

const riskBadge: Record<ApprovalRisk, string> = {
  CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
  HIGH:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  MEDIUM:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  LOW:      'bg-white/[0.06] text-white/50 border-white/10',
};

/**
 * Human Approval Governance Card (§9.2 / §3.2)
 * Surfaces in the right panel (320px) for any write operation that requires human approval.
 * No write operation proceeds without explicit action on this card.
 * Provides Approve / Reject / Request Clarification + 15-minute expiry countdown.
 */
export function ApprovalCard({ approval, onDecide }: ApprovalCardProps) {
  const [showJustification, setShowJustification] = useState(false);
  const [justification, setJustification] = useState('');
  const expiryMins = approval.expiryMins ?? 15;

  const handleDecide = (decision: ApprovalDecision) => {
    if (decision === 'REJECT' && !justification.trim()) {
      setShowJustification(true);
      return;
    }
    onDecide(approval.id, decision, justification || undefined);
  };

  return (
    <div className={`rounded-xl border p-3.5 ${riskStyles[approval.riskLevel]}`}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-mono text-irontic-sky/70">{approval.id}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${riskBadge[approval.riskLevel]}`}>
          {approval.riskLevel}
        </span>
      </div>

      {/* Action label */}
      <p className="text-xs font-bold text-white/90 mb-1">{approval.action}</p>

      {/* Description */}
      <p className="text-[11px] text-white/50 leading-relaxed mb-2.5">{approval.description}</p>

      {/* Meta row */}
      <div className="flex items-center justify-between text-[10px] text-white/30 mb-2.5">
        <span>{approval.agent}</span>
        <span>Conf: {(approval.confidence * 100).toFixed(0)}%</span>
        <span>{approval.createdAgo}</span>
      </div>

      {/* §9.2 Rollback plan — shown when provided */}
      {approval.rollbackPlan && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2 mb-2.5">
          <p className="text-[9px] font-bold text-white/25 uppercase tracking-widest mb-0.5">Rollback Plan</p>
          <p className="text-[10px] text-white/50 leading-relaxed">{approval.rollbackPlan}</p>
        </div>
      )}

      {/* Expiry countdown (§9.2 — 15-min expiry) */}
      <div className="flex items-center gap-1.5 bg-white/[0.04] rounded-lg px-2.5 py-1.5 mb-3">
        <svg className="w-3 h-3 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <SLATimer totalMins={expiryMins} showLabel />
        <span className="text-[10px] text-white/20 ml-auto">auto-escalate on expiry</span>
      </div>

      {/* Justification input (shown on Reject) */}
      {showJustification && (
        <textarea
          value={justification}
          onChange={e => setJustification(e.target.value)}
          placeholder="Written justification required for rejection…"
          rows={2}
          className="w-full mb-2 text-xs bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-irontic-purple/50"
        />
      )}

      {/* Decision buttons: Approve / Reject / Clarify (§9.2) */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={() => handleDecide('APPROVE')}
          className="py-1.5 text-xs font-semibold rounded-lg bg-irontic-cyan/15 hover:bg-irontic-cyan/25 text-irontic-cyan border border-irontic-cyan/25 transition-colors"
        >
          ✓ Approve
        </button>
        <button
          onClick={() => handleDecide('REJECT')}
          className="py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition-colors"
        >
          ✕ Reject
        </button>
        <button
          onClick={() => { setShowJustification(true); handleDecide('CLARIFY'); }}
          className="py-1.5 text-xs font-semibold rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white/50 border border-white/[0.08] transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          Clarify
        </button>
      </div>
    </div>
  );
}
