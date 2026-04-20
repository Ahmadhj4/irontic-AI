'use client';
/**
 * Audit Log — /audit (§3.1 Navigation Structure)
 * Access role: Admin only
 * Immutable HMAC audit trail per §24 Security Architecture.
 */
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';

interface AuditEntry {
  id: string;
  time: string;
  principal: string;
  action: string;
  resource: string;
  decision: string;
  ip: string;
}

const AUDIT_LOG: AuditEntry[] = [
  { id:'AUD-8801', time:'14 Apr 09:42:11', principal:'ahmad.jarrar@irontic.ai',  action:'ALERT_ESCALATE',   resource:'ALT-2401',           decision:'APPROVED',      ip:'10.5.1.42' },
  { id:'AUD-8800', time:'14 Apr 09:38:05', principal:'soc-agent-001',            action:'PLAYBOOK_EXECUTE', resource:'PB-ISOLATE-HOST',    decision:'AUTO_APPROVED', ip:'internal'  },
  { id:'AUD-8799', time:'14 Apr 09:31:22', principal:'m.alrashid@irontic.ai',    action:'REPORT_GENERATE',  resource:'ISO27001-GAP-APR26', decision:'COMPLETED',     ip:'10.5.2.11' },
  { id:'AUD-8798', time:'14 Apr 09:15:44', principal:'admin',                    action:'AGENT_RESTART',    resource:'pt-001',             decision:'EXECUTED',      ip:'10.5.0.1'  },
  { id:'AUD-8797', time:'14 Apr 09:02:19', principal:'r.chen@irontic.ai',        action:'PT_SCOPE_APPROVE', resource:'ENG-2024-APR-003',   decision:'APPROVED',      ip:'10.5.3.88' },
  { id:'AUD-8796', time:'14 Apr 08:55:01', principal:'soc-agent-001',            action:'ALERT_CLOSE',      resource:'ALT-2389',           decision:'AUTO_APPROVED', ip:'internal'  },
  { id:'AUD-8795', time:'14 Apr 08:40:15', principal:'grc-agent-001',            action:'EVIDENCE_GENERATE',resource:'EVP-441',            decision:'COMPLETED',     ip:'internal'  },
  { id:'AUD-8794', time:'14 Apr 08:22:07', principal:'k.alkhatib@irontic.ai',    action:'ALERT_SNOOZE',     resource:'ALT-2380',           decision:'APPROVED',      ip:'10.5.1.55' },
];

const GOOD_DECISIONS = ['APPROVED','AUTO_APPROVED','COMPLETED','EXECUTED'];

function decisionVariant(d: string): 'success' | 'critical' | 'neutral' {
  if (GOOD_DECISIONS.includes(d)) return 'success';
  if (d === 'REJECTED') return 'critical';
  return 'neutral';
}

export default function AuditPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Log"
        subtitle="Immutable event trail · SHA-256 HMAC chain · Zero-trust non-repudiation (§24)"
        action={
          <button className="flex items-center gap-1.5 text-xs font-semibold text-irontic-sky/60 hover:text-irontic-cyan border border-irontic-sky/20 rounded-lg px-3 py-1.5 hover:border-irontic-cyan/30 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Events Today',      value:'8,801', color:'text-irontic-cyan',  sub:'Immutable chain' },
          { label:'High-Risk Actions', value:'12',    color:'text-amber-400',     sub:'Require review'  },
          { label:'Chain Integrity',   value:'VALID', color:'text-emerald-400',   sub:'HMAC SHA-256 OK' },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs text-white/35">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/25 mt-0.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Audit table */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white/90">Audit Trail</h3>
          <p className="text-xs text-white/30 mt-0.5">Every action by every principal — human or agent — logged with HMAC integrity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Event ID','Timestamp','Principal','Action','Resource','Decision','Source IP'].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {AUDIT_LOG.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-xs font-mono text-irontic-sky/70">{log.id}</td>
                  <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">{log.time}</td>
                  <td className="px-4 py-3 text-xs text-white/70">{log.principal}</td>
                  <td className="px-4 py-3 text-xs font-mono text-amber-400/80">{log.action}</td>
                  <td className="px-4 py-3 text-xs text-white/50">{log.resource}</td>
                  <td className="px-4 py-3">
                    <Badge variant={decisionVariant(log.decision)}>{log.decision}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-white/25">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
