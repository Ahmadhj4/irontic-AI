import { NextRequest, NextResponse } from 'next/server';
import { AgentDomain, TaskPriority } from '@/types';
import { requireAuthWithRateLimit } from '@/lib/api-guard';
import { WRITE_LIMITER } from '@/lib/rate-limit';

// 7-state agent lifecycle (Tech Doc §8)
const VALID_DOMAINS:    AgentDomain[]  = ['grc', 'soc', 'av', 'pentest'];
const VALID_PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

// OWASP A03:2021 — Injection: action is allowlisted to prevent passing
// arbitrary command strings to future execution layers.
const VALID_ACTIONS: Record<string, string[]> = {
  grc:     ['assess_controls', 'generate_report', 'review_risks'],
  soc:     ['hunt_threats', 'triage_alert', 'run_playbook'],
  av:      ['scan_endpoints', 'quarantine_file', 'update_signatures'],
  pentest: ['run_scan', 'enumerate_assets', 'test_controls'],
};

// In-memory task store (Phase 2: replace with TimescaleDB + Redis)
const taskStore: Map<string, {
  id: string; domain: AgentDomain; action: string; priority: TaskPriority;
  status: 'queued' | 'assigned' | 'executing' | 'reporting' | 'completed' | 'failed' | 'cancelled';
  createdAt: string; startedAt?: string; completedAt?: string; result?: unknown;
}> = new Map();

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
  if (!/^[a-z_]+$/.test(b.action as string))
    return 'action must contain only lowercase letters and underscores';
  if (!VALID_ACTIONS[b.domain as string]?.includes(b.action as string))
    return `Invalid action for domain '${b.domain}'. Valid: ${VALID_ACTIONS[b.domain as string]?.join(', ')}`;
  if (b.priority !== undefined && !VALID_PRIORITIES.includes(b.priority as TaskPriority))
    return `priority must be one of: ${VALID_PRIORITIES.join(', ')}`;
  if (b.payload !== undefined && (typeof b.payload !== 'object' || Array.isArray(b.payload)))
    return 'payload must be a plain object';
  return null;
}

// ── POST /api/orchestrator/submit ─────────────────────────────────────────
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
  const taskId   = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const task = { id: taskId, domain, action, priority, status: 'queued' as const, createdAt: new Date().toISOString() };
  taskStore.set(taskId, task);

  // Simulate async execution (Phase 2: dispatch to Orchestration Engine via Kafka)
  setTimeout(() => {
    const t = taskStore.get(taskId);
    if (!t) return;
    taskStore.set(taskId, { ...t, status: 'executing', startedAt: new Date().toISOString() });
    setTimeout(() => {
      const t2 = taskStore.get(taskId);
      if (!t2) return;
      taskStore.set(taskId, { ...t2, status: 'completed', completedAt: new Date().toISOString(), result: { success: true, message: `${domain}:${action} executed successfully` } });
    }, 2000 + Math.random() * 3000);
  }, 500);

  // Return task without payload — do not echo submitted data back
  return NextResponse.json({ data: task }, { status: 202 });
}

export { taskStore };
