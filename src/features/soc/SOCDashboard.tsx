'use client';
import { useState } from 'react';
import { useSOC } from '@/hooks/useSOC';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LineChart } from '@/app/charts/LineChart';
import { StackedBarChart } from '@/app/charts/StackedBarChart';
import { PageHeader } from '@/components/layout/PageHeader';
import { AlertFeed } from './AlertFeed';
import { AnalystWorkload } from './AnalystWorkload';
import { AutoRemediationLog } from './AutoRemediationLog';
import { Top10Tables } from './Top10Tables';
import { LiveTickerBar, LiveFeedPanel, LiveIndicator } from '@/components/ui/LiveTicker';
import { CIAStatusRow } from '@/components/ui/CIAIndicators';
import { DualApprovalModal, DualApprovalAction } from '@/components/ui/DualApprovalModal';
import { useToast } from '@/components/ui/Toast';

// 5-minute bucket alert volume — 24h window = 288 buckets (§20.2 SOC View)
// Displayed as 48 representative points (every 30 min) for readability
const ALERT_VOLUME_5MIN = Array.from({ length: 48 }, (_, i) => {
  const hrsAgo = 24 - i * 0.5;
  const isPeak = (hrsAgo >= 13.5 && hrsAgo <= 14.5) || (hrsAgo >= 1.5 && hrsAgo <= 2.5);
  return {
    time: `${String(Math.floor(hrsAgo)).padStart(2,'0')}:${i % 2 === 0 ? '00' : '30'}`,
    critical: isPeak ? Math.floor(Math.random() * 6 + 4) : Math.floor(Math.random() * 3),
    high:     isPeak ? Math.floor(Math.random() * 14 + 8) : Math.floor(Math.random() * 8),
    medium:   isPeak ? Math.floor(Math.random() * 22 + 12) : Math.floor(Math.random() * 15),
    low:      isPeak ? Math.floor(Math.random() * 18 + 8) : Math.floor(Math.random() * 12),
  };
});

type SocTab = 'alerts' | 'mitre' | 'top10' | 'workload' | 'remlog';

const SOC_TABS: { id: SocTab; label: string }[] = [
  { id:'alerts',   label:'Alert Queue'       },
  { id:'mitre',    label:'MITRE ATT&CK'      },
  { id:'top10',    label:'Top 10 Tables'     },
  { id:'workload', label:'Analyst Workload'  },
  { id:'remlog',   label:'Auto-Remediation'  },
];

