'use client';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { Badge } from '@/components/ui/Badge';

// Per-asset risk data with cross-domain contributions (§17.4 GRC-Impact + §18.3 CRS formula)
interface AssetRisk {
  asset:      string;
  category:   string;
  frameworks: string[];   // compliance frameworks this asset is in scope for
  socAlerts:  number;     // open SOC alerts against this asset
  ptFindings: number;     // open PT critical/high findings
  epHealth:   number;     // endpoint health % (0-100)
  grcGaps:    number;     // open GRC control gaps
  score:      number;     // composite risk score (higher = worse)
  change:     number;     // 30-day delta
  trend:      number[];   // 10-point 30-day sparkline
}

// CRS formula weights from §18.3
function computeAssetCRS(a: AssetRisk): number {
  const soc = Math.min(a.socAlerts / 20, 1);
  const grc = Math.min(a.grcGaps   / 10, 1);
  const ep  = 1 - a.epHealth / 100;
  const pt  = Math.min(a.ptFindings / 5, 1);
  return Math.round((0.30 * soc + 0.25 * grc + 0.25 * ep + 0.20 * pt) * 100);
}

const MOCK_ASSETS: AssetRisk[] = [
  {
    asset: 'WIN-SERVER-04', category: 'Server',
    frameworks: ['ISO 27001', 'NIST CSF'],
    socAlerts: 14, ptFindings: 3, epHealth: 61, grcGaps: 5,
    score: 67, change: +12,
    trend: [42, 46, 50, 54, 57, 59, 62, 64, 66, 67],
  },
  {
    asset: 'DB-ORACLE-01', category: 'Database',
    frameworks: ['SOC 2 Type II', 'ISO 27001'],
    socAlerts: 2, ptFindings: 1, epHealth: 88, grcGaps: 3,
    score: 28, change: -4,
    trend: [38, 36, 34, 33, 32, 31, 30, 29, 28, 28],
  },
  {
    asset: 'vpn-gw-01', category: 'Network',
    frameworks: ['NIST CSF', 'CIS Controls v8'],
    socAlerts: 6, ptFindings: 2, epHealth: 74, grcGaps: 4,
    score: 44, change: +8,
    trend: [28, 30, 33, 35, 38, 40, 41, 42, 43, 44],
  },
  {
    asset: 'k8s-node-03', category: 'Container',
    frameworks: ['NIST SP 800-53'],
    socAlerts: 1, ptFindings: 4, epHealth: 91, grcGaps: 2,
    score: 22, change: -2,
    trend: [28, 27, 26, 25, 25, 24, 24, 23, 22, 22],
  },
  {
    asset: 'mail-gw-01', category: 'Network',
    frameworks: ['ISO 27001', 'SOC 2 Type II'],
    socAlerts: 9, ptFindings: 0, epHealth: 69, grcGaps: 6,
    score: 51, change: +3,
    trend: [44, 45, 46, 47, 48, 49, 50, 50, 51, 51],
  },
  {
    asset: 'WKSTN-089', category: 'Endpoint',
    frameworks: ['CIS Controls v8'],
    socAlerts: 17, ptFindings: 1, epHealth: 42, grcGaps: 1,
    score: 72, change: +18,
    trend: [38, 42, 47, 52, 57, 61, 65, 68, 70, 72],
  },
];

function Sparkline({ data, rising }: { data: number[]; rising: boolean }) {
  return (
    <div style={{ width: 80, height: 28 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((v, i) => ({ v, i }))}>
          <Line type="monotone" dataKey="v"
            stroke={rising ? '#ef4444' : '#22c55e'}
            strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DomainBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1) * 100;
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-[9px] text-white/30 w-6 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] text-white/50 w-4 text-right shrink-0">{value}</span>
    </div>
  );
}

function riskVariant(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 65) return 'critical';
  if (score >= 45) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

/**
 * GRC Risk Register — §20.2 risk register with 30-day sparklines per asset.
 * §17.4 GRC-Impact: shows cross-domain risk contributions (SOC/PT/EP/GRC) per asset.
 * §18.3: composite risk score = 0.30·SOC + 0.25·GRC + 0.25·EP + 0.20·PT.
 */
export function RiskRegisterSparklines() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90">Asset Risk Register</h3>
          <p className="text-xs text-white/30 mt-0.5">
            Cross-domain risk per asset · SOC 30% · GRC 25% · EP 25% · PT 20%
          </p>
        </div>
        <div className="flex gap-3 text-[9px] text-white/30 shrink-0 mt-0.5">
          <span className="flex items-center gap-1"><span className="w-2 h-1 rounded bg-red-500/70 inline-block"/>SOC alerts</span>
          <span className="flex items-center gap-1"><span className="w-2 h-1 rounded bg-orange-500/70 inline-block"/>PT findings</span>
          <span className="flex items-center gap-1"><span className="w-2 h-1 rounded bg-emerald-500/70 inline-block"/>EP health</span>
          <span className="flex items-center gap-1"><span className="w-2 h-1 rounded bg-purple-500/70 inline-block"/>GRC gaps</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {['Asset', 'Category', 'In-Scope Frameworks', 'Domain Risk Signals', 'CRS', '30-Day Trend', 'Δ 30d'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-4 py-2.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {MOCK_ASSETS.map(a => {
              const crs = computeAssetCRS(a);
              return (
                <tr key={a.asset} className="hover:bg-white/[0.02] transition-colors">

                  {/* Asset */}
                  <td className="px-4 py-3 text-xs font-mono text-white/80 whitespace-nowrap">{a.asset}</td>

                  {/* Category */}
                  <td className="px-4 py-3 text-xs text-white/40">{a.category}</td>

                  {/* Frameworks */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.frameworks.map(f => (
                        <span key={f} className="text-[9px] px-1.5 py-0.5 rounded border border-irontic-purple/25 bg-irontic-purple/10 text-irontic-purple/70 whitespace-nowrap">
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Domain risk signals — mini bars */}
                  <td className="px-4 py-3">
                    <div className="space-y-1 w-36">
                      <DomainBar label="SOC" value={a.socAlerts}  max={20} color="bg-red-500/70"     />
                      <DomainBar label="PT"  value={a.ptFindings} max={5}  color="bg-orange-500/70"  />
                      <DomainBar label="EP"  value={Math.round((100 - a.epHealth) / 10)} max={10} color="bg-emerald-500/70" />
                      <DomainBar label="GRC" value={a.grcGaps}    max={10} color="bg-purple-500/70"  />
                    </div>
                  </td>

                  {/* Composite Risk Score */}
                  <td className="px-4 py-3">
                    <Badge variant={riskVariant(crs)}>{crs}</Badge>
                  </td>

                  {/* 30-day sparkline */}
                  <td className="px-4 py-3">
                    <Sparkline data={a.trend} rising={a.change > 0} />
                  </td>

                  {/* Delta */}
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${a.change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {a.change > 0 ? '+' : ''}{a.change}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-2.5 border-t border-white/[0.05] text-[10px] text-white/20">
        GRC-Impact: SOC/PT/EP alerts against in-scope assets automatically trigger GRC compliance evaluation · §17.4
      </div>
    </div>
  );
}
