// ─────────────────────────────────────────────
//  BaseAgent — abstract base class for all agents
// ─────────────────────────────────────────────
import { v4 as uuidv4 } from '@/lib/uuid';
import {
  IAgent,
  AgentDomain,
  AgentState,
  AgentStatus,
  AgentTask,
  AgentTaskResult,
  AgentFinding,
  AgentMetrics,
  FindingSeverity,
} from '@/types';

export abstract class BaseAgent implements IAgent {
  readonly agentId: string;
  readonly domain: AgentDomain;

  protected status: AgentStatus = 'initializing';
  protected currentTask: AgentTask | undefined;
  protected findings: AgentFinding[] = [];
  protected tasksCompleted = 0;
  protected tasksFailed = 0;
  protected taskDurations: number[] = [];
  protected lastHeartbeat: Date = new Date();

  constructor(domain: AgentDomain, agentId?: string) {
    this.domain = domain;
    this.agentId = agentId ?? `${domain}-agent-${uuidv4().slice(0, 8)}`;
    // Transition to IDLE after initialization (Tech Doc §10.1)
    this.status = 'idle';
  }

  // ── Abstract: each agent implements its own task handler ──
  protected abstract handleTask(task: AgentTask): Promise<AgentTaskResult>;

  // ── Public interface ──────────────────────────────────────
  getState(): AgentState {
    return {
      agentId: this.agentId,
      domain: this.domain,
      status: this.status,
      currentTask: this.currentTask,
      tasksCompleted: this.tasksCompleted,
      tasksFailed: this.tasksFailed,
      lastHeartbeat: this.lastHeartbeat,
      findings: [...this.findings],
      metrics: this.computeMetrics(),
    };
  }

  async executeTask(task: AgentTask): Promise<AgentTaskResult> {
    if (this.status === 'terminated') {
      throw new Error(`Agent ${this.agentId} is terminated and cannot accept tasks.`);
    }

    // ASSIGNED → EXECUTING lifecycle (Tech Doc §10.1)
    this.status = 'assigned';
    this.currentTask = { ...task, status: 'in_progress', startedAt: new Date() };
    const startTime = Date.now();

    try {
      this.status = 'executing';
      const result = await this.handleTask(task);
      const duration = Date.now() - startTime;
      this.taskDurations.push(duration);
      this.tasksCompleted++;

      // REPORTING: generating structured output
      this.status = 'reporting';
      this.currentTask = { ...this.currentTask, status: 'completed', completedAt: new Date(), result };

      if (result.findings?.length) {
        this.findings.push(...result.findings);
      }

      this.status = 'idle';
      this.lastHeartbeat = new Date();
      return result;
    } catch (err) {
      this.tasksFailed++;
      const error = err instanceof Error ? err.message : 'Unknown error';
      this.currentTask = { ...this.currentTask!, status: 'failed', completedAt: new Date(), error };
      this.status = 'error';
      this.lastHeartbeat = new Date();
      return { success: false, message: error };
    }
  }

  // Keep pause/resume for operator-initiated pauses
  pause() {
    if (this.status !== 'terminated') this.status = 'idle';
  }

  resume() {
    if (this.status === 'error') this.status = 'idle';
  }

  terminate() {
    this.status = 'terminated';
    this.currentTask = undefined;
  }

  // ── Helpers ────────────────────────────────────────────────
  protected createFinding(
    title: string,
    description: string,
    severity: FindingSeverity,
    affectedAsset?: string,
    recommendation?: string,
  ): AgentFinding {
    return {
      id: uuidv4(),
      domain: this.domain,
      title,
      description,
      severity,
      affectedAsset,
      recommendation,
      detectedAt: new Date(),
    };
  }

  private computeMetrics(): AgentMetrics {
    const total = this.tasksCompleted + this.tasksFailed;
    const avg = this.taskDurations.length
      ? this.taskDurations.reduce((a, b) => a + b, 0) / this.taskDurations.length
      : 0;

    const bySeverity: Record<FindingSeverity, number> = {
      critical: 0, high: 0, medium: 0, low: 0, info: 0,
    };
    for (const f of this.findings) bySeverity[f.severity]++;

    return {
      avgTaskDurationMs: Math.round(avg),
      successRate: total > 0 ? this.tasksCompleted / total : 1,
      findingsTotal: this.findings.length,
      findingsBySeverity: bySeverity,
    };
  }
}
