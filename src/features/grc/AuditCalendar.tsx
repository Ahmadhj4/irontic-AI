'use client';

interface AuditDeadline {
  date: string;
  framework: string;
  type: 'Internal' | 'External' | 'Self-assess';
  daysLeft: number;
}

const DEADLINES: AuditDeadline[] = [
  { date:'Apr 28', framework:'ISO 27001',     type:'Internal',   daysLeft:14 },
  { date:'May 10', framework:'SOC 2 Type II', type:'External',   daysLeft:26 },
  { date:'May 22', framework:'NIST CSF 2.0',  type:'Self-assess',daysLeft:38 },
  { date:'Jun 15', framework:'ISO 27001',     type:'External',   daysLeft:62 },
  { date:'Jul 01', framework:'CIS Controls',  type:'Internal',   daysLeft:78 },
];

function urgencyColor(days: number) {
  if (days <= 14) return 'text-red-400';
  if (days <= 30) return 'text-yellow-400';
  return 'text-emerald-400';
}

function urgencyBg(days: number) {
  if (days <= 14) return 'border-red-500/20 bg-red-500/5';
  if (days <= 30) return 'border-yellow-500/20 bg-yellow-500/5';
  return 'border-white/[0.06] bg-white/[0.02]';
}

function barWidth(days: number) {
  return `${Math.min(100, Math.max(5, (days / 90) * 100))}%`;
}

function typeVariant(type: string) {
  if (type === 'External') return 'bg-irontic-purple/15 text-irontic-sky border-irontic-purple/25';
  if (type === 'Internal') return 'bg-white/[0.06] text-white/50 border-white/[0.08]';
  return 'bg-irontic-cyan/10 text-irontic-cyan border-irontic-cyan/20';
}

/**
 * Upcoming audit deadlines calendar widget (§20.2 GRC View — next 90 days).
 */
export function AuditCalendar() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90">Upcoming Audit Deadlines</h3>
          <p className="text-xs text-white/30 mt-0.5">Next 90 days</p>
        </div>
        <button className="text-xs text-irontic-sky/60 hover:text-irontic-cyan transition-colors flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Add to Calendar
        </button>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {DEADLINES.map(d => (
          <div key={d.date + d.framework} className={`px-5 py-3.5 flex items-center gap-4 border-l-2 ${urgencyBg(d.daysLeft)} ${d.daysLeft <= 14 ? 'border-l-red-500/50' : d.daysLeft <= 30 ? 'border-l-yellow-500/40' : 'border-l-transparent'}`}>
            {/* Date chip */}
            <div className="w-16 shrink-0 text-center">
              <p className="text-[10px] text-white/25">Date</p>
              <p className="text-sm font-bold text-white/80">{d.date}</p>
            </div>

            {/* Framework + type */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white/90">{d.framework}</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium mt-0.5 ${typeVariant(d.type)}`}>
                {d.type}
              </span>
            </div>

            {/* Days remaining + bar */}
            <div className="w-40 shrink-0">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-white/25">Progress</span>
                <span className={`font-bold ${urgencyColor(d.daysLeft)}`}>{d.daysLeft} days</span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${d.daysLeft <= 14 ? 'bg-red-500' : d.daysLeft <= 30 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                  style={{ width: barWidth(d.daysLeft) }}
                />
              </div>
            </div>

            {/* Action */}
            <button className="shrink-0 text-xs text-irontic-sky/50 hover:text-irontic-cyan transition-colors">
              Schedule →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
