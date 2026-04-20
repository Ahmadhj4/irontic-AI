"use client";

import { useState, useEffect } from 'react';
import { IncidentTimeline, TimelineIncident } from '@/features/dashboard/IncidentTimeline';
import { AgentTopology } from '@/features/dashboard/AgentTopology';
import { DraggableGrid } from '@/features/dashboard/DraggableGrid';
import { useToast } from '@/components/ui/Toast';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { DashboardStats } from '@/features/dashboard/DashboardStats';
import { DashboardCharts } from '@/features/dashboard/DashboardCharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { SOCDashboard } from '@/features/soc/SOCDashboard';
import { GRCDashboard } from '@/features/grc/GRCDashboard';
import { PentestDashboard } from '@/features/pentest/PentestDashboard';
import { AVDashboard } from '@/features/av/AVDashboard';
import { agentRouter } from '@/orchestrator';
import { contextBridge } from '@/mcp';
import { AgentFinding, AgentDomain } from '@/types';

// ── Four BRD domains ──────────────────────────────────────────────────────
const DOMAIN_LABELS: Record<AgentDomain, string> = {
  grc: 'GRC', soc: 'SOC', av: 'Endpoint Protection', pentest: 'Pentest',
};

const DOMAIN_DESCRIPTIONS: Record<AgentDomain, string> = {
  grc: 'Governance, Risk & Compliance',
  soc: 'Security Operations Center',
  av: 'Endpoint Protection',
  pentest: 'Penetration Testing',
};

// Static trend data
const TREND_DATA = [
  { date: 'Jan 13', grc: 64, soc: 61, pentest: 47, av: 73 },
  { date: 'Jan 20', grc: 67, soc: 65, pentest: 52, av: 76 },
  { date: 'Jan 27', grc: 70, soc: 63, pentest: 49, av: 78 },
  { date: 'Feb 3',  grc: 68, soc: 68, pentest: 55, av: 75 },
  { date: 'Feb 10', grc: 72, soc: 70, pentest: 58, av: 80 },
  { date: 'Feb 17', grc: 74, soc: 67, pentest: 54, av: 82 },
  { date: 'Feb 24', grc: 71, soc: 72, pentest: 61, av: 79 },
  { date: 'Mar 3',  grc: 75, soc: 74, pentest: 63, av: 84 },
  { date: 'Mar 10', grc: 73, soc: 77, pentest: 67, av: 81 },
  { date: 'Mar 17', grc: 76, soc: 76, pentest: 65, av: 85 },
];

function computeCRS(scores: Record<AgentDomain, number>): number {
  const soc_risk = 1 - (scores.soc ?? 75) / 100;
  const grc_risk = 1 - (scores.grc ?? 75) / 100;
  const av_risk  = 1 - (scores.av ?? 75) / 100;
  const pt_risk  = 1 - (scores.pentest ?? 75) / 100;
  const crs_raw = 0.30 * soc_risk + 0.25 * grc_risk + 0.25 * av_risk + 0.20 * pt_risk;
  return Math.round((1 - crs_raw) * 100);
}

function statusVariant(s: string): 'success' | 'critical' | 'medium' | 'neutral' {
  if (s === 'executing' || s === 'assigned' || s === 'reporting') return 'success';
  if (s === 'error') return 'critical';
  if (s === 'initializing') return 'medium';
  return 'neutral';
}

