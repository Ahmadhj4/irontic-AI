'use client';
import { useState } from 'react';

/**
 * §9.1 Dual-Approval Flow — High-Impact Write and Destructive class actions.
 * Requires two distinct actors before execution is permitted.
 * First actor submits; second actor (different role) confirms.
 * 'destructive' tier: Admin-only, requires explicitly typed confirmation.
 */

export interface DualApprovalAction {
  id: string;
  label: string;
  description: string;
  /** §9.1 action class tiers: high = High-Impact Write; critical = elevated High-Impact; destructive = Admin-only Destructive */
  impact: 'high' | 'critical' | 'destructive';
  payload?: Record<string, unknown>;
}

interface Props {
  action: DualApprovalAction;
  onConfirmed: () => void;
  onCancel: () => void;
}

const SECOND_APPROVERS = [
  { id: 'soc_lead_01',    name: 'J. Martinez',  role: 'SOC Lead'    },
  { id: 'admin_01',       name: 'A. Thompson',  role: 'Admin'       },
  { id: 'sec_eng_01',     name: 'R. Patel',     role: 'Sec Engineer'},
];

export function DualApprovalModal({ action, onConfirmed, onCancel }: Props) {
  const [step, setStep] = useState<'submit' | 'await' | 'confirm'>('submit');
  const [firstJustification, setFirstJustification]   = useState('');
  const [secondJustification, setSecondJustification] = useState('');
  const [selectedApprover, setSelectedApprover] = useState(SECOND_APPROVERS[0].id);
  const [confirmed, setConfirmed] = useState(false);

  const isDestructive = action.impact === 'destructive';
  const borderColor = isDestructive || action.impact === 'critical' ? 'border-red-500/30' : 'border-amber-500/30';
  const bgColor     = isDestructive || action.impact === 'critical' ? 'bg-red-500/[0.04]'  : 'bg-amber-500/[0.04]';
  const labelColor  = isDestructive || action.impact === 'critical' ? 'text-red-400'        : 'text-amber-400';
  const [destructiveConfirm, setDestructiveConfirm] = useState('');

  return (
    <div className="irontic-modal fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className={`relative w-full max-w-md rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-xl p-5 space-y-4 shadow-2xl`}>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.impact === 'critical' ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
            <svg className={`w-4 h-4 ${labelColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
              §9.1 {isDestructive ? 'Destructive Action — Admin-Only' : 'Dual Approval Required'} — {action.impact.toUpperCase()} Impact
            </p>
            <p className="text-sm font-semibold text-white/90 mt-0.5">{action.label}</p>
            <p className="text-xs text-white/40 mt-0.5">{action.description}</p>
          </div>
          <button onClick={onCancel} className="text-white/20 hover:text-white/60 transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {['Actor 1: Submit', 'Pending 2nd', 'Actor 2: Confirm'].map((s, i) => {
            const stepNum = i === 0 ? 'submit' : i === 1 ? 'await' : 'confirm';
            const isActive = step === stepNum;
            const isDone   = (step === 'await' && i === 0) || (step === 'confirm' && i < 2);
            return (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
                  isDone ? 'bg-irontic-cyan/30 text-irontic-cyan' :
                  isActive ? 'bg-irontic-purple/40 text-white' :
                  'bg-white/[0.06] text-white/25'
                }`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] ${isActive ? 'text-white/70' : 'text-white/25'}`}>{s}</span>
                {i < 2 && <div className="w-4 h-px bg-white/[0.08]" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: First actor justification */}
        {step === 'submit' && (
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-white/40 mb-1">Select second approver</p>
              <select
                value={selectedApprover}
                onChange={e => setSelectedApprover(e.target.value)}
                className="w-full text-xs bg-white/[0.04] border border-white/[0.10] rounded-lg px-2.5 py-1.5 text-white/70 focus:outline-none focus:border-irontic-purple/40"
              >
                {SECOND_APPROVERS.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-white/40 mb-1">Your justification (Actor 1)</p>
              <textarea
                value={firstJustification}
                onChange={e => setFirstJustification(e.target.value)}
                placeholder="State business reason for this high-impact action — logged to immutable audit trail"
                rows={3}
                className="w-full text-xs bg-white/[0.04] border border-white/[0.10] rounded-lg px-2.5 py-1.5 text-white/70 placeholder-white/20 focus:outline-none focus:border-irontic-purple/40 resize-none"
              />
            </div>
            <button
              disabled={!firstJustification.trim()}
              onClick={() => setStep('await')}
              className={`w-full py-2 text-xs font-semibold rounded-lg border transition-colors ${
                action.impact === 'critical'
                  ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/25'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/25'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Submit for 2nd Approval →
            </button>
          </div>
        )}

        {/* Step 2: Awaiting second approver */}
        {step === 'await' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              <p className="text-xs text-white/50">
                Awaiting approval from <span className="text-white/80 font-semibold">
                  {SECOND_APPROVERS.find(a => a.id === selectedApprover)?.name}
                </span> — notification sent
              </p>
            </div>
            <p className="text-[10px] text-white/25 text-center">
              In production, the second actor receives an in-app + email notification. For demo, click below to simulate.
            </p>
            <button
              onClick={() => setStep('confirm')}
              className="w-full py-2 text-xs font-semibold text-irontic-cyan/80 bg-irontic-cyan/10 border border-irontic-cyan/20 rounded-lg hover:bg-irontic-cyan/15 transition-colors"
            >
              Simulate: Open as 2nd Approver →
            </button>
          </div>
        )}

        {/* Step 3: Second actor confirms */}
        {step === 'confirm' && (
          <div className="space-y-3">
            <div className="bg-irontic-purple/[0.05] border border-irontic-purple/20 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-white/30 mb-0.5">Actor 1 justification (read-only):</p>
              <p className="text-xs text-white/55 italic">"{firstJustification}"</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-white/40 mb-1">
                Your confirmation justification — {SECOND_APPROVERS.find(a => a.id === selectedApprover)?.name} (Actor 2)
              </p>
              <textarea
                value={secondJustification}
                onChange={e => setSecondJustification(e.target.value)}
                placeholder="Confirm you have independently reviewed this action and authorise execution"
                rows={3}
                className="w-full text-xs bg-white/[0.04] border border-white/[0.10] rounded-lg px-2.5 py-1.5 text-white/70 placeholder-white/20 focus:outline-none focus:border-irontic-purple/40 resize-none"
              />
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="mt-0.5 accent-irontic-cyan"
              />
              <span className="text-[10px] text-white/40 leading-relaxed">
                I confirm I have independently reviewed this action. Both justifications will be written to the immutable audit log.
              </span>
            </label>
            <div className="flex gap-2">
              <button
                disabled={!secondJustification.trim() || !confirmed}
                onClick={onConfirmed}
                className="flex-1 py-2 text-xs font-semibold bg-irontic-purple/20 hover:bg-irontic-purple/30 text-irontic-purple border border-irontic-purple/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ✓ Confirm &amp; Execute
              </button>
              <button onClick={onCancel} className="px-4 py-2 text-xs text-white/30 hover:text-white/60 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        <p className="text-[9px] text-white/15 text-center">
          §9.1 Human-in-the-Loop · High-Impact Write class action · Both actors logged to audit trail
        </p>
      </div>
    </div>
  );
}
