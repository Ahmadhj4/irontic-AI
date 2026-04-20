'use client';
import { Card } from '@/components/ui/Card';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { Badge } from '@/components/ui/Badge';
import { AgentState, AgentDomain } from '@/types';

interface DomainStat {
  domain: AgentDomain;
  label: string;
  score: number;
  criticals: number;
  agentState: AgentState;
}

export function DashboardStats({ stats }: { stats: DomainStat[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map(s => (
        <Card key={s.domain} className="flex flex-col items-center py-4 gap-2">
          <ScoreGauge score={s.score} size="sm" />
          <p className="text-xs font-semibold text-gray-700">{s.label}</p>
          {s.criticals > 0 && <Badge variant="critical">{s.criticals} critical</Badge>}
          <span className={`text-[10px] capitalize ${(s.agentState.status as string) === 'executing' ? 'text-green-600' : 'text-gray-400'}`}>
            Agent {s.agentState.status}
          </span>
        </Card>
      ))}
    </div>
  );
}
