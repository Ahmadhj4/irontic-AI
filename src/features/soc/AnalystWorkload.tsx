'use client';
import { SLATimer } from '@/components/ui/SLATimer';

interface AnalystRow {
  name: string;
  open: number;
  triage: number;
  slaMinsRemaining: number;
  breached: boolean;
}

const MOCK_ANALYSTS: AnalystRow[] = [
  { name:'J. Smith',     open:8,  triage:3, slaMinsRemaining:42, breached:false },
  { name:'A. Hassan',    open:12, triage:5, slaMinsRemaining:18, breached:false },
  { name:'R. Chen',      open:4,  triage:1, slaMinsRemaining:6,  breached:true  },
  { name:'K. Al-Khatib', open:7,  triage:2, slaMinsRemaining:55, breached:false },
  { name:'S. Patel',     open:3,  triage:3, slaMinsRemaining:72, breached:false },
];

/**
 * Analyst Workload panel (§20.2 SOC View).
 * Displays open alert counts per assigned analyst with live SLA countdown timers.
 */
export function AnalystWorkload() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-white/[0.06]">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white/90">Analyst Workload</h3>
        <p className="text-xs text-slate-500 dark:text-white/30 mt-0.5">Open alert counts · SLA: 4h response · Live countdown</p>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/[0.05]">
            {['Analyst', 'Open', 'In Triage', 'SLA Remaining', 'Status'].map(h => (
              <th key={h} className="text-left text-[10px] font-semibold text-slate-500 dark:text-white/30 uppercase tracking-wider px-4 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
          {MOCK_ANALYSTS.map(a => (
            <tr key={a.name} className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${a.breached ? 'bg-red-500/[0.03]' : ''}`}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-irontic-purple to-irontic-indigo flex items-center justify-center text-[10px] font-bold text-white/80 shrink-0">
                    {a.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-800 dark:text-white/80">{a.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-red-400">{a.open}</td>
              <td className="px-4 py-3 text-sm font-semibold text-yellow-400">{a.triage}</td>
              <td className="px-4 py-3">
                {a.breached
                  ? <span className="text-xs font-bold text-red-500">BREACHED</span>
                  : <SLATimer totalMins={a.slaMinsRemaining} showLabel />
                }
              </td>
              <td className="px-4 py-3">
                {a.breached ? (
                  <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded border font-semibold bg-red-500/15 text-red-400 border-red-500/30">
                    ⚠ SLA BREACHED
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded border font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    ON TIME
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
