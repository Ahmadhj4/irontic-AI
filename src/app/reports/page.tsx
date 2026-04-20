'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';

// §3.1: Reports — all roles, but scoped to role-relevant types
const ALL_REPORTS = [
  { title:'ISO 27001 Compliance Gap Report',    type:'GRC',       date:'14 Apr 2026', status:'READY',      size:'2.4 MB', roles:['admin','security_engineer','grc_analyst']                          },
  { title:'NIST CSF 2.0 Assessment',            type:'GRC',       date:'12 Apr 2026', status:'READY',      size:'1.8 MB', roles:['admin','security_engineer','grc_analyst']                          },
  { title:'SOC Alert Summary — Week 15',        type:'SOC',       date:'13 Apr 2026', status:'READY',      size:'890 KB', roles:['admin','security_engineer','soc','soc_lead']                       },
  { title:'PT Engagement ENG-APR-003 Report',   type:'PT',        date:'14 Apr 2026', status:'GENERATING', size:'—',      roles:['admin','security_engineer','pentester']                            },
  { title:'Executive Risk Briefing — Apr 2026', type:'EXECUTIVE', date:'10 Apr 2026', status:'READY',      size:'1.1 MB', roles:['admin','security_engineer','executive','soc_lead','grc_analyst']   },
  { title:'Endpoint Protection Health Summary', type:'EP',        date:'11 Apr 2026', status:'READY',      size:'640 KB', roles:['admin','security_engineer']                                        },
  { title:'MTTR & SLA Compliance Report',       type:'SOC',       date:'09 Apr 2026', status:'READY',      size:'430 KB', roles:['admin','security_engineer','soc_lead']                             },
  { title:'GRC Evidence Package — SOC 2 Type II',type:'GRC',      date:'08 Apr 2026', status:'READY',      size:'3.1 MB', roles:['admin','security_engineer','grc_analyst']                         },
];

const TYPE_COLORS: Record<string, string> = {
  GRC:      'bg-purple-500/15 text-purple-400 border-purple-500/25',
  SOC:      'bg-blue-500/15 text-blue-400 border-blue-500/25',
  PT:       'bg-orange-500/15 text-orange-400 border-orange-500/25',
  EXECUTIVE:'bg-irontic-sky/10 text-irontic-sky border-irontic-sky/20',
  EP:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const REPORT_TYPES = ['GRC', 'SOC', 'PT', 'EXECUTIVE', 'EP'] as const;

export default function ReportsPage() {
  const { data: session } = useSession();
  const role = (session?.user?.role as string) ?? '';
  const { show } = useToast();

  const [showGenForm, setShowGenForm] = useState(false);
  const [genType, setGenType] = useState<string>('GRC');
  const [genTitle, setGenTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [extraReports, setExtraReports] = useState<typeof ALL_REPORTS>([]);

  // §3.1: scoped by role — each user sees only their relevant report types
  const baseReports = ALL_REPORTS.filter(r =>
    r.roles.includes(role) || role === 'admin' || role === 'security_engineer'
  );
  const reports = [...baseReports, ...extraReports];

  const handleGenerate = () => {
    if (!genTitle.trim()) return;
    setGenerating(true);
    show(`Generating "${genTitle}" with AI agent…`, 'info');
    setTimeout(() => {
      setExtraReports(p => [{
        title: genTitle,
        type: genType,
        date: new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }),
        status: 'READY',
        size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
        roles: ['admin', 'security_engineer', role],
      }, ...p]);
      setGenerating(false);
      setShowGenForm(false);
      setGenTitle('');
      show(`Report "${genTitle}" is ready — download available`, 'success');
    }, 2000);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Compliance reports · Risk summaries · Executive briefings · Scoped to your role"
        action={
          <button
            onClick={() => setShowGenForm(s => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-irontic-cyan/10 hover:bg-irontic-cyan/20 text-irontic-cyan border border-irontic-cyan/25 rounded-lg px-3 py-1.5 transition-colors"
          >
            {showGenForm ? '✕ Cancel' : '+ Generate Report'}
          </button>
        }
      />

      {/* Generate report form */}
      {showGenForm && (
        <Card>
          <CardHeader title="Generate New Report" subtitle="AI agent will compile data from all active domains" />
          <div className="mt-3 space-y-3">
            <div className="flex gap-2 flex-wrap">
              {REPORT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setGenType(t)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    genType === t
                      ? 'bg-irontic-purple/20 text-irontic-sky border-irontic-purple/40'
                      : 'text-white/30 border-white/[0.08] hover:text-white/60'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              value={genTitle}
              onChange={e => setGenTitle(e.target.value)}
              placeholder="Report title (e.g. Weekly SOC Summary — Apr 2026)"
              className="w-full text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/80 placeholder-white/20 focus:outline-none focus:border-irontic-cyan/40"
            />
            <button
              disabled={!genTitle.trim() || generating}
              onClick={handleGenerate}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-irontic-purple/20 hover:bg-irontic-purple/30 text-irontic-purple border border-irontic-purple/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-irontic-purple border-t-transparent animate-spin" />
                  Generating with AI agent…
                </>
              ) : 'Generate Report'}
            </button>
          </div>
        </Card>
      )}

      {reports.length === 0 && (
        <div className="text-center py-12 text-white/30 text-sm">No reports available for your role.</div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {reports.map((r, i) => (
          <Card key={i} glow>
            <div className="flex items-start justify-between mb-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${TYPE_COLORS[r.type] ?? ''}`}>{r.type}</span>
              <Badge variant={r.status === 'READY' ? 'success' : 'medium'}>{r.status}</Badge>
            </div>
            <p className="text-sm font-semibold text-white/90 mb-2 leading-snug">{r.title}</p>
            <div className="flex justify-between text-xs text-white/30 mb-3"><span>{r.date}</span><span>{r.size}</span></div>
            {r.status === 'READY' ? (
              <button
                onClick={() => show(`Downloading ${r.title} (${r.size})…`, 'info')}
                className="w-full py-1.5 text-xs font-semibold text-irontic-sky/60 hover:text-irontic-cyan bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                ↓ Download PDF
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                Generating with AI agent…
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
