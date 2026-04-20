'use client';
import { useState, useMemo, memo } from 'react';
import { SOCAlert } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { SearchFilterRow } from '@/components/ui/SearchFilter';

const severityVariant: Record<string, 'critical' | 'high' | 'medium' | 'low' | 'info'> = {
  critical: 'critical', high: 'high', medium: 'medium', low: 'low', info: 'info',
};

const statusVariant: Record<string, 'high' | 'medium' | 'success' | 'neutral' | 'info'> = {
  new: 'high', investigating: 'medium', contained: 'success',
  resolved: 'neutral', false_positive: 'neutral',
};

type SeverityFilter = 'critical' | 'high' | 'medium' | 'low';

function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const SEVERITY_FILTER_COLORS: Partial<Record<SeverityFilter | 'all', string>> = {
  all:      'bg-violet-100 dark:bg-irontic-purple/20 text-violet-700 dark:text-irontic-sky border-violet-200 dark:border-irontic-purple/40',
  critical: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/40',
  high:     'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/40',
  medium:   'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/40',
  low:      'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/40',
};

/**
 * AI triage summaries — pre-loaded per alert (Journey 1, step 2 §3.3).
 * In production these come from the SOC Agent enrichment pipeline.
 */
const AI_SUMMARIES: Record<string, string> = {
  new:          'AI enrichment in progress. ATT&CK mapping and asset owner lookup pending.',
  investigating:'Enrichment complete. Threat intel matched against MISP IOC feed. Asset owner notified. Confidence score computed.',
  contained:    'Containment confirmed. No further lateral movement detected. Playbook execution logged.',
  resolved:     'Resolved. Root cause identified. Post-mortem scheduled. IOCs added to blocklist.',
  false_positive:'Marked false positive. Suppression rule created to prevent recurrence.',
};

// §17.5 SLA per severity: CRITICAL=15min, HIGH=60min, MEDIUM=240min
const SLA_MINS: Record<string, number> = { critical: 15, high: 60, medium: 240, low: 480 };

function SLABadge({ severity, detectedAt }: { severity: string; detectedAt: Date }) {
  const slaMins = SLA_MINS[severity] ?? 240;
  const elapsedMins = Math.floor((Date.now() - new Date(detectedAt).getTime()) / 60000);
  const remaining = slaMins - elapsedMins;
  const pct = Math.max(0, Math.min(100, (remaining / slaMins) * 100));
  const breached = remaining <= 0;
  const critical = pct < 25;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="w-16 h-1 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${breached ? 'bg-red-500' : critical ? 'bg-orange-400' : 'bg-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[9px] font-bold ${breached ? 'text-red-500' : critical ? 'text-orange-400' : 'text-slate-500 dark:text-white/30'}`}>
        {breached ? 'SLA BREACH' : remaining < 60 ? `${remaining}m` : `${Math.floor(remaining/60)}h`}
      </span>
    </div>
  );
}

