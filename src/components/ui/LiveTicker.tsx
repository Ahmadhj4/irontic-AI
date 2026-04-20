'use client';
import { useState, useEffect } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { LiveEvent } from '@/services/realtime';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400 border-red-500/30 bg-red-500/5',
  high:     'text-orange-400 border-orange-500/30 bg-orange-500/5',
  medium:   'text-amber-400 border-amber-500/30 bg-amber-500/5',
  low:      'text-blue-400 border-blue-500/30 bg-blue-500/5',
  info:     'text-slate-700 dark:text-white/50 border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5',
};

const DOMAIN_COLORS: Record<string, string> = {
  SOC:     'text-red-300',
  EP:      'text-green-400',
  GRC:     'text-indigo-300',
  Pentest: 'text-orange-400',
  System:  'text-slate-500 dark:text-white/40',
};

function timeAgo(d: Date) {
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function LiveDot({ pulse = true }: { pulse?: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-irontic-cyan opacity-60" />}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${pulse ? 'bg-irontic-cyan' : 'bg-slate-300 dark:bg-white/20'}`} />
    </span>
  );
}

// ─── Compact ticker bar (for top of dashboards) ───────────────────────────────

export function LiveTickerBar() {
  const { events, isLive } = useRealtime(20);
  const [displayed, setDisplayed] = useState<LiveEvent | null>(null);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (!events[0] || events[0] === displayed) return;
    setFadeIn(false);
    const t = setTimeout(() => {
      setDisplayed(events[0]);
      setFadeIn(true);
    }, 150);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events[0]]);

  if (!displayed) return null;

  return (
    <div className={`flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] px-3 py-2 transition-all duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      <LiveDot pulse={isLive} />
      <span className={`text-[10px] font-bold uppercase tracking-wider ${DOMAIN_COLORS[displayed.domain]}`}>{displayed.domain}</span>
      <span className="text-xs text-slate-700 dark:text-white/60 truncate flex-1">{displayed.title}</span>
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[displayed.severity]}`}>
        {displayed.severity.toUpperCase()}
      </span>
      <span className="text-[10px] text-slate-500 dark:text-white/25 shrink-0">{timeAgo(displayed.timestamp)}</span>
    </div>
  );
}

// ─── Full live feed panel ─────────────────────────────────────────────────────

export function LiveFeedPanel({ maxVisible = 12 }: { maxVisible?: number }) {
  const { events, isLive, newCount, clearNewCount } = useRealtime(50);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.015]">
        <LiveDot pulse={isLive} />
        <span className="text-sm font-semibold text-slate-800 dark:text-white/70">Live Event Feed</span>
        {newCount > 0 && (
          <button
            onClick={clearNewCount}
            className="ml-auto text-xs font-semibold bg-irontic-cyan/10 text-irontic-cyan border border-irontic-cyan/20 rounded-full px-2 py-0.5 hover:bg-irontic-cyan/20 transition-colors"
          >
            {newCount} new
          </button>
        )}
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-white/[0.04]">
        {events.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-slate-500 dark:text-white/30">Waiting for events…</p>
          </div>
        )}
        {events.slice(0, maxVisible).map(event => (
          <div key={event.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
              event.severity === 'critical' ? 'bg-red-500' :
              event.severity === 'high' ? 'bg-orange-400' :
              event.severity === 'medium' ? 'bg-amber-400' :
              event.severity === 'low' ? 'bg-blue-400' : 'bg-slate-300 dark:bg-white/20'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className={`text-[10px] font-bold uppercase ${DOMAIN_COLORS[event.domain]}`}>{event.domain}</span>
                <span className="text-xs text-slate-800 dark:text-white/70 truncate">{event.title}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-white/30 mt-0.5 truncate">{event.detail}</p>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-white/20 shrink-0 mt-0.5">{timeAgo(event.timestamp)}</span>
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-2.5 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.015] flex items-center gap-4">
        <span className="text-[10px] text-slate-500 dark:text-white/25">{events.length} events captured</span>
        <span className={`text-[10px] font-medium ${isLive ? 'text-irontic-cyan' : 'text-slate-500 dark:text-white/25'}`}>
          {isLive ? '● Live' : '○ Paused'}
        </span>
      </div>
    </div>
  );
}

// ─── Pulse indicator for navbars / stat cards ─────────────────────────────────

export function LiveIndicator({ label = 'Live' }: { label?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <LiveDot />
      <span className="text-[10px] font-semibold text-irontic-cyan uppercase tracking-wider">{label}</span>
    </div>
  );
}
