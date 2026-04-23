// ─────────────────────────────────────────────
//  Core Agent Types
//  Used by every agent in the system
// ─────────────────────────────────────────────

// Four core BRD domains: GRC, SOC, AV (Antivirus/Endpoint), Pentest
export type AgentDomain = 'grc' | 'soc' | 'av' | 'pentest';

// Seven-state lifecycle aligned with Tech Doc Section 10.1
export type AgentStatus =
  | 'initializing'  // container starting; loading config and MCP registration
  | 'idle'          // ready for tasks; heartbeat published
  | 'assigned'      // task received; pre-execution validation in progress
  | 'executing'     // task in progress; streaming logs
  | 'reporting'     // execution complete; generating structured output
  | 'error'         // unhandled exception; self-healing initiated
  | 'terminated';   // graceful shutdown; resources de-registered

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

// ─── Task ──────────────────────────────────────
export interface AgentTask {
  id: string;
  domain: AgentDomain;
  action: string;           // e.g. "scan", "assess", "remediate"
  priority: TaskPriority;
  status: TaskStatus;
  payload?: Record<string, unknown>;
  result?: AgentTaskResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface AgentTaskResult {
  success: boolean;
  data?: unknown;
  findings?: AgentFinding[];
  recommendations?: string[];
  message?: string;
}

// ─── Finding ───────────────────────────────────
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AgentFinding {
  id: string;
  domain: AgentDomain;
  title: string;
  description: string;
  severity: FindingSeverity;
  affectedAsset?: string;
  recommendation?: string;
  detectedAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

// ─── Agent State ────────────────────────────────
export interface AgentState {
  agentId: string;
  domain: AgentDomain;
  status: AgentStatus;
  currentTask?: AgentTask;
  tasksCompleted: number;
  tasksFailed: number;
  lastHeartbeat: Date;
  findings: AgentFinding[];
  metrics: AgentMetrics;
}

export interface AgentMetrics {
  avgTaskDurationMs: number;
  successRate: number;       // 0–1
  findingsTotal: number;
  findingsBySeverity: Record<FindingSeverity, number>;
}

// ─── Agent Interface ────────────────────────────
export interface IAgent {
  readonly agentId: string;
  readonly domain: AgentDomain;
  getState(): AgentState;
  executeTask(task: AgentTask): Promise<AgentTaskResult>;
  pause(): void;
  resume(): void;
  terminate(): void;
}

// ─── Orchestrator Types ─────────────────────────
export interface OrchestratorEvent {
  type: 'task_queued' | 'task_started' | 'task_completed' | 'task_failed' | 'agent_status_changed' | 'finding_detected' | 'conflict_detected' | 'conflict_resolved' | 'agent_soft_restarted' | 'agent_hard_restarted' | 'agent_p1_incident';
  agentId?: string;
  taskId?: string;
  domain?: AgentDomain;
  payload?: unknown;
  timestamp: Date;
}

// ─── MCP Types ──────────────────────────────────
export interface MCPContext {
  sessionId: string;
  sharedFindings: AgentFinding[];
  agentStates: Record<string, AgentState>;
  lastUpdated: Date;
}

export interface MCPMessage {
  from: AgentDomain;
  to: AgentDomain | 'broadcast';
  type: 'finding_share' | 'context_request' | 'context_response' | 'alert';
  payload: unknown;
  timestamp: Date;
}
