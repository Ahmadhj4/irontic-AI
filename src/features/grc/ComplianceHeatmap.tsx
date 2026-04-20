'use client';

const FRAMEWORKS = ['ISO 27001', 'NIST CSF 2.0', 'SOC 2 Type II', 'NIST SP 800-53', 'CIS Controls v8'];
const FAMILIES   = ['Access Ctrl', 'Asset Mgmt', 'Cryptography', 'Ops Security', 'Incident Mgmt', 'Supplier', 'BCP/DR', 'Compliance'];

// Mock posture scores (frameworks × control families)
const SCORES: number[][] = [
  [82, 78, 91, 74, 85, 62, 70, 88], // ISO 27001
  [76, 71, 84, 69, 79, 58, 65, 77], // NIST CSF 2.0
  [90, 85, 93, 82, 88, 75, 80, 91], // SOC 2
  [71, 65, 79, 63, 72, 54, 60, 74], // NIST 800-53
  [84, 80, 87, 78, 83, 70, 75, 86], // CIS v8
];

function cellStyle(v: number): string {
  if (v >= 85) return 'bg-emerald-500/70 text-white';
  if (v >= 70) return 'bg-yellow-500/60 text-white';
  if (v >= 55) return 'bg-orange-500/65 text-white';
  return 'bg-red-500/65 text-white';
}

/**
 * GRC Compliance Posture Heatmap (§20.2 GRC View).
 * Rows = frameworks, columns = control families.
 * Colour-coded from green (≥85%) to red (<55%).
 */
export function ComplianceHeatmap() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5 overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white/90">Compliance Posture Heatmap</h3>
        <p className="text-xs text-white/30 mt-0.5">Frameworks × Control Families — colour-coded pass rate</p>
      </div>

      <table className="w-full" style={{ minWidth: 560 }}>
        <thead>
          <tr>
            <th className="text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider px-2 py-1.5 w-36">
              Framework
            </th>
            {FAMILIES.map(f => (
              <th key={f} className="text-center text-[9px] font-semibold text-white/30 uppercase tracking-wider px-1 py-1.5">
                {f}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FRAMEWORKS.map((fw, fi) => (
            <tr key={fw}>
              <td className="text-xs text-white/70 font-medium px-2 py-1">{fw}</td>
              {SCORES[fi].map((score, ci) => (
                <td key={ci} className="px-1 py-1">
                  <div
                    className={`text-center text-[11px] font-bold rounded px-1 py-1.5 cursor-default hover:opacity-80 transition-opacity ${cellStyle(score)}`}
                    title={`${fw} / ${FAMILIES[ci]}: ${score}%`}
                  >
                    {score}%
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          ['≥ 85% Pass',    'bg-emerald-500/70'],
          ['70–84% Partial','bg-yellow-500/60' ],
          ['55–69% At Risk','bg-orange-500/65' ],
          ['< 55% Fail',    'bg-red-500/65'    ],
        ].map(([label, cls]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${cls}`} />
            <span className="text-[10px] text-white/30">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