// Mock 24h incident data for timeline (FR-D3 §20.2)
const TIMELINE_INCIDENTS: TimelineIncident[] = [
  { id:'INC-881', title:'Lateral Movement',       severity:'critical', hoursAgo:0.03, domain:'SOC', asset:'WIN-SERVER-04' },
  { id:'INC-880', title:'PowerShell Execution',   severity:'high',     hoursAgo:0.13, domain:'SOC', asset:'WKSTN-089'     },
  { id:'INC-879', title:'Container Escape PoC',   severity:'critical', hoursAgo:0.57, domain:'PT',  asset:'k8s-node-03'   },
  { id:'INC-878', title:'MFA Brute Force',        severity:'medium',   hoursAgo:0.68, domain:'SOC', asset:'vpn-gw-01'     },
  { id:'INC-877', title:'ISO Gap A.9.4.2',        severity:'high',     hoursAgo:1.2,  domain:'GRC', asset:'Policy Docs'   },
  { id:'INC-876', title:'Ransomware IOC',         severity:'high',     hoursAgo:3.1,  domain:'SOC', asset:'SRV-FILE-01'   },
  { id:'INC-875', title:'Privilege Escalation',   severity:'critical', hoursAgo:5.4,  domain:'SOC', asset:'WIN-DC-01'     },
  { id:'INC-874', title:'Data Exfil Attempt',     severity:'high',     hoursAgo:8.2,  domain:'SOC', asset:'WKSTN-033'     },
  { id:'INC-873', title:'Phishing Email Cluster', severity:'medium',   hoursAgo:11.0, domain:'SOC', asset:'mail-gw-01'    },
  { id:'INC-872', title:'Endpoint EP Stale',      severity:'low',      hoursAgo:14.5, domain:'EP',  asset:'WKSTN-102'     },
  { id:'INC-871', title:'Compliance Gap PR.DS-1', severity:'high',     hoursAgo:17.3, domain:'GRC', asset:'DB-LEGACY-01'  },
  { id:'INC-870', title:'SSH Brute Force',        severity:'medium',   hoursAgo:20.1, domain:'SOC', asset:'bastion-01'    },
];

// 7-day MTTR trend
const MTTR_TREND = [
  { day:'Mon', mttr:38 }, { day:'Tue', mttr:34 }, { day:'Wed', mttr:29 },
  { day:'Thu', mttr:31 }, { day:'Fri', mttr:26 }, { day:'Sat', mttr:22 }, { day:'Sun', mttr:23 },
];

type ViewTab = 'ops' | 'soc' | 'grc' | 'pt' | 'av';
const VIEW_TABS: { id: ViewTab; label: string }[] = [
  { id: 'ops', label: 'Operations Center' },
  { id: 'soc', label: 'SOC View' },
  { id: 'grc', label: 'GRC View' },
  { id: 'av',  label: 'Endpoint View' },
  { id: 'pt',  label: 'PT View' },
];

