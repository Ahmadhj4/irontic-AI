'use client';
import { Card, CardHeader } from '@/components/ui/Card';
import { LineChart } from '@/app/charts/LineChart';
import { AgentFinding } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface DashboardChartsProps {
  trendData: { date: string; grc: number; soc: number; pentest: number }[];
  recentFindings: AgentFinding[];
}

export function DashboardCharts({ trendData, recentFindings }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader title="Cross-Domain Risk Trend" subtitle="Composite scores over 10 weeks" />
        <LineChart
          data={trendData}
          xKey="date"
          lines={[
            { key: 'grc',     color: '#22D3EE', label: 'GRC'     },
            { key: 'soc',     color: '#8B5CF6', label: 'SOC'     },
            { key: 'pentest', color: '#F59E0B', label: 'Pentest' },
          ]}
          height={200}
        />
      </Card>
      <Card>
        <CardHeader title="Recent Cross-Agent Findings" subtitle={`${recentFindings.length} shared`} />
        <div className="space-y-2 mt-1">
          {recentFindings.length === 0 && <p className="text-xs text-white/30">No cross-agent findings yet — run a scan to populate</p>}
          {recentFindings.slice(0, 6).map(f => (
            <div key={f.id} className="flex items-start gap-2">
              <Badge variant={f.severity as 'critical'|'high'|'medium'|'low'|'info'}>{f.domain.toUpperCase()}</Badge>
              <p className="text-xs text-white/50 truncate">{f.title}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
