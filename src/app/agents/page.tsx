'use client';
/**
 * Agent Activity — /agents (§3.1 Navigation Structure)
 * Access roles: Security Engineer, Admin
 * Displays full agent lifecycle state machine per §21.1.
 */
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { agentRouter } from '@/orchestrator';

type AgentLifecycle =
  | 'INITIALIZING' | 'IDLE' | 'ASSIGNED'
  | 'EXECUTING'    | 'REPORTING' | 'ERROR' | 'TERMINATED';

interface AgentRow {
  id: string;
  name: string;
  domain: string;
  state: AgentLifecycle;
  health: number;
  queueDepth: number;
  lastAction: string;
  model: string;
  uptime: string;
  tasksCompleted: number;
  tasksFailed: number;
}

const STATE_DESCRIPTIONS: Record<AgentLifecycle, string> = {
  INITIALIZING: 'Container starting; loading model weights, tool configs, and MCP registration',
  IDLE:         'Ready for tasks; heartbeat published every 30s to orchestration.lifecycle topic',
  ASSIGNED:     'Task received; pre-execution validation and context loading in progress',
  EXECUTING:    'Task in progress; streaming logs to Kafka; periodic progress events emitted',
  REPORTING:    'Execution complete; generating structured output, writing to data layer, MCP context update',
  ERROR:        'Unhandled exception; full stack trace published; self-healing initiated',
  TERMINATED:   'Graceful shutdown; resources de-registered; MCP contexts closed',
};

const STATE_VARIANT: Record<AgentLifecycle, 'success' | 'medium' | 'high' | 'critical' | 'neutral' | 'info'> = {
  INITIALIZING: 'info',
  IDLE:         'neutral',
  ASSIGNED:     'medium',
  EXECUTING:    'success',
  REPORTING:    'info',
  ERROR:        'critical',
  TERMINATED:   'neutral',
};

const MOCK_AGENTS: AgentRow[] = [
  { id:'grc-001', name:'GRC Agent',  domain:'GRC',     state:'EXECUTING',    health:94, queueDepth:3,  lastAction:'ISO 27001 gap assessment — A.9.4.2', model:'claude-sonnet-4',   uptime:'12d 4h',  tasksCompleted:47,  tasksFailed:1  },
  { id:'soc-001', name:'SOC Agent',  domain:'SOC',     state:'EXECUTING',    health:88, queueDepth:12, lastAction:'Alert triage — T1059.001 enrichment', model:'claude-sonnet-4',   uptime:'8d 22h',  tasksCompleted:312, tasksFailed:4  },
  { id:'av-001',  name:'EP Agent',   domain:'EP',      state:'IDLE',         health:97, queueDepth:0,  lastAction:'CrowdStrike endpoint health scan done',model:'LlamaIndex+Claude', uptime:'15d 1h',  tasksCompleted:89,  tasksFailed:0  },
  { id:'pt-001',  name:'PT Agent',   domain:'PT',      state:'ASSIGNED',     health:82, queueDepth:2,  lastAction:'Nmap host discovery 10.10.0.0/22',    model:'CrewAI Crew',       uptime:'3d 8h',   tasksCompleted:14,  tasksFailed:2  },
];

export default function AgentsPage() {
  const { data: session } = useSession();
  const [agents, setAgents] = useState<AgentRow[]>(MOCK_AGENTS);
  const liveStates = agentRouter.getAllStates();

  const restartAgent  = (id: string) => setAgents(p => p.map(a => a.id === id ? { ...a, state:'INITIALIZING' as AgentLifecycle } : a));
  const terminateAgent = (id: string) => setAgents(p => p.map(a => a.id === id ? { ...a, state:'TERMINATED' as AgentLifecycle  } : a));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agent Activity"
        subtitle="Live lifecycle state · Orchestration metrics · §21 Agent Specifications"
        action={
          <Button size="sm">
            Deploy Agent
          </Button>
        }
      />

      {/* Lifecycle state reference */}
      <Card>
        <CardHeader title="Agent Lifecycle State Machine" subtitle="§21.1 — All valid state transitions" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
          {(Object.entries(STATE_DESCRIPTIONS) as [AgentLifecycle, string][]).map(([state, desc]) => (
            <div key={state} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
              <Badge variant={STATE_VARIANT[state]}>{state}</Badge>
              <p className="text-[10px] text-white/30 mt-1.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Live agent registry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map(agent => {
          const live = liveStates[agent.domain.toLowerCase() as keyof typeof liveStates];
          return (
            <Card key={agent.id} glow>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-base font-semibold text-white/90">{agent.name}</p>
                  <p className="text-[10px] font-mono text-white/30 mt-0.5">{agent.id}</p>
                </div>
                <Badge variant={STATE_VARIANT[agent.state]}>{agent.state}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-xs">
                <div><span className="text-white/30">Model: </span><span className="text-white/70">{agent.model}</span></div>
                <div><span className="text-white/30">Uptime: </span><span className="text-white/70">{agent.uptime}</span></div>
                <div><span className="text-white/30">Queue: </span><span className="text-white/70">{agent.queueDepth} tasks</span></div>
                <div><span className="text-white/30">Completed: </span><span className="text-white/70">{live?.tasksCompleted ?? agent.tasksCompleted}</span></div>
                <div><span className="text-white/30">Failed: </span><span className="text-red-400/70">{live?.tasksFailed ?? agent.tasksFailed}</span></div>
                <div><span className="text-white/30">Success: </span><span className="text-irontic-cyan/70">{live ? `${(live.metrics.successRate * 100).toFixed(0)}%` : `${Math.round((agent.tasksCompleted / (agent.tasksCompleted + agent.tasksFailed)) * 100)}%`}</span></div>
              </div>

              {/* Health bar */}
              <div className="mb-1 flex justify-between text-[10px]">
                <span className="text-white/30">Agent Health</span>
                <span className="text-white/60 font-semibold">{agent.health}%</span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-1.5 mb-3">
                <div
                  className={`h-1.5 rounded-full transition-all ${agent.health >= 90 ? 'bg-irontic-cyan' : agent.health >= 70 ? 'bg-amber-400' : 'bg-red-500'}`}
                  style={{ width: `${agent.health}%` }}
                />
              </div>

              <p className="text-[10px] text-white/20 truncate mb-3">Last: {agent.lastAction}</p>

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => restartAgent(agent.id)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white/50 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-lg transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Restart
                </button>
                <button
                  onClick={() => terminateAgent(agent.id)}
                  disabled={agent.state === 'TERMINATED'}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-400/60 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Terminate
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