const AlertRow = memo(function AlertRow({ alert, onTriage }: { alert: SOCAlert; onTriage?: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [justification, setJustification] = useState('');
  const [justifyFor, setJustifyFor] = useState<string | null>(null);

  return (
    <>
      {/* Main row */}
      <div
        className={`py-3 flex items-start gap-3 group -mx-1 px-1 rounded-lg transition-colors cursor-pointer ${expanded ? 'bg-slate-100 dark:bg-white/[0.03]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.01]'}`}
        onClick={() => setExpanded(e => !e)}
        role="button"
        aria-expanded={expanded}
        aria-label={`${alert.severity} alert: ${alert.title}`}
      >
        {/* Expand chevron */}
        <span className="mt-1 text-slate-400 dark:text-white/20 shrink-0">
          {expanded
            ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          }
        </span>
        <Badge variant={severityVariant[alert.severity]}>{alert.severity.toUpperCase()}</Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white/85 truncate">{alert.title}</p>
          <p className="text-xs text-slate-600 dark:text-white/35 mt-0.5 truncate">{alert.source} · {alert.affectedAssets.join(', ')}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {alert.mitreTechnique && (
              <span className="inline-block text-[10px] font-mono bg-irontic-purple/10 text-irontic-sky border border-irontic-purple/20 px-1.5 py-0.5 rounded">
                {alert.mitreTechnique}
              </span>
            )}
            {alert.confidence !== undefined && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                alert.confidence >= 85 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                alert.confidence >= 65 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-white/30 border-slate-300 dark:border-white/[0.08]'
              }`}>
                {alert.confidence}% conf
              </span>
            )}
            {(alert.tags ?? []).map(tag => (
              <span key={tag} className="text-[10px] text-slate-500 dark:text-white/25 bg-slate-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/[0.05]">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0" onClick={e => e.stopPropagation()}>
          <Badge variant={statusVariant[alert.status] ?? 'neutral'}>{alert.status.replace('_', ' ')}</Badge>
          <p className="text-xs text-slate-500 dark:text-white/25 mt-1">{timeAgo(alert.detectedAt)}</p>
          {onTriage && alert.status === 'new' && (
            <button
              onClick={() => onTriage(alert.id)}
              className="mt-1 text-xs text-irontic-cyan hover:text-irontic-purple transition-colors font-medium"
            >
              Triage →
            </button>
          )}
          {/* §17.5 SLA countdown */}
          {(alert.status === 'new' || alert.status === 'investigating') && (
            <SLABadge severity={alert.severity} detectedAt={alert.detectedAt} />
          )}
        </div>
      </div>

      {/* Expanded triage panel — AI triage summary + actions (Journey 1, §3.3) */}
      {expanded && (
        <div className="mx-1 mb-2 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg p-3">
          {/* AI triage summary */}
          <div className="flex items-start gap-2 mb-3">
            <span className="relative flex h-2 w-2 mt-1 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-irontic-cyan opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-irontic-cyan" />
            </span>
            <div>
              <p className="text-[10px] font-semibold text-irontic-cyan/70 uppercase tracking-wider mb-1">AI Triage Summary</p>
              <p className="text-xs text-slate-700 dark:text-white/50 leading-relaxed">
                {AI_SUMMARIES[alert.status] ?? AI_SUMMARIES['new']}
                {alert.mitreTechnique && ` MITRE technique: ${alert.mitreTechnique}.`}
                {` Asset: ${alert.affectedAssets[0] ?? 'unknown'}.`}
                {alert.confidence !== undefined && ` Confidence score: ${alert.confidence}%.`}
              </p>
            </div>
          </div>

          {/* Triage action buttons: Escalate / Close / Snooze — §3.3 Journey 1 step 4 */}
          <div className="space-y-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setJustifyFor(j => j === 'escalate' ? null : 'escalate')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25 transition-colors"
              >
                ↑ Escalate
              </button>
              <button
                onClick={() => setJustifyFor(j => j === 'close' ? null : 'close')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
              >
                ✓ Close
              </button>
              <button
                onClick={() => setJustifyFor(j => j === 'snooze' ? null : 'snooze')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-white/40 border border-slate-300 dark:border-white/[0.08] transition-colors"
              >
                ⏸ Snooze 30m
              </button>
            </div>
            {/* Written justification — required for confirmed writes · §9.1 */}
            {justifyFor && (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <textarea
                    value={justification}
                    onChange={e => setJustification(e.target.value)}
                    placeholder={`Written justification required for "${justifyFor}" action — logged to immutable audit trail`}
                    rows={2}
                    className="w-full text-xs bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.10] rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white/70 placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-irontic-purple/40 resize-none"
                  />
                </div>
                <button
                  disabled={!justification.trim()}
                  onClick={() => { onTriage?.(alert.id); setJustifyFor(null); setJustification(''); }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-irontic-purple/20 hover:bg-irontic-purple/30 text-irontic-purple border border-irontic-purple/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  Confirm
                </button>
              </div>
            )}
            {!justifyFor && <p className="text-[10px] text-slate-500 dark:text-white/20">Actions require written justification · logged to audit trail</p>}
          </div>
        </div>
      )}
    </>
  );
});

export function AlertFeed({
  alerts,
  onTriage,
  showSearch = false,
}: {
  alerts: SOCAlert[];
  onTriage?: (id: string) => void;
  showSearch?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter | 'all'>('all');

  const filtered = useMemo(() => {
    return alerts.filter(alert => {
      const matchSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || (
        alert.title.toLowerCase().includes(q) ||
        alert.source.toLowerCase().includes(q) ||
        alert.affectedAssets.some(a => a.toLowerCase().includes(q)) ||
        (alert.mitreTechnique ?? '').toLowerCase().includes(q) ||
        (alert.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
      return matchSeverity && matchSearch;
    });
  }, [alerts, search, severityFilter]);

  return (
    <div className="space-y-3">
      {showSearch && (
        <SearchFilterRow
          search={search}
          onSearchChange={setSearch}
          filter={severityFilter}
          onFilterChange={setSeverityFilter}
          filterOptions={[
            { value: 'all', label: 'All' },
            { value: 'critical', label: 'Critical' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
          filterColorMap={SEVERITY_FILTER_COLORS}
          searchPlaceholder="Search alerts, assets, MITRE…"
          resultCount={filtered.length}
        />
      )}

      <div className="divide-y divide-slate-200 dark:divide-white/[0.05]">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-white/30 py-4 text-center">
            {search || severityFilter !== 'all' ? 'No alerts match your filters' : 'No active alerts'}
          </p>
        )}
        {filtered.map(alert => (
          <AlertRow key={alert.id} alert={alert} onTriage={onTriage} />
        ))}
      </div>
    </div>
  );
}
