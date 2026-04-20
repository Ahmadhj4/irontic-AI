'use client';
/**
 * Executive Briefing — /executive (§3.1 Navigation Structure)
 * Access role: Executive (read-only)
 * No operational controls visible (Journey 4 §3.3).
 */
import { useState } from 'react';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { LineChart } from '@/app/charts/LineChart';

const RISK_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  day: `Apr ${i + 1}`,
  score: Math.floor(50 + Math.sin(i * 0.4) * 15 + (i % 3)),
  target: 40,
}));
RISK_HISTORY[29].score = 67;

const KPI = [
  { label:'Incidents This Month', value:'47',    sub:'↓ 12% vs March',    good:true  },
  { label:'Mean MTTR',            value:'23 min', sub:'Target: 30 min ✓', good:true  },
  { label:'Compliance Score',     value:'77%',    sub:'Target: 85% Q3',   good:false },
  { label:'Auto-Resolved',        value:'89%',    sub:'312 of 350 today',  good:true  },
];

const FRAMEWORK_SCORES = [
  { name:'ISO 27001',      score:78 },
  { name:'NIST CSF 2.0',   score:71 },
  { name:'SOC 2 Type II',  score:85 },
  { name:'NIST SP 800-53', score:67 },
  { name:'CIS Controls v8',score:82 },
];

type PdfBlock =
  | { type: 'heading'; text: string }
  | { type: 'meta';    text: string }
  | { type: 'body';    text: string }
  | { type: 'kpi';     items: { k: string; v: string }[] }
  | { type: 'table';   rows: string[][] };

const PDF_PAGES: { title: string; content: PdfBlock[] }[] = [
  {
    title: 'Executive Summary',
    content: [
      { type: 'heading', text: 'Irontic AI — April 2026 Security Briefing' },
      { type: 'meta',    text: 'Prepared: 10 Apr 2026 09:00 UTC · Classification: CONFIDENTIAL · TLP:RED' },
      { type: 'body',    text: 'The organisation\'s composite risk score improved to 67/100 this quarter, driven by a 12% reduction in incident volume and strong EP detection rates. Two critical risks remain open pending board-approved remediation budget.' },
      { type: 'kpi',     items: [{ k:'MTTR', v:'23 min' }, { k:'Auto-Resolved', v:'89%' }, { k:'Compliance', v:'77%' }, { k:'Critical Open', v:'2' }] },
    ],
  },
  {
    title: 'Compliance Posture',
    content: [
      { type: 'heading', text: 'Compliance Score vs Target' },
      { type: 'body',    text: 'Target: 85% by Q3 2026. Current trajectory: on track for ISO 27001 and SOC 2. NIST CSF 2.0 requires 3 additional control implementations.' },
      { type: 'table',   rows: [['ISO 27001','78%','On Track'],['NIST CSF 2.0','71%','At Risk'],['SOC 2 Type II','85%','Met'],['NIST 800-53','67%','Remediation']] },
    ],
  },
  {
    title: 'Risk Summary',
    content: [
      { type: 'heading', text: 'Top Risks — April 2026' },
      { type: 'body',    text: 'Two critical risks require executive attention. Risk R-001 (ransomware exposure on legacy file servers) has a board-approved remediation deadline of 30 Jun 2026. Risk R-002 (MFA gap on privileged accounts) is in active remediation.' },
      { type: 'table',   rows: [['R-001','Ransomware Exposure','Critical','30 Jun 2026'],['R-002','MFA Gap','High','Active']] },
    ],
  },
];

