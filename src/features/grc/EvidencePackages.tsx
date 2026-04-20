'use client';

interface EvidencePackage {
  id: string;
  framework: string;
  control: string;
  generated: string;
  expires: string;
  status: 'READY' | 'GENERATING' | 'EXPIRED';
}

const PACKAGES: EvidencePackage[] = [
  { id:'EVP-441', framework:'ISO 27001',    control:'A.9.4.2',  generated:'14 Apr 09:31', expires:'21 Apr', status:'READY'      },
  { id:'EVP-440', framework:'NIST CSF 2.0', control:'PR.DS-1',  generated:'13 Apr 14:20', expires:'20 Apr', status:'READY'      },
  { id:'EVP-439', framework:'SOC 2 Type II',control:'CC6.1',    generated:'12 Apr 10:05', expires:'19 Apr', status:'READY'      },
  { id:'EVP-438', framework:'ISO 27001',    control:'A.12.6.1', generated:'—',            expires:'—',       status:'GENERATING' },
];

function statusStyle(s: EvidencePackage['status']) {
  if (s === 'READY')      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
  if (s === 'GENERATING') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25';
  return 'bg-red-500/10 text-red-400 border-red-500/20';
}

/**
 * Evidence package download links with generation timestamp and expiry (§20.2 GRC View).
 * Used in Journey 2 (GRC Analyst: Downloads evidence package PDF for auditor submission).
 */
export function EvidencePackages() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/90">Evidence Packages</h3>
          <p className="text-xs text-white/30 mt-0.5">Expiry: 7 days from generation · for auditor submission</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-semibold bg-irontic-cyan/10 hover:bg-irontic-cyan/20 text-irontic-cyan border border-irontic-cyan/25 rounded-lg px-3 py-1.5 transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Generate Package
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.05]">
            {['Package ID', 'Framework', 'Control', 'Generated', 'Expires', 'Status', 'Download'].map(h => (
              <th key={h} className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-4 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {PACKAGES.map(ep => (
            <tr key={ep.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 text-xs font-mono text-irontic-sky/70">{ep.id}</td>
              <td className="px-4 py-3 text-xs text-white/70">{ep.framework}</td>
              <td className="px-4 py-3 text-xs font-mono text-white/50">{ep.control}</td>
              <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">{ep.generated}</td>
              <td className="px-4 py-3 text-xs text-white/40">{ep.expires}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded border font-semibold ${statusStyle(ep.status)}`}>
                  {ep.status === 'GENERATING' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse mr-1" />
                  )}
                  {ep.status}
                </span>
              </td>
              <td className="px-4 py-3">
                {ep.status === 'READY' ? (
                  <button className="flex items-center gap-1 text-xs text-irontic-sky/60 hover:text-irontic-cyan transition-colors font-medium">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    PDF
                  </button>
                ) : (
                  <span className="text-xs text-white/20 italic">pending…</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
