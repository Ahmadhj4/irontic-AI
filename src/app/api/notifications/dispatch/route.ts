import { NextRequest, NextResponse } from 'next/server';
import { requireAuthRead, requireAuthWithRateLimit } from '@/lib/api-guard';
import { WRITE_LIMITER } from '@/lib/rate-limit';

type NotificationChannel  = 'email' | 'slack' | 'in_app';
type NotificationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

const VALID_CHANNELS:   NotificationChannel[]  = ['email', 'slack', 'in_app'];
const VALID_SEVERITIES: NotificationSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
const VALID_ENTITY_TYPES = ['alert', 'incident', 'control', 'risk', 'finding'];
// Basic email format check — not a full RFC 5321 validator, but sufficient for a portal
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory notification log (Phase 2: SES + Slack Webhooks)
// Slack/SES credentials come from env vars at Phase 2 — never hard-coded
const notificationLog: Array<{
  id: string; sentAt: string; status: 'sent' | 'failed';
  channel: string[]; severity: string; title: string;
}> = [];

function validateDispatch(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object';
  const b = body as Record<string, unknown>;

  const ALLOWED = new Set(['channel','severity','title','message','domain','entityId','entityType','recipients']);
  for (const key of Object.keys(b)) {
    if (!ALLOWED.has(key)) return `Unexpected field: ${key}`;
  }

  // channel — single value or array
  const rawChannels = Array.isArray(b.channel) ? b.channel : [b.channel ?? 'in_app'];
  if (rawChannels.length > 3) return 'channel array must contain ≤ 3 entries';
  if (rawChannels.some((c: unknown) => !VALID_CHANNELS.includes(c as NotificationChannel)))
    return `channel must be one of: ${VALID_CHANNELS.join(', ')}`;

  if (!VALID_SEVERITIES.includes(b.severity as NotificationSeverity))
    return `severity must be one of: ${VALID_SEVERITIES.join(', ')}`;
  if (typeof b.title !== 'string' || b.title.length === 0 || b.title.length > 200)
    return 'title must be a non-empty string ≤ 200 chars';
  if (typeof b.message !== 'string' || b.message.length === 0 || b.message.length > 2000)
    return 'message must be a non-empty string ≤ 2000 chars';
  if (b.domain !== undefined && (typeof b.domain !== 'string' || b.domain.length > 50))
    return 'domain must be a string ≤ 50 chars';
  if (b.entityId !== undefined && (typeof b.entityId !== 'string' || b.entityId.length > 100))
    return 'entityId must be a string ≤ 100 chars';
  if (b.entityType !== undefined && !VALID_ENTITY_TYPES.includes(b.entityType as string))
    return `entityType must be one of: ${VALID_ENTITY_TYPES.join(', ')}`;
  if (b.recipients !== undefined) {
    if (!Array.isArray(b.recipients) || b.recipients.length > 20)
      return 'recipients must be an array of ≤ 20 email addresses';
    if (b.recipients.some((r: unknown) => typeof r !== 'string' || !EMAIL_RE.test(r) || r.length > 254))
      return 'each recipient must be a valid email address ≤ 254 chars';
  }
  return null;
}

// ── POST /api/notifications/dispatch ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const { error } = await requireAuthWithRateLimit(req, WRITE_LIMITER);
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const validationError = validateDispatch(raw);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const b       = raw as Record<string, unknown>;
  const channels: NotificationChannel[] = (Array.isArray(b.channel) ? b.channel : [b.channel ?? 'in_app']) as NotificationChannel[];
  const notifId = `notif-${Date.now()}`;
  const sentAt  = new Date().toISOString();

  // Phase 2 hooks:
  // - email:  AWS SES (SMTP_FROM, SES_REGION from env — never hard-coded)
  // - slack:  POST to process.env.SLACK_WEBHOOK_URL
  // - in_app: push to SSE stream
  const results = channels.map(ch => {
    if (ch === 'email') return { channel: ch, status: 'sent', note: 'Email dispatch queued (Phase 2: SES)' };
    if (ch === 'slack') return { channel: ch, status: 'sent', note: 'Slack dispatch queued (Phase 2: Webhook)' };
    return               { channel: ch, status: 'sent', note: 'In-app notification dispatched' };
  });

  notificationLog.push({ id: notifId, sentAt, status: 'sent', channel: channels, severity: b.severity as string, title: b.title as string });

  return NextResponse.json({
    data: { id: notifId, sentAt, channels: results, severity: b.severity, title: b.title },
  }, { status: 202 });
}

// ── GET /api/notifications/dispatch ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  return NextResponse.json({
    data: notificationLog.slice(-50),
    meta: { total: notificationLog.length },
  });
}
