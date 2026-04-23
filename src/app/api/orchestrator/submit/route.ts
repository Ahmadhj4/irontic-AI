import { NextRequest, NextResponse } from 'next/server';
import { AgentDomain, TaskPriority, OrchestratorEvent } from '@/types';
import { requireAuthWithRateLimit } from '@/lib/api-guard';
import { WRITE_LIMITER } from '@/lib/rate-limit';
import { agentRouter } from '@/orchestrator';

// Allowlists — Tech Doc §10, OWASP A03:2021 injection prevention
const VALID_DOMAINS:    AgentDomain[]  = ['grc', 'soc', 'av', 'pentest'];
const VALID_PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

const VALID_ACTIONS: Record<string, string[]> = {
  grc:     ['assess_controls', 'generate_report', 'review_risks'],
  soc:     ['hunt_threats', 'triage_alert', 'run_playbook'],
  av:      ['scan_endpoints', 'quarantine_file', 'update_signatures'],
  pentest: ['run_scan', 'enumerate_assets', 'test_controls'],
};

// ── In-memory task store ──────────────────────────────────────────────────
// Phase 2: replace with TimescaleDB + Redis (Tech Doc §23.1 tasks table)
export type TaskRecord = {
  id: string;
  domain: AgentDomain;
  action: string;
  priority: TaskPriority;
  status: 'queued' | 'assigned' | 'executing' | 'reporting' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
};

export const taskStore = new Map<string, TaskRecord>();

// Wire agentRouter events → taskStore (runs once at module load, §10 event-driven)
agentRouter.on('event', (evt: unknown) => {
  const e = evt as OrchestratorEvent;
  if (!e.taskId) return;
  const task = taskStore.get(e.taskId);
  if (!task) return;

  switch (e.type) {
    case 'task_started':
      taskStore.set(e.taskId, { ...task, status: 'executing', startedAt: new Date().toISOString() });
      break;
    case 'task_completed':
      taskStore.set(e.taskId, {
        ...task, status: 'completed',
        completedAt: new Date().toISOString(),
        result: (e.payload as Record<string, unknown>) ?? { success: true },
      });
      break;
    case 'task_failed':
      taskStore.set(e.taskId, {
        ...task, status: 'failed',
        completedAt: new Date().toISOString(),
        result: { success: false, error: String(e.payload) },
      });
      break;
  }
});

// ── Validation ────────────────────────────────────────────────────────────

function validateSubmit(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object';
  const b = body as Record<string, unknown>;

  const ALLOWED = new Set(['domain', 'action', 'priority', 'payload']);
  for (const key of Object.keys(b)) {
    if (!ALLOWED.has(key)) return `Unexpected field: ${key}`;
  }
  if (!VALID_DOMAINS.includes(b.domain as AgentDomain))
    return `domain must be one of: ${VALID_DOMAINS.join(', ')}`;
  if (typeof b.action !== 'string' || b.action.length === 0 || b.action.length > 100)
    return 'action must be a non-empty string ≤ 100 chars';
  if (!/^[a-z_]+$/.test(b.action))
    return 'action must contain only lowercase letters and underscores';
  if (!VALID_ACTIONS[b.domain as string]?.includes(b.action))
    return `Invalid action for domain '${b.domain}'. Valid: ${VALID_ACTIONS[b.domain as string]?.join(', ')}`;
  if (b.priority !== undefined && !VALID_PRIORITIES.includes(b.priority as TaskPriority))
    return `priority must be one of: ${VALID_PRIORITIES.join(', ')}`;
  if (b.payload !== undefined && (typeof b.payload !== 'object' || Array.isArray(b.payload)))
    return 'payload must be a plain object';
  return null;
}

// ── POST /api/orchestrator/submit ─────────────────────────────────────────
// Tech Doc §22.2 — POST /v1/tasks; FR-O1: task assigned within 500ms P99
export async function POST(req: NextRequest) {
  const { error } = await requireAuthWithRateLimit(req, WRITE_LIMITER);
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const validationError = validateSubmit(raw);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const b        = raw as Record<string, unknown>;
  const domain   = b.domain   as AgentDomain;
  const action   = b.action   as string;
  const priority = (b.priority ?? 'medium') as TaskPriority;
  const payload  = (b.payload ?? {}) as Record<string, unknown>;

  // Dispatch to AgentRouter — returns AgentTask synchronously, executes async
  const agentTask = agentRouter.submit(domain, action, { ...payload, action }, priority);

  const record: TaskRecord = {
    id:        agentTask.id,
    domain,
    action,
    priority,
    status:    'queued',
    createdAt: agentTask.createdAt.toISOString(),
  };
  taskStore.set(agentTask.id, record);

  return NextResponse.json(
    { data: { id: agentTask.id, domain, action, priority, status: 'queued', createdAt: record.createdAt } },
    { status: 202 },
  );
}
