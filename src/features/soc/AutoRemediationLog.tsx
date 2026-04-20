'use client';

interface RemediationEntry {
  id: string;
  playbook: string;
  trigger: string;
  outcome: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  elapsed: string;
  agent: string;
  ts: string;
}

const MOCK_LOG: RemediationEntry[] = [
  { id:'REM-201', playbook:'PB-ISOLATE-HOST',    trigger:'ALT-2401', outcome:'SUCCESS', elapsed:'1m 12s', agent:'SOC Agent', ts:'09:38' },
  { id:'REM-200', playbook:'PB-BLOCK-IP',        trigger:'ALT-2406', outcome:'SUCCESS', elapsed:'23s',    agent:'SOC Agent', ts:'09:12' },
  { id:'REM-199', playbook:'PB-FORCE-MFA-RESET', trigger:'ALT-2406', outcome:'SUCCESS', elapsed:'45s',    agent:'SOC Agent', ts:'09:11' },
  { id:'REM-198', playbook:'PB-QUARANTINE-FILE', trigger:'ALT-2389', outcome:'FAILED',  elapsed:'3m 02s', agent:'SOC Agent', ts:'08:55' },
  { id:'REM-197', playbook:'PB-UPDATE-AV-DEFS',  trigger:'ALT-2371', outcome:'SUCCESS', elapsed:'8m 44s', agent:'AV Agent',  ts:'07:30' },
];

function outcomeStyle(o: RemediationEntry['outcome']) {
  if (o === 'SUCCESS') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
  if (o === 'FAILED')  return 'bg-red-500/15 text-red-400 border-red-500/25';
  return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25';
}

/**
 * Auto-remediation log (§20.2 SOC View).
 * Lists playbook executions with outcome and elapsed time.
 * Only playbooks with confidence ≥ 0.92 execute automatically.
 */
export function AutoRemediationLog() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white/90">Auto-Remediation Log</h3>
          <p className="text-xs text-slate-500 dark:text-white/30 mt-0.5">Automated playbooks · confidence ≥ 0.92 required for auto-execute</p>
        </div>
        <button className="text-xs text-irontic-sky/50 hover:text-irontic-cyan transition-colors flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Export
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/[0.05]">
            {['ID', 'Playbook', 'Trigger', 'Outcome', 'Elapsed', 'Agent', 'Time'].map(h => (
              <th key={h} className="text-left text-[10px] font-semibold text-slate-500 dark:text-white/30 uppercase tracking-wider px-4 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
          {MOCK_LOG.map(r => (
            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-2.5 text-xs font-mono text-irontic-sky/70">{r.id}</td>
              <td className="px-4 py-2.5 text-xs font-mono text-slate-800 dark:text-white/70">{r.playbook}</td>
              <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-white/50">{r.trigger}</td>
              <td className="px-4 py-2.5">
                <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border font-semibold ${outcomeStyle(r.outcome)}`}>
                  {r.outcome}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs font-mono text-slate-700 dark:text-white/50">{r.elapsed}</td>
              <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-white/40">{r.agent}</td>
              <td className="px-4 py-2.5 text-xs font-mono text-slate-500 dark:text-white/30">{r.ts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
