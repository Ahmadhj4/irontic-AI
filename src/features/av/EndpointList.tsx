'use client';
import { useState, useMemo, memo } from 'react';
import { Endpoint } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { SearchFilterRow } from '@/components/ui/SearchFilter';
import { IconWindows, IconLinux, IconMacOS, IconEndpoint } from '@/components/ui/Icons';

const statusVariant: Record<string, 'success' | 'high' | 'critical' | 'medium' | 'neutral'> = {
  protected:   'success',
  at_risk:     'medium',
  infected:    'critical',
  quarantined: 'high',
  offline:     'neutral',
};

type StatusFilter = 'protected' | 'at_risk' | 'infected' | 'quarantined' | 'offline';

const STATUS_FILTER_COLORS: Partial<Record<StatusFilter | 'all', string>> = {
  all:         'bg-irontic-purple/20 text-irontic-sky border-irontic-purple/40',
  protected:   'bg-green-500/20 text-green-400 border-green-500/40',
  at_risk:     'bg-amber-500/20 text-amber-400 border-amber-500/40',
  infected:    'bg-red-500/20 text-red-400 border-red-500/40',
  quarantined: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  offline:     'bg-white/10 text-white/40 border-white/10',
};

function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function OsIcon({ os }: { os: string }) {
  const cls = 'w-5 h-5 text-white/40 shrink-0';
  if (os === 'Windows') return <IconWindows className={cls} />;
  if (os === 'Linux')   return <IconLinux   className={cls} />;
  if (os === 'macOS')   return <IconMacOS   className={cls} />;
  return <IconEndpoint className={cls} />;
}

// Memoized row to prevent re-renders when unrelated endpoints update
const EndpointRow = memo(function EndpointRow({ ep, onScan }: { ep: Endpoint; onScan?: (id: string) => void }) {
  return (
    <div className="py-3 flex items-center gap-3 group hover:bg-white/[0.01] -mx-1 px-1 rounded-lg transition-colors">
      <OsIcon os={ep.os} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white/85 truncate">{ep.name}</p>
          <Badge variant={statusVariant[ep.status] ?? 'neutral'}>
            {ep.status.replace(/_/g, ' ')}
          </Badge>
        </div>
        <p className="text-xs text-white/35 mt-0.5 truncate">
          {ep.ipAddress} · {ep.os} {ep.osVersion} · <span className="text-irontic-sky/50">{ep.department}</span>
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-xs text-white/30">Seen {timeAgo(ep.lastSeen)}</p>
        {ep.threatsDetected > 0 ? (
          <p className="text-xs text-red-400 font-medium mt-0.5">{ep.threatsDetected} threat{ep.threatsDetected > 1 ? 's' : ''}</p>
        ) : (
          <p className="text-xs text-green-400/60 mt-0.5">Clean</p>
        )}
        {onScan && (
          <button
            onClick={() => onScan(ep.id)}
            className="mt-1 text-xs text-irontic-cyan hover:text-irontic-purple transition-colors font-medium"
          >
            Scan →
          </button>
        )}
      </div>
    </div>
  );
});

export function EndpointList({
  endpoints,
  onScan,
  showSearch = false,
}: {
  endpoints: Endpoint[];
  onScan?: (id: string) => void;
  showSearch?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter | 'all'>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return endpoints.filter(ep => {
      const matchStatus = statusFilter === 'all' || ep.status === statusFilter;
      const matchSearch = !q || (
        ep.name.toLowerCase().includes(q) ||
        ep.ipAddress.toLowerCase().includes(q) ||
        ep.os.toLowerCase().includes(q) ||
        ep.department.toLowerCase().includes(q) ||
        (ep.owner ?? '').toLowerCase().includes(q)
      );
      return matchStatus && matchSearch;
    });
  }, [endpoints, search, statusFilter]);

  return (
    <div className="space-y-3">
      {showSearch && (
        <SearchFilterRow
          search={search}
          onSearchChange={setSearch}
          filter={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: 'all', label: 'All' },
            { value: 'protected', label: 'Protected' },
            { value: 'at_risk', label: 'At Risk' },
            { value: 'infected', label: 'Infected' },
            { value: 'quarantined', label: 'Quarantined' },
            { value: 'offline', label: 'Offline' },
          ]}
          filterColorMap={STATUS_FILTER_COLORS}
          searchPlaceholder="Search endpoints, IPs, departments…"
          resultCount={filtered.length}
        />
      )}

      <div className="divide-y divide-white/[0.05]">
        {filtered.length === 0 && (
          <p className="text-sm text-white/30 py-4 text-center">
            {search || statusFilter !== 'all' ? 'No endpoints match your filters' : 'No endpoints registered'}
          </p>
        )}
        {filtered.map(ep => (
          <EndpointRow key={ep.id} ep={ep} onScan={onScan} />
        ))}
      </div>
    </div>
  );
}