export function SOCDashboard() {
  const { data, agentState, findings, loading, triageAlert, huntThreats, correlateEvents } = useSOC();
  const [activeTab, setActiveTab] = useState<SocTab>('alerts');
  const [mitreFilter, setMitreFilter] = useState<string | null>(null);
  const [dualApprovalAction, setDualApprovalAction] = useState<DualApprovalAction | null>(null);
  const { show } = useToast();

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500 dark:text-white/30 text-sm">Loading SOC data…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Operations Center"
        subtitle="Real-time threat monitoring and incident response"
        agentStatus={agentState.status}
        action={
          <div className="flex items-center gap-2">
            <LiveIndicator />
            <Button size="sm" variant="secondary" onClick={() => correlateEvents()}>Correlate</Button>
            <Button size="sm" variant="secondary" onClick={() => huntThreats()}>Hunt Threats</Button>
            <Button size="sm" onClick={() => triageAlert()}>Auto Triage</Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDualApprovalAction({
                id: 'bulk-close',
                label: 'Bulk Close All New Alerts',
                description: `Close all ${data?.activeAlerts.filter(a => a.status === 'new').length ?? 0} new alerts — this action cannot be undone.`,
                impact: 'high',
              })}
            >
              Bulk Close…
            </Button>
          </div>
        }
      />

      {/* Live ticker */}
      <LiveTickerBar />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Alerts (24h)',    value: data?.alertsLast24h ?? 0,        sub: 'last 24 hours',        color: 'text-slate-900 dark:text-white/90'  },
          { label: 'Critical Alerts', value: data?.criticalAlerts ?? 0,       sub: 'need action',           color: 'text-red-400'   },
          { label: 'Open Incidents',  value: data?.openIncidents.length ?? 0, sub: 'in progress',           color: 'text-orange-400'},
          { label: 'MTTR',           value: `${data?.mttr ?? 0}m`,            sub: 'mean time to respond',  color: 'text-green-400' },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs text-slate-600 dark:text-white/35">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-white/30 mt-0.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alert trend */}
        <Card className="lg:col-span-2">
          <CardHeader title="Alert Volume (24h)" subtitle="Alerts per hour" />
          <LineChart
            data={data?.alertTrend ?? []}
            xKey="hour"
            lines={[{ key: 'count', color: '#22D3EE', label: 'Alerts' }]}
            height={180}
          />
        </Card>

        {/* Severity breakdown */}
        <Card>
          <CardHeader title="Severity Breakdown" />
          <div className="space-y-2.5 mt-2">
            {Object.entries(data?.severityBreakdown ?? {}).map(([sev, count]) => {
              const total = Object.values(data?.severityBreakdown ?? {}).reduce((a, b) => a + b, 0);
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={sev}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={sev as 'critical' | 'high' | 'medium' | 'low' | 'info'}>{sev}</Badge>
                    <span className="text-sm font-semibold text-slate-700 dark:text-white/70">{count}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/5 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full ${sev === 'critical' ? 'bg-red-500' : sev === 'high' ? 'bg-orange-400' : sev === 'medium' ? 'bg-amber-400' : sev === 'low' ? 'bg-blue-400' : 'bg-slate-300 dark:bg-white/20'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Alert volume histogram — 5-min buckets (§20.2 SOC View) */}
      <Card>
        <CardHeader
          title="Alert Volume — 24h Window (30-min buckets)"
          subtitle="Peak annotation enabled · WebSocket push every 30s · §20.2"
        />
        <StackedBarChart
          data={ALERT_VOLUME_5MIN}
          xKey="time"
          stacks={[
            { key:'critical', color:'#ef4444', label:'Critical' },
            { key:'high',     color:'#f97316', label:'High'     },
            { key:'medium',   color:'#eab308', label:'Medium'   },
            { key:'low',      color:'#3b82f6', label:'Low'      },
          ]}
          height={150}
          showLegend
        />
      </Card>

      {/* Tabbed SOC sub-sections */}
      <Card padding="none">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 dark:border-white/[0.06]">
          {SOC_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === t.id
                  ? 'text-irontic-cyan border-irontic-cyan bg-slate-100 dark:bg-white/[0.02]'
                  : 'text-slate-500 dark:text-white/30 border-transparent hover:text-slate-800 dark:hover:text-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'alerts'   && (
            <>
              {mitreFilter && (
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-[10px] text-slate-500 dark:text-white/30">Filtered by technique:</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-irontic-purple/15 border border-irontic-purple/30 text-irontic-sky">{mitreFilter}</span>
                  <button onClick={() => setMitreFilter(null)} className="text-[10px] text-slate-500 dark:text-white/25 hover:text-slate-800 dark:hover:text-white/60 transition-colors">✕ Clear</button>
                </div>
              )}
              <AlertFeed
                alerts={(data?.activeAlerts ?? []).filter(a =>
                  !mitreFilter || (a.mitreTechnique ?? '').includes(mitreFilter)
                )}
                onTriage={triageAlert}
                showSearch
              />
            </>
          )}
          {activeTab === 'mitre' && (
            <MitreOverlay
              onTechniqueClick={(t) => {
                setMitreFilter(t);
                setActiveTab('alerts');
              }}
            />
          )}
          {activeTab === 'top10'    && <Top10Tables />}
          {activeTab === 'workload' && <AnalystWorkload />}
          {activeTab === 'remlog'   && <AutoRemediationLog />}
        </div>
      </Card>

      {/* Live feed panel */}
      <LiveFeedPanel maxVisible={10} />

      {/* Open Incidents */}
      <Card>
        <CardHeader title="Open Incidents" subtitle={`${data?.openIncidents.length ?? 0} active`} />
        <div className="divide-y divide-slate-200 dark:divide-white/[0.05]">
          {(data?.openIncidents ?? []).length === 0
            ? <p className="text-sm text-slate-500 dark:text-white/30 py-4 text-center">No open incidents</p>
            : data?.openIncidents.map(inc => (
              <div key={inc.id} className="py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white/90">{inc.title}</p>
                    <p className="text-xs text-slate-600 dark:text-white/35 mt-1">{inc.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={inc.severity === 'critical' ? 'critical' : 'high'}>{inc.severity}</Badge>
                    <Badge variant="medium">{inc.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-slate-500 dark:text-white/30">{inc.affectedSystems.length} systems affected</span>
                  <span className="text-xs text-slate-500 dark:text-white/30">{inc.timeline.length} timeline events</span>
                  {inc.assignedTeam && <span className="text-xs text-irontic-sky/60">→ {inc.assignedTeam}</span>}
                </div>
                <div className="mt-3 space-y-1.5 pl-3 border-l border-slate-200 dark:border-white/[0.08]">
                  {inc.timeline.slice(-3).map(ev => (
                    <div key={ev.id} className="flex items-start gap-2">
                      <span className="text-[10px] text-slate-500 dark:text-white/20 shrink-0 mt-0.5">
                        {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-white/40">
                        <span className="text-slate-800 dark:text-white/60 font-medium">{ev.actor}</span> — {ev.details}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      </Card>

      {/* Threat indicators */}
      {(data?.threatIndicators ?? []).length > 0 && (
        <Card>
          <CardHeader title="Threat Indicators (IOCs)" subtitle={`${data?.threatIndicators.length} active`} />
          <div className="divide-y divide-slate-200 dark:divide-white/[0.05]">
            {data?.threatIndicators.map(ioc => (
              <div key={ioc.id} className="py-2.5 flex items-center gap-3">
                <span className="text-[10px] font-semibold bg-irontic-purple/10 text-irontic-sky border border-irontic-purple/20 px-1.5 py-0.5 rounded uppercase">{ioc.type}</span>
                <code className="text-xs font-mono text-slate-700 dark:text-white/60 flex-1 truncate">{ioc.value}</code>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-500 dark:text-white/30">Conf: {ioc.confidence}%</span>
                  <Badge variant={ioc.severity === 'critical' ? 'critical' : ioc.severity === 'high' ? 'high' : 'medium'}>{ioc.severity}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Agent findings */}
      {findings.length > 0 && (
        <Card>
          <CardHeader title="Agent Findings" subtitle={`${findings.length} finding(s) from SOC agent`} />
          <div className="space-y-2">
            {findings.slice(0, 5).map(f => (
              <div key={f.id} className="flex items-start gap-3 py-2 border-b border-slate-200 dark:border-white/[0.04] last:border-0">
                <Badge variant={f.severity as 'critical' | 'high' | 'medium' | 'low' | 'info'}>{f.severity}</Badge>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white/80">{f.title}</p>
                  {f.recommendation && <p className="text-xs text-slate-600 dark:text-white/35 mt-0.5">{f.recommendation}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CIA Triad status footer */}
      <div className="rounded-xl border border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.015] px-4 py-3">
        <p className="text-[10px] font-semibold text-slate-500 dark:text-white/25 uppercase tracking-widest mb-2">Data Classification & Integrity</p>
        <CIAStatusRow tlp="RED" uptime={99.7} showAudit auditActor="SOC Agent" />
      </div>

      {/* §9.1 Dual-approval modal */}
      {dualApprovalAction && (
        <DualApprovalModal
          action={dualApprovalAction}
          onConfirmed={() => {
            setDualApprovalAction(null);
            show('Bulk close approved by two actors · alerts closed · audit trail updated', 'success');
          }}
          onCancel={() => setDualApprovalAction(null)}
        />
      )}
    </div>
  );
}

/** MITRE ATT&CK active techniques overlay — click to filter alert feed (§20.2 SOC View) */
function MitreOverlay({ onTechniqueClick }: { onTechniqueClick: (id: string) => void }) {
  const techniques = [
    { id:'T1059.001', name:'PowerShell',         count:8  },
    { id:'T1021.002', name:'SMB / Lateral',      count:3  },
    { id:'T1110.001', name:'Brute Force',        count:12 },
    { id:'T1071.004', name:'DNS Tunnel',         count:2  },
    { id:'T1611',     name:'Container Escape',   count:1  },
    { id:'T1190',     name:'Exploit Public App', count:5  },
    { id:'T1078',     name:'Valid Accounts',     count:7  },
    { id:'T1505',     name:'Server Component',   count:1  },
  ];
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-white/30 mb-3">Active techniques last 24h — click to filter alert feed</p>
      <div className="flex flex-wrap gap-2">
        {techniques.map(t => (
          <button
            key={t.id}
            onClick={() => onTechniqueClick(t.id)}
            className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.04] hover:bg-irontic-purple/10 border border-slate-200 dark:border-white/[0.08] hover:border-irontic-purple/30 rounded-lg px-2.5 py-1.5 transition-colors group"
          >
            <span className="text-[10px] font-mono text-irontic-sky">{t.id}</span>
            <span className="text-xs text-slate-700 dark:text-white/50 group-hover:text-slate-900 dark:group-hover:text-white/70">{t.name}</span>
            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 rounded font-bold">{t.count}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 dark:text-white/20 mt-3">↑ Click a technique to jump to Alert Queue filtered by that technique ID</p>
    </div>
  );
}