export default function ExecutivePage() {
  const [pdfPage, setPdfPage] = useState(0);
  const { show } = useToast();
  return (
    <div className="space-y-5">
      {/* Read-only banner */}
      <div className="flex items-center gap-2 bg-irontic-sky/5 border border-irontic-sky/20 rounded-xl px-4 py-3">
        <svg className="w-4 h-4 text-irontic-sky/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        <p className="text-xs text-irontic-sky/60 font-medium">
          Read-only Executive View — no operational controls, assignment, escalation, or configuration available in this context.
        </p>
      </div>

      <PageHeader
        title="Executive Security Briefing"
        subtitle="Composite risk posture · Compliance status · Key metrics — April 2026"
      />

      {/* Risk gauge + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="flex flex-col items-center justify-center py-6 lg:col-span-1">
          <ScoreGauge score={67} label="Composite Risk" size="lg" />
        </Card>
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI.map(k => (
            <Card key={k.label}>
              <p className="text-xs text-white/35">{k.label}</p>
              <p className={`text-2xl font-bold mt-1 ${k.good ? 'text-irontic-cyan' : 'text-amber-400'}`}>{k.value}</p>
              <p className="text-xs text-white/25 mt-0.5">{k.sub}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* 30-day risk trend */}
      <Card>
        <CardHeader title="Composite Risk Score — 30-Day Trend" subtitle="Weighted: SOC 30% · GRC 25% · EP 25% · PT 20%" />
        <LineChart
          data={RISK_HISTORY}
          xKey="day"
          lines={[
            { key:'score',  color:'#f97316', label:'Risk Score' },
            { key:'target', color:'#22c55e', label:'Target'     },
          ]}
          height={180}
        />
      </Card>

      {/* Framework compliance scores */}
      <Card>
        <CardHeader title="Compliance Score vs Target" subtitle="Across 5 frameworks · Target: 85% by Q3 2026" />
        <div className="grid grid-cols-5 gap-4 mt-2">
          {FRAMEWORK_SCORES.map(fw => (
            <div key={fw.name} className="text-center">
              <ScoreGauge score={fw.score} size="sm" />
              <p className="text-[10px] text-white/35 mt-1">{fw.name}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Latest executive briefing PDF */}
      <Card>
        <CardHeader
          title="Latest Executive Briefing PDF"
          subtitle="Auto-generated · April 2026 · Generated: 10 Apr 09:00 UTC"
          action={
            <button
              onClick={() => show('Downloading Executive_Risk_Briefing_Apr2026.pdf…', 'info')}
              className="flex items-center gap-1 text-xs text-irontic-sky/60 hover:text-irontic-cyan transition-colors font-medium"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Download PDF
            </button>
          }
        />
        {/* §20.2 Inline PDF viewer — PDF.js in production, paginated mock for portal demo */}
        <div className="mt-3 bg-white/[0.015] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* PDF toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span className="text-xs text-white/50 font-medium">Executive_Risk_Briefing_Apr2026.pdf</span>
              <span className="text-[9px] text-red-400/60 font-semibold border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 rounded">CONFIDENTIAL</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPdfPage(p => Math.max(0, p - 1))}
                  disabled={pdfPage === 0}
                  className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
                >
                  ‹
                </button>
                <span className="text-[10px] text-white/30">{pdfPage + 1} / {PDF_PAGES.length}</span>
                <button
                  onClick={() => setPdfPage(p => Math.min(PDF_PAGES.length - 1, p + 1))}
                  disabled={pdfPage === PDF_PAGES.length - 1}
                  className="w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
                >
                  ›
                </button>
              </div>
              <div className="flex items-center gap-1">
                {PDF_PAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPdfPage(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === pdfPage ? 'bg-irontic-sky' : 'bg-white/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="p-6 min-h-48">
            {(() => {
              const page = PDF_PAGES[pdfPage];
              return (
                <div className="space-y-4 max-w-2xl mx-auto">
                  <p className="text-[9px] text-white/20 uppercase tracking-widest">Page {pdfPage + 1} of {PDF_PAGES.length} · {page.title}</p>
                  {page.content.map((block, i) => {
                    if (block.type === 'heading') return (
                      <h3 key={i} className="text-base font-bold text-white/90">{block.text}</h3>
                    );
                    if (block.type === 'meta') return (
                      <p key={i} className="text-[10px] text-white/25 italic">{block.text}</p>
                    );
                    if (block.type === 'body') return (
                      <p key={i} className="text-xs text-white/55 leading-relaxed">{block.text}</p>
                    );
                    if (block.type === 'kpi' && block.items) return (
                      <div key={i} className="grid grid-cols-4 gap-3">
                        {block.items.map(item => (
                          <div key={item.k} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-2.5 text-center">
                            <p className="text-xs font-bold text-irontic-cyan">{item.v}</p>
                            <p className="text-[9px] text-white/30 mt-0.5">{item.k}</p>
                          </div>
                        ))}
                      </div>
                    );
                    if (block.type === 'table' && block.rows) return (
                      <div key={i} className="overflow-hidden rounded-lg border border-white/[0.08]">
                        <table className="w-full">
                          <tbody className="divide-y divide-white/[0.05]">
                            {block.rows.map((row, ri) => (
                              <tr key={ri} className="hover:bg-white/[0.02]">
                                {row.map((cell, ci) => (
                                  <td key={ci} className="px-3 py-2 text-xs text-white/55">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                    return null;
                  })}
                </div>
              );
            })()}
          </div>

          <p className="text-center text-[9px] text-white/10 py-2 border-t border-white/[0.04]">
            Irontic AI · Green Circle Cybersecurity · TLP:RED · Confidential · Not for external distribution
          </p>
        </div>
      </Card>
    </div>
  );
}
