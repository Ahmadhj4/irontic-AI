'use client';

// §17.4 GRC-Impact Correlation Engine
// SOC/EP/PT alerts automatically trigger GRC Agent evaluation when the affected
// asset is in scope for an active compliance framework.

interface ImpactEvent {
  id:         string;
  timestamp:  string;
  domain:     'SOC' | 'PT' | 'EP';
  alertTitle: string;
  asset:      string;
  assetType:  string;
  frameworks: string[];
  controlRef: string;
  impact:     'critical' | 'high' | 'medium' | 'low';
  grcStatus:  'evaluated' | 'pending' | 'escalated';
  riskDelta:  number; // how much this event moved the asset risk score
}

const IMPACT_EVENTS: ImpactEvent[] = [
  {
    id: 'GRC-IMP-001',
    timestamp: '14:32',
    domain: 'SOC',
    alertTitle: 'Lateral Movement — T1021.002 SMB',
    asset: 'WIN-SERVER-04',
    assetType: 'Server',
    frameworks: ['ISO 27001', 'NIST CSF'],
    controlRef: 'ISO A.9.4.2 · CSF PR.AC-4',
    impact: 'critical',
    grcStatus: 'escalated',
    riskDelta: +12,
  },
  {
    id: 'GRC-IMP-002',
    timestamp: '13:51',
    domain: 'PT',
    alertTitle: 'CVE-2024-21413 CVSS 9.8 — RCE via mail client',
    asset: 'mail-gw-01',
    assetType: 'Network',
    frameworks: ['ISO 27001', 'SOC 2 Type II'],
    controlRef: 'ISO A.12.6.1 · SOC 2 CC7.1',
    impact: 'critical',
    grcStatus: 'evaluated',
    riskDelta: +8,
  },
  {
    id: 'GRC-IMP-003',
    timestamp: '12:18',
    domain: 'EP',
    alertTitle: 'Stale definition — 72h since last update',
    asset: 'WKSTN-089',
    assetType: 'Endpoint',
    frameworks: ['CIS Controls v8'],
    controlRef: 'CIS Control 10.2',
    impact: 'high',
    grcStatus: 'evaluated',
    riskDelta: +6,
  },
  {
    id: 'GRC-IMP-004',
    timestamp: '11:04',
    domain: 'SOC',
    alertTitle: 'MFA Brute Force — 340 failed attempts',
    asset: 'vpn-gw-01',
    assetType: 'Network',
    frameworks: ['NIST CSF', 'CIS Controls v8'],
    controlRef: 'CSF PR.AC-1 · CIS Control 6.5',
    impact: 'high',
    grcStatus: 'evaluated',
    riskDelta: +5,
  },
  {
    id: 'GRC-IMP-005',
    timestamp: '09:47',
    domain: 'PT',
    alertTitle: 'Container escape PoC — privileged breakout',
    asset: 'k8s-node-03',
    assetType: 'Container',
    frameworks: ['NIST SP 800-53'],
    controlRef: 'NIST SI-3 · SC-39',
    impact: 'high',
    grcStatus: 'pending',
    riskDelta: +4,
  },
  {
    id: 'GRC-IMP-006',
    timestamp: '08:22',
    domain: 'SOC',
    alertTitle: 'SQL injection attempt on legacy DB',
    asset: 'DB-ORACLE-01',
    assetType: 'Database',
    frameworks: ['SOC 2 Type II', 'ISO 27001'],
    controlRef: 'SOC 2 CC6.1 · ISO A.14.2.5',
    impact: 'medium',
    grcStatus: 'evaluated',
    riskDelta: +2,
  },
];

const DOMAIN_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  SOC: { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/25'   },
  PT:  { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/25' },
  EP:  { bg: 'bg-emerald-500/10',text: 'text-emerald-400',border: 'border-emerald-500/25'},
};

const STATUS_STYLES: Record<string, string> = {
  evaluated: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  pending:   'text-yellow-400  bg-yellow-500/10  border-yellow-500/25',
  escalated: 'text-red-400    bg-red-500/10     border-red-500/25',
};

const IMPACT_COLORS: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-yellow-400',
  low:      'text-blue-400',
};

/**
 * GRC-Impact Correlation Panel — §17.4
 * Shows every cross-domain alert that triggered an automatic GRC compliance
 * evaluation because the affected asset is in scope for a compliance framework.
 */
export function GRCImpactPanel() {
  const pending   = IMPACT_EVENTS.filter(e => e.grcStatus === 'pending').length;
  const escalated = IMPACT_EVENTS.filter(e => e.grcStatus === 'escalated').length;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-white/90">GRC-Impact Correlation</h3>
            {escalated > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                {escalated} ESCALATED
              </span>
            )}
            {pending > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                {pending} PENDING
              </span>
            )}
          </div>
          <p className="text-xs text-white/30">
            SOC / PT / EP alerts auto-trigger GRC evaluation when the affected asset is in scope for a compliance framework · §17.4
          </p>
        </div>
        <div className="flex gap-3 text-[9px] text-white/30 shrink-0 mt-0.5">
          {(['SOC','PT','EP'] as const).map(d => (
            <span key={d} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${DOMAIN_STYLES[d].border} ${DOMAIN_STYLES[d].bg} ${DOMAIN_STYLES[d].text} font-semibold`}>
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Time', 'Domain', 'Alert / Finding', 'Affected Asset', 'In-Scope Frameworks', 'Control Ref', 'Risk Δ', 'GRC Status'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-4 py-2.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {IMPACT_EVENTS.map(ev => {
              const ds = DOMAIN_STYLES[ev.domain];
              return (
                <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors group">

                  {/* Time */}
                  <td className="px-4 py-3 text-xs font-mono text-white/30 whitespace-nowrap">{ev.timestamp}</td>

                  {/* Domain badge */}
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ds.border} ${ds.bg} ${ds.text}`}>
                      {ev.domain}
                    </span>
                  </td>

                  {/* Alert title */}
                  <td className="px-4 py-3">
                    <p className={`text-xs font-medium ${IMPACT_COLORS[ev.impact]}`}>{ev.alertTitle}</p>
                  </td>

                  {/* Asset */}
                  <td className="px-4 py-3">
                    <p className="text-xs font-mono text-white/80">{ev.asset}</p>
                    <p className="text-[10px] text-white/30">{ev.assetType}</p>
                  </td>

                  {/* Frameworks */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ev.frameworks.map(f => (
                        <span key={f} className="text-[9px] px-1.5 py-0.5 rounded border border-irontic-purple/25 bg-irontic-purple/10 text-irontic-purple/70 whitespace-nowrap">
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Control ref */}
                  <td className="px-4 py-3 text-[10px] font-mono text-white/35 whitespace-nowrap">{ev.controlRef}</td>

                  {/* Risk delta */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-red-400">+{ev.riskDelta}</span>
                  </td>

                  {/* GRC Status */}
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${STATUS_STYLES[ev.grcStatus]}`}>
                      {ev.grcStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-2.5 border-t border-white/[0.05] flex items-center justify-between">
        <p className="text-[10px] text-white/20">
          Entity-based correlation: alerts sharing asset_id within 15-min window are grouped · §17.4
        </p>
        <p className="text-[10px] text-white/20">{IMPACT_EVENTS.length} events today</p>
      </div>
    </div>
  );
}
