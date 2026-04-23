import { NextRequest, NextResponse } from 'next/server';
import { requireAuthRead, requireAuthWithRateLimit } from '@/lib/api-guard';
import { WRITE_LIMITER } from '@/lib/rate-limit';

// Dual-approval store (Phase 2: persist to PostgreSQL — Tech Doc §9.1)
export type ApprovalStatus = 'pending_first' | 'pending_second' | 'approved' | 'rejected';

export interface ApprovalRecord {
  id: string;
  action: string;
  domain: string;
  requestedBy: string;
  requestedAt: string;
  justification: string;
  status: ApprovalStatus;
  firstApprovedBy?: string;
  firstApprovedAt?: string;
  secondApprovedBy?: string;
  secondApprovedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
}

// Seed two pending approvals matching the UI mock data (DualApprovalModal — §9.1)
const approvalStore = new Map<string, ApprovalRecord>([
  ['appr-001', {
    id: 'appr-001',
    action: 'quarantine_file',
    domain: 'av',
    requestedBy: 'av-agent',
    requestedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    justification: 'Suspected ransomware signature detected on endpoint WKSTN-042',
    status: 'pending_first',
  }],
  ['appr-002', {
    id: 'appr-002',
    action: 'run_scan',
    domain: 'pentest',
    requestedBy: 'pentest-agent',
    requestedAt: new Date(Date.now() - 25 * 60_000).toISOString(),
    justification: 'Scheduled OWASP Top 10 assessment on staging environment',
    status: 'pending_second',
    firstApprovedBy: 'operator@irontic.ai',
    firstApprovedAt: new Date(Date.now() - 20 * 60_000).toISOString(),
  }],
]);

const VALID_DECISIONS = new Set(['approve', 'reject']);
const APPROVAL_ID_RE = /^appr-[a-z0-9]{3,32}$/;

// GET /api/v1/approvals — list pending approvals (Tech Doc §22.2 GET /v1/approvals)
export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');

  const VALID_STATUSES = new Set<ApprovalStatus>(['pending_first', 'pending_second', 'approved', 'rejected']);
  if (status && !VALID_STATUSES.has(status as ApprovalStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${[...VALID_STATUSES].join(', ')}` },
      { status: 400 },
    );
  }

  let approvals = Array.from(approvalStore.values());
  if (status) approvals = approvals.filter(a => a.status === status);

  return NextResponse.json({ data: approvals });
}

// POST /api/v1/approvals/:id/decide — approve or reject (Tech Doc §22.2 POST /v1/approvals)
// Body: { id: string, decision: 'approve' | 'reject', justification: string }
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuthWithRateLimit(req, WRITE_LIMITER);
  if (error) return error;

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
  }

  const b = raw as Record<string, unknown>;

  const ALLOWED = new Set(['id', 'decision', 'justification']);
  for (const key of Object.keys(b)) {
    if (!ALLOWED.has(key)) return NextResponse.json({ error: `Unexpected field: ${key}` }, { status: 400 });
  }

  if (typeof b.id !== 'string' || !APPROVAL_ID_RE.test(b.id)) {
    return NextResponse.json({ error: 'id must be a valid approval ID' }, { status: 400 });
  }
  if (typeof b.decision !== 'string' || !VALID_DECISIONS.has(b.decision)) {
    return NextResponse.json({ error: "decision must be 'approve' or 'reject'" }, { status: 400 });
  }
  if (typeof b.justification !== 'string' || b.justification.trim().length === 0 || b.justification.length > 500) {
    return NextResponse.json({ error: 'justification must be a non-empty string ≤ 500 chars' }, { status: 400 });
  }

  const record = approvalStore.get(b.id);
  if (!record) {
    return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
  }
  if (record.status === 'approved' || record.status === 'rejected') {
    return NextResponse.json({ error: 'Approval already finalized' }, { status: 409 });
  }

  const actor = session?.user?.email ?? 'unknown';
  const now = new Date().toISOString();

  if (b.decision === 'reject') {
    approvalStore.set(b.id, { ...record, status: 'rejected', rejectedBy: actor, rejectedAt: now });
  } else if (record.status === 'pending_first') {
    approvalStore.set(b.id, {
      ...record,
      status: 'pending_second',
      firstApprovedBy: actor,
      firstApprovedAt: now,
    });
  } else {
    // pending_second — second approver completes the flow
    approvalStore.set(b.id, {
      ...record,
      status: 'approved',
      secondApprovedBy: actor,
      secondApprovedAt: now,
    });
  }

  return NextResponse.json({ data: approvalStore.get(b.id) });
}
