'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export interface TimelineIncident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  hoursAgo: number;
  domain: string;
  asset: string;
}

const SEV_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#3b82f6',
};

const SEV_VARIANT: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
  critical: 'critical', high: 'high', medium: 'medium', low: 'low',
};

function formatAgo(h: number) {
  if (h < 1) return `${Math.round(h * 60)}m ago`;
  return `${h.toFixed(1)}h ago`;
}

interface Props {
  incidents: TimelineIncident[];
}

/**
 * Horizontal 24-hour incident timeline (FR-D3 / §20.2 Operations Center).
 * Each incident is a colour-coded dot plotted at its time offset.
 * Click a dot to see full incident detail inline.
 */
export function IncidentTimeline({ incidents }: Props) {
  const [selected, setSelected] = useState<TimelineIncident | null>(null);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const { show } = useToast();

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white/90">Incident Timeline</h3>
          <p className="text-xs text-white/30 mt-0.5">Last 24 hours — click any marker for detail</p>
        </div>
        <span className="text-xs text-white/30">{incidents.length} incidents</span>
      </div>

      {/* Timeline track */}
      <div className="relative mb-4" style={{ height: 48 }}>
        {/* Track line */}
        <div className="absolute bottom-4 left-0 right-0 h-px bg-white/10" />

        {/* Hour labels */}
        {[0, 4, 8, 12, 16, 20, 24].map(h => (
          <div
            key={h}
            className="absolute flex flex-col items-center"
            style={{ left: `${(h / 24) * 100}%`, bottom: 0 }}
          >
            <div className="w-px h-2 bg-white/20" />
            <span className="text-[9px] text-white/20 mt-0.5 -translate-x-1/2">
              {h === 0 ? 'now' : h === 24 ? '24h' : `${h}h`}
            </span>
          </div>
        ))}

        {/* Incident dots */}
        {incidents.map(inc => {
          const left = `${(inc.hoursAgo / 24) * 100}%`;
          const col = SEV_COLOR[inc.severity] ?? '#64748b';
          const isSelected = selected?.id === inc.id;
          return (
            <button
              key={inc.id}
              onClick={() => setSelected(isSelected ? null : inc)}
              title={`${inc.id}: ${inc.title}`}
              className="absolute -translate-x-1/2 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full"
              style={{ left, bottom: 12 }}
              aria-label={`${inc.severity} incident: ${inc.title}`}
            >
              <div
                style={{
                  width: isSelected ? 14 : 10,
                  height: isSelected ? 14 : 10,
                  borderRadius: '50%',
                  backgroundColor: col,
                  border: `2px solid ${isSelected ? '#fff' : col}`,
                  boxShadow: isSelected ? `0 0 10px ${col}` : `0 0 4px ${col}60`,
                  transition: 'all 0.2s',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* §20.2 Selected incident detail — full timeline click-through */}
      {selected && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-3 space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant={SEV_VARIANT[selected.severity]}>{selected.severity.toUpperCase()}</Badge>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-white/[0.04] border-white/[0.08] text-irontic-sky/70">{selected.domain}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/90">{selected.id} — {selected.title}</p>
              <p className="text-[10px] text-white/35 mt-0.5">Asset: {selected.asset} · {formatAgo(selected.hoursAgo)}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-white/20 hover:text-white/60 transition-colors shrink-0"
              aria-label="Close detail"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Incident timeline events */}
          <div className="space-y-1.5 pl-3 border-l-2 border-white/[0.08]">
            {[
              { dt: `${Math.round(selected.hoursAgo * 60 + 0)}m ago`, actor: 'Elastic SIEM',   ev: 'Alert generated — rule matched IOC signature' },
              { dt: `${Math.round(selected.hoursAgo * 60 + 2)}m ago`, actor: 'SOC Agent',       ev: 'Enrichment complete — MISP IOC feed matched, asset owner notified' },
              { dt: `${Math.round(selected.hoursAgo * 60 + 5)}m ago`, actor: 'Orchestrator',    ev: 'Incident record created · cross-domain correlation initiated' },
              { dt: `${Math.round(selected.hoursAgo * 60 + 8)}m ago`, actor: 'Analyst (auto)',  ev: 'SLA timer started — response window tracking active' },
            ].map(ev => (
              <div key={ev.dt} className="flex items-start gap-2 py-1">
                <span className="text-[10px] text-white/20 w-16 shrink-0 mt-0.5">{ev.dt}</span>
                <span className="text-[10px] font-semibold text-irontic-cyan/60 shrink-0">{ev.actor}</span>
                <span className="text-[10px] text-white/45">{ev.ev}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
            <button
              onClick={() => show(`Opening war room for ${selected.id} — ${selected.title}`, 'info')}
              className="text-[10px] font-semibold text-irontic-cyan/70 hover:text-irontic-cyan border border-irontic-cyan/20 hover:border-irontic-cyan/40 px-2.5 py-1 rounded-lg transition-colors"
            >
              Open Incident
            </button>
            <button
              disabled={assigned.has(selected.id)}
              onClick={() => {
                setAssigned(s => new Set([...s, selected.id]));
                show(`${selected.id} assigned to on-call analyst`, 'success');
              }}
              className="text-[10px] font-semibold border px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-white/30 hover:text-white/60 border-white/[0.08] hover:border-white/[0.15]"
            >
              {assigned.has(selected.id) ? '✓ Assigned' : 'Assign'}
            </button>
            <span className="text-[9px] text-white/15 ml-auto">§20.2 Incident click-through</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4">
        {Object.entries(SEV_COLOR).map(([sev, col]) => (
          <div key={sev} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col }} />
            <span className="text-[10px] text-white/30 capitalize">{sev}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
