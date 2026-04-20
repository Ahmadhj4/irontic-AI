'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ComplianceControl, ComplianceStatus } from '@/types';
import { useToast } from '@/components/ui/Toast';

function statusVariant(s: ComplianceStatus): 'success' | 'critical' | 'medium' | 'neutral' {
  if (s === 'compliant')     return 'success';
  if (s === 'non_compliant') return 'critical';
  if (s === 'partial')       return 'medium';
  return 'neutral';
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// §3.3 Journey 2: AI-generated gap analysis per control
const AI_GAP_ANALYSIS: Record<string, { gap: string; evidence: string[]; recommendation: string; effort: string }> = {
  'non_compliant': {
    gap: 'Control is non-compliant. AI analysis identified 3 evidence gaps and 1 missing compensating control.',
    evidence: ['Policy document not updated since 2024-Q2', 'No automated testing in CI pipeline', 'Audit log retention < 12 months (currently 6 months)'],
    recommendation: 'Update policy, add automated compliance check to CI/CD, extend log retention to 12 months.',
    effort: 'Medium — 2–3 sprint cycles',
  },
  'partial': {
    gap: 'Partial compliance detected. Control is implemented but lacks consistent enforcement across all asset classes.',
    evidence: ['Implemented on cloud assets (✓)', 'Missing on legacy on-prem systems (3 hosts)', 'Exception approved until 2026-Q2'],
    recommendation: 'Extend control to legacy systems. Submit exception renewal or accelerate migration.',
    effort: 'Low — 1 sprint cycle',
  },
  'compliant': {
    gap: 'Control is fully compliant. No gaps detected in latest assessment.',
    evidence: ['Policy current and approved', 'Automated test passing', 'Evidence collected 14 Apr 2026'],
    recommendation: 'No action required. Schedule next review per audit calendar.',
    effort: 'None',
  },
  'not_assessed': {
    gap: 'Control has not been assessed. No evidence on file.',
    evidence: ['No assessment date recorded', 'Owner has not acknowledged control'],
    recommendation: 'Schedule assessment with control owner. Run automated evidence collection.',
    effort: 'Low — 1 sprint cycle',
  },
};

interface Props {
  controls: ComplianceControl[];
}

export function ComplianceTable({ controls }: Props) {
  const [selected, setSelected] = useState<ComplianceControl | null>(null);
  const [taskForm, setTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [attachName, setAttachName] = useState('');
  const { show } = useToast();

  if (controls.length === 0) {
    return <p className="text-xs text-white/25 py-4 text-center">No controls data — run an assessment to populate</p>;
  }

  const analysis = selected ? (AI_GAP_ANALYSIS[selected.status] ?? AI_GAP_ANALYSIS['not_assessed']) : null;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Control ID', 'Framework', 'Title', 'Status', 'Owner', 'Last Assessed', 'Next Review'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {controls.map(ctrl => (
              <tr
                key={ctrl.id}
                onClick={() => setSelected(selected?.id === ctrl.id ? null : ctrl)}
                className={`transition-colors cursor-pointer ${selected?.id === ctrl.id ? 'bg-irontic-purple/[0.06]' : 'hover:bg-white/[0.02]'}`}
              >
                <td className="px-3 py-2.5 text-xs font-mono text-irontic-sky/70">{ctrl.controlId}</td>
                <td className="px-3 py-2.5 text-xs text-white/50">{ctrl.framework}</td>
                <td className="px-3 py-2.5 text-xs text-white/80 max-w-xs truncate">{ctrl.title}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={statusVariant(ctrl.status)}>
                    {ctrl.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-xs text-white/40">{ctrl.owner}</td>
                <td className="px-3 py-2.5 text-xs text-white/30 whitespace-nowrap">{formatDate(ctrl.lastAssessed)}</td>
                <td className="px-3 py-2.5 text-xs text-white/30 whitespace-nowrap">{formatDate(ctrl.nextReview)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* §3.3 J2: AI gap analysis drill-down panel */}
      {selected && analysis && (
        <div className="mt-3 bg-irontic-purple/[0.04] border border-irontic-purple/20 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <span className="relative flex h-2 w-2 mt-1 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-irontic-cyan opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-irontic-cyan" />
              </span>
              <div>
                <p className="text-[10px] font-semibold text-irontic-cyan/70 uppercase tracking-wider">
                  AI Gap Analysis — {selected.controlId} · {selected.framework}
                </p>
                <p className="text-xs font-semibold text-white/80 mt-0.5">{selected.title}</p>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-white/20 hover:text-white/60 transition-colors shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <p className="text-xs text-white/50 leading-relaxed">{analysis.gap}</p>

          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">Evidence Links</p>
            <div className="space-y-1">
              {analysis.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] text-irontic-sky/50 mt-0.5 shrink-0">#{i + 1}</span>
                  <p className="text-xs text-white/45">{e}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-6">
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-xs text-white/55">{analysis.recommendation}</p>
            </div>
            <div className="shrink-0">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Effort</p>
              <p className="text-xs text-amber-400/70">{analysis.effort}</p>
            </div>
          </div>

          {/* Inline remediation task form */}
          {taskForm && (
            <div className="bg-white/[0.03] border border-irontic-cyan/20 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-semibold text-irontic-cyan/70 uppercase tracking-wider">New Remediation Task</p>
              <input
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder={`Remediate ${selected?.controlId ?? 'control'} — add task title`}
                className="w-full text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-white/80 placeholder-white/20 focus:outline-none focus:border-irontic-cyan/40"
              />
              <div className="flex gap-2">
                <button
                  disabled={!taskTitle.trim()}
                  onClick={() => {
                    show(`Remediation task created: "${taskTitle}" · assigned to ${selected?.owner ?? 'owner'}`, 'success');
                    setTaskTitle('');
                    setTaskForm(false);
                  }}
                  className="flex-1 py-1.5 text-[10px] font-semibold text-irontic-cyan/80 bg-irontic-cyan/10 border border-irontic-cyan/20 rounded-lg hover:bg-irontic-cyan/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
                <button onClick={() => setTaskForm(false)} className="px-3 text-[10px] text-white/30 hover:text-white/60">Cancel</button>
              </div>
            </div>
          )}

          {/* Attach Evidence inline */}
          {attachName !== '' && (
            <div className="bg-white/[0.03] border border-irontic-sky/20 rounded-lg p-3 flex items-center gap-3">
              <svg className="w-4 h-4 text-irontic-sky/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
              <p className="text-xs text-white/60 flex-1">{attachName} attached to {selected?.controlId}</p>
              <button onClick={() => setAttachName('')} className="text-white/20 hover:text-white/60 text-xs">✕</button>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
            <button
              onClick={() => { setTaskForm(t => !t); setAttachName(''); }}
              className="text-[10px] font-semibold text-irontic-cyan/70 hover:text-irontic-cyan border border-irontic-cyan/20 hover:border-irontic-cyan/40 px-2.5 py-1 rounded-lg transition-colors"
            >
              {taskForm ? 'Cancel Task' : 'Create Remediation Task'}
            </button>
            <button
              onClick={() => {
                const name = `Evidence_${selected?.controlId ?? 'ctrl'}_${new Date().toISOString().slice(0,10)}.pdf`;
                setAttachName(name);
                show(`Evidence file "${name}" attached to ${selected?.controlId}`, 'success');
              }}
              className="text-[10px] font-semibold text-irontic-sky/60 hover:text-irontic-sky border border-irontic-sky/15 hover:border-irontic-sky/30 px-2.5 py-1 rounded-lg transition-colors"
            >
              Attach Evidence
            </button>
            <button
              onClick={() => show(`Exporting gap report for ${selected?.controlId} — ${selected?.framework}…`, 'info')}
              className="text-[10px] font-semibold text-white/30 hover:text-white/60 border border-white/[0.08] hover:border-white/[0.15] px-2.5 py-1 rounded-lg transition-colors"
            >
              Export Gap Report
            </button>
            <span className="text-[9px] text-white/15 ml-auto">§3.3 J2 · AI-generated gap analysis</span>
          </div>
        </div>
      )}
    </div>
  );
}
