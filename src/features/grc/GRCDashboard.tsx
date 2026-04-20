'use client';
import { useState } from 'react';
import { useGrc } from '@/hooks/useGrc';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { LineChart } from '@/app/charts/LineChart';
import { BarChart } from '@/app/charts/BarChart';
import { PageHeader } from '@/components/layout/PageHeader';
import { ComplianceHeatmap } from './ComplianceHeatmap';
import { RiskRegisterSparklines } from './RiskRegisterSparklines';
import { GRCImpactPanel } from './GRCImpactPanel';
import { AuditCalendar } from './AuditCalendar';
import { EvidencePackages } from './EvidencePackages';
import { ComplianceTable } from './ComplianceTable';

type GrcTab = 'overview' | 'heatmap' | 'register' | 'calendar' | 'evidence';
const GRC_TABS: { id: GrcTab; label: string }[] = [
  { id:'overview',  label:'Overview'           },
  { id:'heatmap',   label:'Posture Heatmap'    },
  { id:'register',  label:'Risk Register'      },
  { id:'calendar',  label:'Audit Calendar'     },
  { id:'evidence',  label:'Evidence Packages'  },
];

export function GRCDashboard() {
  const { data, agentState, findings, loading, runAssessment, runRiskEvaluation } = useGrc();
  const [activeTab, setActiveTab] = useState<GrcTab>('overview');

  if (loading) return <div className="flex items-center justify-center h-64 text-white/30 text-sm">Loading GRC data…</div>;

  const frameworkData = Object.entries(data?.frameworkScores ?? {}).map(([name, score]) => ({ name, score }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Governance, Risk & Compliance"
        subtitle="Compliance posture across frameworks"
        agentStatus={agentState.status}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => runRiskEvaluation()}>Evaluate Risks</Button>
            <Button size="sm" onClick={() => runAssessment()}>Run Assessment</Button>
          </div>
        }
      />

      {/* Top row: gauge + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col items-center justify-center py-6">
          <ScoreGauge score={data?.overallComplianceScore ?? 0} label="Overall Score" size="lg" />
        </Card>
        {[
          { label: 'Open Findings',  value: data?.openFindings ?? 0,    color: 'text-orange-600' },
          { label: 'Critical Risks', value: data?.criticalRisks ?? 0,   color: 'text-red-600'    },
          { label: 'Due Reviews',    value: data?.upcomingReviews.length ?? 0, color: 'text-yellow-600' },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Trend + frameworks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Compliance Trend" subtitle="Score over last 10 weeks" />
          <LineChart
            data={data?.trendData ?? []}
            xKey="date"
            lines={[{ key: 'score', color: '#16a34a', label: 'Score' }]}
            height={180}
          />
        </Card>
        <Card>
          <CardHeader title="Framework Scores" />
          <BarChart
            data={frameworkData}
            xKey="name"
            bars={[{ key: 'score', color: '#16a34a' }]}
            height={180}
          />
        </Card>
      </div>

      {/* Controls table */}
      <Card>
        <CardHeader title="Compliance Controls" subtitle={`${data?.controls.length ?? 0} controls`} />
        <ComplianceTable controls={data?.controls ?? []} />
      </Card>

      {/* §20.2 GRC View: Risk register with 30-day sparklines per asset + cross-domain signals */}
      <RiskRegisterSparklines />

      {/* §17.4 GRC-Impact: cross-domain alerts that triggered GRC compliance evaluation */}
      <GRCImpactPanel />

      {/* GRC widget tabs: Posture Heatmap / Risk Register / Audit Calendar / Evidence Packages */}
      <Card padding="none">
        <div className="flex border-b border-white/[0.06]">
          {GRC_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                activeTab === t.id
                  ? 'text-irontic-cyan border-irontic-cyan bg-white/[0.02]'
                  : 'text-white/30 border-transparent hover:text-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {activeTab === 'overview'  && (
            <div className="space-y-4">
              {/* Controls table */}
              <div>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Compliance Controls</p>
                <div className="divide-y divide-white/[0.05]">
                  {(data?.controls ?? []).slice(0, 8).map(ctrl => (
                    <div key={ctrl.id} className="py-2.5 flex items-center gap-3">
                      <Badge variant={ctrl.status === 'compliant' ? 'success' : ctrl.status === 'non_compliant' ? 'critical' : 'medium'}>
                        {ctrl.status.replace('_', ' ')}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/80 truncate">{ctrl.title}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{ctrl.framework} · {ctrl.controlId} · {ctrl.owner}</p>
                      </div>
                    </div>
                  ))}
                  {(data?.controls ?? []).length === 0 && (
                    <p className="text-xs text-white/25 py-4 text-center">No controls data — run an assessment</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'heatmap'  && <ComplianceHeatmap />}
          {activeTab === 'register' && <RiskRegisterSparklines />}
          {activeTab === 'calendar' && <AuditCalendar />}
          {activeTab === 'evidence' && <EvidencePackages />}
        </div>
      </Card>

      {/* Agent findings */}
      {findings.length > 0 && (
        <Card>
          <CardHeader title="Agent Findings" subtitle={`${findings.length} finding(s)`} />
          <div className="space-y-2">
            {findings.slice(0, 5).map(f => (
              <div key={f.id} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <Badge variant={f.severity as 'critical'|'high'|'medium'|'low'|'info'}>{f.severity}</Badge>
                <div>
                  <p className="text-sm font-medium text-white/80">{f.title}</p>
                  {f.recommendation && <p className="text-xs text-white/35 mt-0.5">{f.recommendation}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