export default function DashboardPage() {
  // Authentication
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const { show } = useToast();
  const [assignedAlerts, setAssignedAlerts] = useState<Set<string>>(new Set());
  const [agentStates, setAgentStates] = useState(agentRouter.getAllStates());
  const [sharedFindings, setSharedFindings] = useState<AgentFinding[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewTab>('ops');

  const [domainScores] = useState<Record<AgentDomain, number>>({
    grc: 76, soc: 72, av: 83, pentest: 62,
  });

  const crs = computeCRS(domainScores);

  useEffect(() => {
    const handler = (...args: unknown[]) => {
      const { findings } = args[0] as { from: AgentDomain; findings: AgentFinding[] };
      setSharedFindings(prev => {
        const existing = new Set(prev.map(f => f.id));
        return [...prev, ...findings.filter(f => !existing.has(f.id))];
      });
      setAgentStates(agentRouter.getAllStates());
    };
    (contextBridge as import('@/lib/EventEmitter').EventEmitter).on('finding_shared', handler as (...args: unknown[]) => void);
    return () => { (contextBridge as import('@/lib/EventEmitter').EventEmitter).off('finding_shared', handler as (...args: unknown[]) => void); };
  }, []);

  if (status === "loading") {
    return <div className="p-6 text-white">Loading dashboard...</div>;
  }

  const runFullScan = async () => {
    setScanning(true);
    try {
      await agentRouter.runFullScan();
      setAgentStates(agentRouter.getAllStates());
      setSharedFindings(contextBridge.getContext().sharedFindings as AgentFinding[]);
      setLastScan(new Date().toLocaleTimeString());
    } finally {
      setScanning(false);
    }
  };

  const domains: AgentDomain[] = ['grc', 'soc', 'av', 'pentest'];
  const insights = contextBridge.getCrossAgentInsights();
  const conflicts = agentRouter.getConflicts();

  const stats = domains.map(d => ({
    domain: d,
    label: DOMAIN_LABELS[d],
    score: domainScores[d],
    criticals: sharedFindings.filter(f => f.domain === d && f.severity === 'critical').length,
    agentState: agentStates[d],
  }));

  return (
    <div className="space-y-5">
      {/* Optional user info */}
      <div className="text-right text-xs text-white/40">
        👤 {session?.user?.email} ({session?.user?.role})
      </div>

      <PageHeader
        title="Security Operations Center"
        subtitle="Unified view — GRC · SOC · EP · Pentest"
        action={
          <div className="flex items-center gap-3">
            {lastScan && <span className="text-xs text-white/30">Last scan: {lastScan}</span>}
            <Button onClick={runFullScan} loading={scanning}>
              {scanning ? 'Scanning…' : 'Run Full Scan'}
            </Button>
          </div>
        }
      />

      {/* Composite Risk Score + Critical Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col items-center justify-center py-6 gap-2 lg:col-span-1">
          <ScoreGauge score={crs} size="md" />
          <p className="text-xs font-bold text-white/80 tracking-wide">Composite Risk Score</p>
          <p className="text-[10px] text-white/30 text-center max-w-[120px]">
            Weighted: SOC 30% · GRC 25% · AV 25% · PT 20%
          </p>
        </Card>

        <div className="lg:col-span-3 space-y-3">
          {insights.criticalFindings.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <span className="text-red-400 text-lg mt-0.5">⚠</span>
              <div>
                <p className="text-sm font-semibold text-red-300">
                  {insights.criticalFindings.length} critical finding{insights.criticalFindings.length > 1 ? 's' : ''} across agents
                </p>
                <p className="text-xs text-red-400 mt-0.5">
                  {insights.criticalFindings.slice(0, 2).map(f => f.title).join(' · ')}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            {domains.map(d => (
              <Card key={d} className="py-3 px-3">
                <p className="text-[10px] text-white/40 font-semibold tracking-widest uppercase mb-1">{DOMAIN_LABELS[d]}</p>
                <p className="text-xl font-bold text-white/90">{domainScores[d]}</p>
                <p className="text-[9px] text-white/25 mt-0.5">{DOMAIN_DESCRIPTIONS[d]}</p>
              </Card>
            ))}
          </div>

          {/* §18.4 Auto-resolution rate widget */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Auto-Resolution Rate', value: '89%', sub: '312 of 350 alerts today', good: true },
              { label: 'Mean MTTR', value: '23 min', sub: 'Target ≤30 min ✓', good: true },
              { label: 'Open Incidents', value: '12', sub: '3 critical · 9 high', good: false },
            ].map(stat => (
              <Card key={stat.label} className="py-2.5 px-3">
                <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.good ? 'text-irontic-cyan' : 'text-amber-400'}`}>{stat.value}</p>
                <p className="text-[9px] text-white/25 mt-0.5">{stat.sub}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Role-Based View Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit">
        {VIEW_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
              activeView === tab.id
                ? 'bg-irontic-purple/30 text-white border border-irontic-purple/40'
                : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Operations Center View */}
      {activeView === 'ops' && (
        <div className="space-y-4">
          <DashboardStats stats={stats} />

          {/* Integration Health Panel — circuit breaker state (§20.2 Operations Center) */}
          <IntegrationHealthPanel />

          {/* §20.2 — Real-time alert feed: severity badges, domain tags, one-click assign */}
          <Card>
            <CardHeader title="Real-Time Alert Feed" subtitle="Cross-domain · severity-ranked · one-click assign" />
            <div className="mt-2 divide-y divide-white/[0.04]">
              {TIMELINE_INCIDENTS.slice(0, 8).map(inc => (
                <div key={inc.id} className="flex items-center gap-3 py-2.5">
                  <Badge variant={inc.severity as 'critical'|'high'|'medium'|'low'}>{inc.severity.toUpperCase()}</Badge>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-irontic-sky/70">{inc.domain}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 font-medium truncate">{inc.title}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{inc.asset} · {inc.hoursAgo < 1 ? `${Math.round(inc.hoursAgo * 60)}m ago` : `${inc.hoursAgo.toFixed(1)}h ago`}</p>
                  </div>
                  <button
                    disabled={assignedAlerts.has(inc.id)}
                    onClick={() => {
                      setAssignedAlerts(s => new Set([...s, inc.id]));
                      show(`${inc.id} assigned to on-call analyst`, 'success');
                    }}
                    className="shrink-0 text-[10px] font-semibold border px-2 py-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-irontic-cyan/70 hover:text-irontic-cyan border-irontic-cyan/20 hover:border-irontic-cyan/40"
                  >
                    {assignedAlerts.has(inc.id) ? '✓ Assigned' : 'Assign'}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Incident Timeline — horizontal 24h scroll (FR-D3 §20.2) */}
          <IncidentTimeline incidents={TIMELINE_INCIDENTS} />

          {/* §FR-D2 Draggable widget grid */}
          <DraggableGrid crs={crs} />

          {/* §20.1 Force-directed agent topology */}
          <AgentTopology />

          <DashboardCharts trendData={TREND_DATA} recentFindings={sharedFindings} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* §20.2 — Live agent status grid: state, queue depth, last action, health score */}
            <Card>
              <CardHeader title="Agent Status Grid" subtitle="Live orchestrator — 4 domains" />
              <div className="space-y-2 mt-2">
                {domains.map(d => {
                  const s = agentStates[d];
                  const healthScore = Math.round(s.metrics.successRate * 100);
                  const queueDepth  = s.tasksFailed > 0 ? s.tasksFailed : 0;
                  const lastAction  = s.tasksCompleted > 0
                    ? `${s.tasksCompleted} task${s.tasksCompleted !== 1 ? 's' : ''} completed`
                    : 'Idle';
                  return (
                    <div key={d} className="p-2.5 rounded-lg bg-white/[0.025] border border-white/[0.05]">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold text-white/80">{DOMAIN_LABELS[d]} Agent</p>
                        <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div>
                          <p className="text-[10px] text-white/25">Queue</p>
                          <p className="text-xs font-bold text-white/70">{queueDepth}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/25">Health</p>
                          <p className={`text-xs font-bold ${healthScore >= 80 ? 'text-irontic-cyan' : healthScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{healthScore}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/25">Last Action</p>
                          <p className="text-[10px] text-white/50 truncate">{lastAction}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHeader title="Task Queue" subtitle={`${agentRouter.getQueueSize()} pending`} />
              <div className="mt-3 text-center py-3">
                <p className="text-4xl font-bold text-white/90">{agentRouter.getQueueSize()}</p>
                <p className="text-xs text-white/25 mt-1">tasks queued</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {domains.map(d => (
                  <div key={d} className="bg-white/[0.03] rounded-lg px-2 py-1.5">
                    <p className="text-[10px] text-irontic-cyan/70 font-semibold">{DOMAIN_LABELS[d]}</p>
                    <p className="text-xs text-white/50">
                      {agentStates[d].tasksCompleted}✓ {agentStates[d].tasksFailed}✗
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Conflict Detector" subtitle={`${conflicts.length} detected`} />
              {conflicts.length === 0 ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-irontic-cyan opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-irontic-cyan" />
                  </span>
                  <p className="text-xs text-white/40">All agents coordinated — no conflicts</p>
                </div>
              ) : (
                conflicts.map(c => (
                  <div key={c.id} className="py-2 border-b border-white/[0.05] last:border-0">
                    <p className="text-xs font-medium text-amber-400">{c.type.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{c.resolution}</p>
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      )}

      {/* SOC View — full §20.2 feature set (MITRE, histogram, top10, workload, remlog) */}
      {activeView === 'soc' && <SOCDashboard />}

      {/* GRC View — full §20.2 feature set (heatmap, sparklines, calendar, evidence) */}
      {activeView === 'grc' && <GRCDashboard />}

      {/* AV View — full feature set */}
      {activeView === 'av' && <AVDashboard />}

      {/* PT View — full §20.2 feature set (engagement, donut, CVE table, scope mgmt) */}
      {activeView === 'pt' && <PentestDashboard />}
    </div>
  );
}

// ── Integration Health Panel — §20.2 Operations Center ───────────────────────
// Shows circuit breaker state per external integration (§19.3).
// Operators can manually reset tripped/degraded circuits via the Reset button.
type CircuitState = 'closed' | 'open' | 'half_open';

interface IntegrationDef { name: string; type: string; phase: 1|2; state: CircuitState; latencyMs: number; uptime: number }

const INTEGRATION_DEFAULTS: IntegrationDef[] = [
  // §15.1 Phase 1 integrations
  { name: 'Elastic SIEM',      type: 'SIEM',     phase:1, state: 'closed',    latencyMs: 42,  uptime: 99.8 },
  { name: 'ServiceNow',        type: 'Ticketing',phase:1, state: 'closed',    latencyMs: 95,  uptime: 99.5 },
  { name: 'CrowdStrike Falcon',type: 'EDR',      phase:1, state: 'closed',    latencyMs: 38,  uptime: 99.9 },
  // Phase 2 integrations
  { name: 'SentinelOne',       type: 'EDR',      phase:2, state: 'half_open', latencyMs: 310, uptime: 97.1 },
  { name: 'Microsoft Teams',   type: 'Notify',   phase:2, state: 'closed',    latencyMs: 61,  uptime: 99.7 },
  { name: 'Qualys VMDR',       type: 'Vuln',     phase:2, state: 'open',      latencyMs: 0,   uptime: 88.2 },
];

const CIRCUIT_META: Record<CircuitState, { label: string; dot: string; badge: string }> = {
  closed:    { label: 'Healthy',  dot: 'bg-irontic-cyan', badge: 'text-irontic-cyan/80 bg-irontic-cyan/10 border-irontic-cyan/20' },
  half_open: { label: 'Degraded', dot: 'bg-amber-400',    badge: 'text-amber-400/80 bg-amber-400/10 border-amber-400/20'         },
  open:      { label: 'Tripped',  dot: 'bg-red-500',      badge: 'text-red-400/80 bg-red-500/10 border-red-500/20'               },
};

function IntegrationHealthPanel() {
  const [states, setStates] = useState<Record<string, CircuitState>>(
    Object.fromEntries(INTEGRATION_DEFAULTS.map(i => [i.name, i.state]))
  );

  const reset = (name: string) =>
    setStates(prev => ({ ...prev, [name]: 'closed' }));

  return (
    <Card>
      <CardHeader
        title="Integration Health"
        subtitle="Circuit breaker state per external system · Phase 1 integrations highlighted · §19.3"
      />
      <div className="mt-3 grid grid-cols-2 lg:grid-cols-3 gap-3">
        {INTEGRATION_DEFAULTS.map(intg => {
          const state = states[intg.name];
          const meta  = CIRCUIT_META[state];
          const canReset = state !== 'closed';
          return (
            <div
              key={intg.name}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                intg.phase === 1
                  ? 'bg-irontic-purple/[0.04] border-irontic-purple/20'
                  : 'bg-white/[0.025] border-white/[0.06]'
              }`}
            >
              <span className="mt-0.5 relative flex h-2.5 w-2.5 shrink-0">
                {state === 'closed' && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${meta.dot} opacity-50`} />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${meta.dot}`} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-white/80 truncate">{intg.name}</p>
                  {intg.phase === 1 && (
                    <span className="text-[8px] font-bold text-irontic-purple/60 bg-irontic-purple/10 px-1 rounded">P1</span>
                  )}
                </div>
                <p className="text-[10px] text-white/30 mt-0.5">{intg.type}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${meta.badge}`}>{meta.label}</span>
                  {state !== 'open' && <span className="text-[9px] text-white/25">{intg.latencyMs}ms</span>}
                  <span className="text-[9px] text-white/20">{intg.uptime}% up</span>
                </div>
                {/* §19.3 manual circuit reset */}
                {canReset && (
                  <button
                    onClick={() => reset(intg.name)}
                    className="mt-2 text-[9px] font-semibold text-amber-400/70 hover:text-amber-300 border border-amber-500/20 hover:border-amber-400/40 px-2 py-0.5 rounded transition-colors"
                  >
                    ↺ Reset Circuit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}