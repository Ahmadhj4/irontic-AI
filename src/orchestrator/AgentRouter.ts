// ─────────────────────────────────────────────
//  AgentRouter — routes tasks to agents,
//  manages lifecycle, emits orchestrator events
// ─────────────────────────────────────────────
import { v4 as uuidv4 } from '@/lib/uuid';
import { EventEmitter } from '@/lib/EventEmitter';
import {
  AgentTask,
  AgentDomain,
  AgentTaskResult,
  OrchestratorEvent,
  TaskPriority,
  AgentState,
} from '@/types';
import { IAgent } from '@/types/agent.types';
import { TaskQueue } from './TaskQueue';
import { ConflictResolver } from './ConflictResolver';
import { grcAgent } from '@/agents/GRCAgent';
import { socAgent } from '@/agents/SOCAgent';
import { avAgent } from '@/agents/AVAgent';
import { pentestAgent } from '@/agents/PentestAgent';

export class AgentRouter extends EventEmitter {
  private agents: Map<AgentDomain, IAgent>;
  private queue: TaskQueue;
  private resolver: ConflictResolver;
  private activeTasks: Map<string, AgentTask> = new Map();
  private isProcessing = false;

  constructor() {
    super();
    this.queue = new TaskQueue();
    this.resolver = new ConflictResolver();
    // Four core BRD domains (Tech Doc §10)
    this.agents = new Map<AgentDomain, IAgent>([
      ['grc',     grcAgent as IAgent],
      ['soc',     socAgent as IAgent],
      ['av',      avAgent as IAgent],
      ['pentest', pentestAgent as IAgent],
    ]);
  }

  // ── Submit a task ─────────────────────────────────────────
  submit(
    domain: AgentDomain,
    action: string,
    payload?: Record<string, unknown>,
    priority: TaskPriority = 'medium'
  ): AgentTask {
    const task: AgentTask = {
      id: uuidv4(),
      domain,
      action,
      priority,
      status: 'queued',
      payload,
      createdAt: new Date(),
    };

    // Check for conflicts
    const active = Array.from(this.activeTasks.values());
    const conflict = this.resolver.detectTaskConflict(task, active);
    if (conflict) {
      this.emit('event', {
        type: 'conflict_detected',
        taskId: task.id,
        domain,
        payload: conflict,
        timestamp: new Date(),
      } as OrchestratorEvent);
    }

    this.queue.enqueue(task);
    this.emit('event', {
      type: 'task_queued',
      taskId: task.id,
      domain,
      timestamp: new Date(),
    } as OrchestratorEvent);

    // Kick off processing
    void this.processQueue();
    return task;
  }

  // ── Run all agents' default health check in parallel ──────
  async runFullScan(): Promise<Record<AgentDomain, AgentTaskResult>> {
    // Four core domains — parallel full scan (Tech Doc §8 runFullScan)
    const domainActions: [AgentDomain, string, Record<string, unknown>][] = [
      ['grc',     'assess_controls', {}],
      ['soc',     'triage_alert',    {}],
      ['av',      'scan_endpoints',  {}],
      ['pentest', 'run_scan',        {}],
    ];

    const results = await Promise.allSettled(
      domainActions.map(([domain, action, payload]) =>
        this.dispatchDirect(domain, action, payload)
      )
    );

    const output: Partial<Record<AgentDomain, AgentTaskResult>> = {};
    domainActions.forEach(([domain], i) => {
      const r = results[i];
      output[domain] = r.status === 'fulfilled'
        ? r.value
        : { success: false, message: (r.reason as Error).message };
    });

    return output as Record<AgentDomain, AgentTaskResult>;
  }

  // ── Get all agent states ──────────────────────────────────
  getAllStates(): Record<AgentDomain, AgentState> {
    const states: Partial<Record<AgentDomain, AgentState>> = {};
    Array.from(this.agents.entries()).forEach(([domain, agent]) => {
      states[domain as AgentDomain] = agent.getState();
    });
    return states as Record<AgentDomain, AgentState>;
  }

  getAgent(domain: AgentDomain): IAgent | undefined {
    return this.agents.get(domain);
  }

  getQueueSize(): number {
    return this.queue.size;
  }

  getConflicts() {
    return this.resolver.getConflicts();
  }

  // ── Internal processing loop ──────────────────────────────
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.isEmpty()) return;
    this.isProcessing = true;

    while (!this.queue.isEmpty()) {
      const task = this.queue.dequeue();
      if (!task) break;

      const agent = this.agents.get(task.domain);
      if (!agent) continue;

      const agentState = agent.getState();
      // Re-queue if agent is busy (assigned/executing/reporting)
      if (agentState.status === 'assigned' || agentState.status === 'executing' || agentState.status === 'reporting') {
        this.queue.enqueue({ ...task, status: 'queued' });
        await new Promise(r => setTimeout(r, 100));
        continue;
      }

      this.activeTasks.set(task.id, task);
      this.emit('event', {
        type: 'task_started',
        taskId: task.id,
        domain: task.domain,
        agentId: agent.agentId,
        timestamp: new Date(),
      } as OrchestratorEvent);

      try {
        const result = await agent.executeTask(task);
        this.activeTasks.delete(task.id);

        this.emit('event', {
          type: 'task_completed',
          taskId: task.id,
          domain: task.domain,
          agentId: agent.agentId,
          payload: result,
          timestamp: new Date(),
        } as OrchestratorEvent);

        if (result.findings?.length) {
          for (const finding of result.findings) {
            this.emit('event', {
              type: 'finding_detected',
              domain: task.domain,
              agentId: agent.agentId,
              payload: finding,
              timestamp: new Date(),
            } as OrchestratorEvent);
          }
        }
      } catch (err) {
        this.activeTasks.delete(task.id);
        this.emit('event', {
          type: 'task_failed',
          taskId: task.id,
          domain: task.domain,
          payload: err,
          timestamp: new Date(),
        } as OrchestratorEvent);
      }
    }

    this.isProcessing = false;
  }

  private async dispatchDirect(
    domain: AgentDomain,
    action: string,
    payload: Record<string, unknown>
  ): Promise<AgentTaskResult> {
    const agent = this.agents.get(domain);
    if (!agent) throw new Error(`No agent for domain: ${domain}`);
    const task: AgentTask = {
      id: uuidv4(), domain, action, priority: 'medium',
      status: 'queued', payload, createdAt: new Date(),
    };
    return agent.executeTask(task);
  }
}

// Singleton orchestrator
export const agentRouter = new AgentRouter();
