'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';

const TOP_IPS = [
  { ip:'185.220.101.47', country:'TOR Exit', count:142, severity:'critical' as const, blocked:true  },
  { ip:'91.108.4.0',     country:'RU',       count:98,  severity:'high'     as const, blocked:false },
  { ip:'103.74.19.0',    country:'CN',       count:87,  severity:'high'     as const, blocked:true  },
  { ip:'198.98.54.0',    country:'US/VPN',   count:64,  severity:'medium'   as const, blocked:false },
  { ip:'45.142.212.0',   country:'DE',       count:51,  severity:'medium'   as const, blocked:false },
];

const TOP_ASSETS = [
  { asset:'WIN-SERVER-04', type:'Server',    alerts:24, riskScore:82, techniques:['T1021.002','T1059.001'], frameworks:['ISO 27001','NIST CSF'],       grcImpact:true  },
  { asset:'vpn-gw-01',     type:'Network',   alerts:18, riskScore:68, techniques:['T1110.001','T1078'],     frameworks:['NIST CSF','CIS Controls v8'],  grcImpact:true  },
  { asset:'WKSTN-089',     type:'Endpoint',  alerts:14, riskScore:55, techniques:['T1059.001'],             frameworks:['CIS Controls v8'],             grcImpact:true  },
  { asset:'mail-gw-01',    type:'Network',   alerts:11, riskScore:61, techniques:['T1190'],                 frameworks:['ISO 27001','SOC 2 Type II'],   grcImpact:true  },
  { asset:'k8s-node-03',   type:'Container', alerts:9,  riskScore:91, techniques:['T1611'],                 frameworks:['NIST SP 800-53'],              grcImpact:false },
];

const TOP_TECHNIQUES = [
  { id:'T1110.001', name:'Brute Force',        count:12, trend:'↑' as const },
  { id:'T1059.001', name:'PowerShell',         count:8,  trend:'↑' as const },
  { id:'T1078',     name:'Valid Accounts',     count:7,  trend:'→' as const },
  { id:'T1190',     name:'Exploit Public App', count:5,  trend:'↑' as const },
  { id:'T1021.002', name:'SMB Lateral',        count:3,  trend:'↑' as const },
];

type TabId = 'ips' | 'assets' | 'techniques';

/**
 * Top 10 source IPs, affected assets, and techniques — sortable tables (§20.2 SOC View).
 */
export function Top10Tables() {
  const [tab, setTab] = useState<TabId>('ips');

  const tabs: { id: TabId; label: string }[] = [
    { id:'ips',        label:'Top Source IPs'    },
    { id:'assets',     label:'Top Affected Assets'},
    { id:'techniques', label:'Top Techniques'    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-white/[0.06]">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-xs font-semibold transition-colors border-b-2 ${
              tab === t.id
                ? 'text-irontic-cyan border-irontic-cyan bg-slate-100 dark:bg-white/[0.02]'
                : 'text-slate-500 dark:text-white/30 border-transparent hover:text-slate-800 dark:hover:text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto px-4 flex items-center">
          <span className="text-[10px] text-slate-500 dark:text-white/20">Last 24h</span>
        </div>
      </div>

      {/* Source IPs */}
      {tab === 'ips' && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.05]">
              {['IP Address', 'Country', 'Alert Count', 'Severity', 'Blocked'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-slate-500 dark:text-white/30 uppercase tracking-wider px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
            {TOP_IPS.map(ip => (
              <tr key={ip.ip} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-irontic-sky/80">{ip.ip}</td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-white/50">{ip.country}</td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white/80">{ip.count}</td>
                <td className="px-4 py-3"><Badge variant={ip.severity}>{ip.severity.toUpperCase()}</Badge></td>
                <td className="px-4 py-3">
                  {ip.blocked ? (
                    <span className="text-xs font-semibold text-emerald-400">✓ Blocked</span>
                  ) : (
                    <button className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors">Block IP →</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Affected assets — §20.2 SOC View */}
      {tab === 'assets' && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.05]">
              {['Asset', 'Type', 'Alerts', 'MITRE Techniques', 'Risk Score', 'Compliance Scope'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-slate-500 dark:text-white/30 uppercase tracking-wider px-4 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
            {TOP_ASSETS.map(a => (
              <tr key={a.asset} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <p className="text-xs font-mono text-slate-900 dark:text-white/80">{a.asset}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-white/40">{a.type}</td>
                <td className="px-4 py-3 text-sm font-bold text-red-400">{a.alerts}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {a.techniques.map(t => (
                      <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-irontic-sky/10 border border-irontic-sky/20 text-irontic-sky/70">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-bold ${a.riskScore >= 80 ? 'text-red-400' : a.riskScore >= 60 ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {a.riskScore}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.grcImpact ? (
                    <div className="space-y-0.5">
                      {a.frameworks.map(f => (
                        <span key={f} className="block text-[9px] px-1.5 py-0.5 rounded border border-irontic-purple/25 bg-irontic-purple/10 text-irontic-purple/70 whitespace-nowrap">
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-500 dark:text-white/20">Not in scope</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Top techniques */}
      {tab === 'techniques' && (
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.05]">
              {['Technique ID', 'Name', 'Count (24h)', 'Trend'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-slate-500 dark:text-white/30 uppercase tracking-wider px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
            {TOP_TECHNIQUES.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-irontic-sky/70">{t.id}</td>
                <td className="px-4 py-3 text-xs text-slate-700 dark:text-white/70">{t.name}</td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white/80">{t.count}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-bold ${t.trend === '↑' ? 'text-red-400' : 'text-slate-500 dark:text-white/30'}`}>{t.trend}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
