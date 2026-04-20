'use client';
import { useState } from 'react';
import { useAV } from '@/hooks/useAV';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LineChart } from '@/app/charts/LineChart';
import { PageHeader } from '@/components/layout/PageHeader';
import { EndpointList } from './EndpointList';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { IconLock } from '@/components/ui/Icons';

export function AVDashboard() {
  const { data, agentState, findings, loading, actionLoading, scanEndpoints, quarantineThreat, remediateThreat, threatHunt, updateDefinitions } = useAV();
  const { show } = useToast();
  const [quarantinedYara, setQuarantinedYara] = useState<Set<string>>(new Set());

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-white/30 text-sm">Loading endpoint data…</div>;
  }

  const severityVariant: Record<string, 'critical'|'high'|'medium'|'low'> = {
    critical: 'critical', high: 'high', medium: 'medium', low: 'low',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Endpoint Protection"
        subtitle="Real-time endpoint threat detection and automated remediation"
        agentStatus={agentState.status}
        action={
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="secondary" loading={actionLoading} onClick={() => { void updateDefinitions(); }}>Update Definitions</Button>
            <Button size="sm" variant="secondary" loading={actionLoading} onClick={() => { void threatHunt(); }}>Threat Hunt</Button>
            <Button size="sm" loading={actionLoading} onClick={() => { void scanEndpoints(); }}>Scan All Endpoints</Button>
          </div>
        }
      />

      {/* ── KPI row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Detection rate gauge */}
        <Card className="flex flex-col items-center justify-center py-4">
          <ScoreGauge score={Math.round(data?.detectionRate ?? 0)} size="sm" />
          <p className="text-[10px] text-white/40 mt-1 font-medium">Detection Rate</p>
        </Card>

        {[
          { label: 'Total Endpoints',    value: data?.totalEndpoints ?? 0,       color: 'text-white/80' },
          { label: 'Protected',          value: data?.protectedCount ?? 0,        color: 'text-irontic-cyan' },
          { label: 'Infected / At Risk', value: (data?.infectedCount ?? 0) + (data?.atRiskCount ?? 0), color: 'text-red-400' },
          { label: 'Auto-Remediated Today', value: data?.autoRemediatedToday ?? 0, color: 'text-irontic-purple' },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs text-white/40">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Threat trend + by type ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Threat Detection (24h)" subtitle="Detections per hour across all endpoints" />
          <LineChart
            data={data?.threatTrend ?? []}
            xKey="hour"
            lines={[{ key: 'count', color: '#8B5CF6', label: 'Threats' }]}
            height={180}
          />
        </Card>

        <Card>
          <CardHeader title="Threats by Type" />
          <div className="space-y-2 mt-2">
            {(data?.threatsByType ?? []).map(t => (
              <div key={t.type} className="flex items-center justify-between">
                <span className="text-xs text-white/60">{t.type}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 rounded-full bg-irontic-purple/60"
                    style={{ width: `${Math.round((t.count / 12) * 80)}px` }}
                  />
                  <span className="text-xs font-semibold text-white/70 w-4 text-right">{t.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Active threats + quarantine ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Active Threats"
            subtitle={`${data?.activeThreats.length ?? 0} requiring action`}
          />
          <div className="divide-y divide-white/[0.05]">
            {(data?.activeThreats ?? []).length === 0 && (
              <p className="text-sm text-white/30 py-4 text-center">No active threats — all endpoints clean</p>
            )}
            {(data?.activeThreats ?? []).map(t => (
              <div key={t.id} className="py-3 flex items-start gap-3">
                <Badge variant={severityVariant[t.severity] ?? 'medium'}>{t.severity}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/85 truncate">{t.name}</p>
                  <p className="text-xs text-white/35 mt-0.5 truncate">
                    {t.threatType} · {t.endpointName} · {t.engine}
                  </p>
                  {t.filePath && (
                    <p className="text-[10px] font-mono text-irontic-sky/60 mt-0.5 truncate">{t.filePath}</p>
                  )}
                </div>
                <button
                  onClick={() => quarantineThreat(t.id)}
                  className="shrink-0 text-xs text-irontic-cyan hover:text-irontic-purple transition-colors"
                >
                  Quarantine
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Quarantine Vault"
            subtitle={`${data?.quarantine.length ?? 0} items isolated`}
          />
          <div className="divide-y divide-white/[0.05]">
            {(data?.quarantine ?? []).length === 0 && (
              <p className="text-sm text-white/30 py-4 text-center">Quarantine vault is empty</p>
            )}
            {(data?.quarantine ?? []).map(q => (
              <div key={q.id} className="py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <IconLock className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/80 truncate">{q.fileName}</p>
                  <p className="text-[10px] text-white/35 mt-0.5 truncate">{q.threatName} · {q.endpointName}</p>
                  <p className="text-[10px] font-mono text-white/20 mt-0.5 truncate">{q.filePath}</p>
                </div>
                <button
                  onClick={() => remediateThreat()}
                  className="shrink-0 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Endpoint inventory ────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Endpoint Inventory"
          subtitle={`${data?.totalEndpoints ?? 0} managed endpoints`}
        />
        <div className="text-[10px] text-white/25 mb-3 flex items-center gap-4">
          <span>Definition version: <span className="text-irontic-sky/60">{data?.definitionVersion}</span></span>
          <span>Last updated: <span className="text-irontic-sky/60">
            {data?.lastDefinitionUpdate ? new Date(data.lastDefinitionUpdate).toLocaleTimeString() : '—'}
          </span></span>
        </div>
        <EndpointList endpoints={data?.endpoints ?? []} onScan={scanEndpoints} showSearch />
      </Card>

      {/* ── YARA Scan Results — §21.4 EP Agent MCP Tools ─────── */}
      <Card>
        <CardHeader title="YARA Scan Results" subtitle="Last scan: 14 min ago · 847 rules applied" />
        <div className="mt-2 space-y-2">
          {[
            { rule:'APT29_Cozy_Bear_C2', file:'/tmp/.svchost32.exe', endpoint:'WKSTN-089', match:'CRITICAL', sig:'0x4d5a9000' },
            { rule:'Ransomware_Generic_Dropper', file:'C:\\Users\\Public\\update.bat', endpoint:'WIN-SERVER-04', match:'HIGH', sig:'0x50617920' },
            { rule:'Cobalt_Strike_Beacon', file:'/usr/lib/libssl.so.1.1.bak', endpoint:'bastion-01', match:'HIGH', sig:'0x2f2a2a4d' },
          ].map(r => (
            <div key={r.rule} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
              <Badge variant={r.match === 'CRITICAL' ? 'critical' : 'high'}>{r.match}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-irontic-sky/80 truncate">{r.rule}</p>
                <p className="text-[10px] text-white/30 mt-0.5 truncate">{r.file} · {r.endpoint}</p>
              </div>
              <code className="text-[9px] font-mono text-white/25 shrink-0">{r.sig}</code>
              <button
                disabled={quarantinedYara.has(r.rule)}
                onClick={() => {
                  void quarantineThreat(r.rule);
                  setQuarantinedYara(s => new Set([...s, r.rule]));
                  show(`YARA match quarantined: ${r.rule} on ${r.endpoint}`, 'success');
                }}
                className="shrink-0 text-[10px] font-semibold border px-2 py-0.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-red-400/70 hover:text-red-400 border-red-500/20 hover:border-red-500/40"
              >
                {quarantinedYara.has(r.rule) ? '✓ Quarantined' : 'Quarantine'}
              </button>
            </div>
          ))}
          {[0].map(() => (
            <p key="clean" className="text-[10px] text-emerald-400/60 pt-1">✓ 844 rules matched 0 files — clean</p>
          ))}
        </div>
      </Card>

      {/* ── Agent findings ────────────────────────────────────── */}
      {findings.length > 0 && (
        <Card>
          <CardHeader title="Agent Findings" subtitle={`${findings.length} finding(s) from EP agent`} />
          <div className="space-y-2">
            {findings.slice(0, 5).map(f => (
              <div key={f.id} className="flex items-start gap-3 py-2 border-b border-white/[0.05] last:border-0">
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
