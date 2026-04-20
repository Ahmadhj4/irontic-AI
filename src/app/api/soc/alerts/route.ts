import { NextRequest, NextResponse } from 'next/server';
import { SOCAlert } from '@/types';
import { requireAuthRead, requireAuthWithRateLimit } from '@/lib/api-guard';
import { WRITE_LIMITER } from '@/lib/rate-limit';

// ── In-memory store (replace with TimescaleDB query in Phase 2) ──────────
let alerts: SOCAlert[] = [
  {
    id: 'alert-001',
    title: 'Brute force login attempt detected',
    description: 'Multiple failed login attempts from 192.168.1.45 against admin accounts.',
    severity: 'high', status: 'investigating',
    source: 'SIEM', sourceIp: '192.168.1.45', affectedAssets: ['auth-server-01'],
    mitreTechnique: 'T1110', detectedAt: new Date(Date.now() - 15 * 60_000),
    updatedAt: new Date(), assignedTo: 'analyst@company.com', tags: ['brute-force', 'auth'], confidence: 91,
  },
  {
    id: 'alert-002',
    title: 'Suspicious outbound connection',
    description: 'Workstation communicating with known C2 server IP.',
    severity: 'critical', status: 'new',
    source: 'EDR', sourceIp: '10.0.0.23', destinationIp: '185.220.101.50',
    affectedAssets: ['ws-finance-07'],
    mitreTechnique: 'T1071', detectedAt: new Date(Date.now() - 5 * 60_000),
    updatedAt: new Date(), tags: ['c2', 'malware'], confidence: 97,
  },
  {
    id: 'alert-003',
    title: 'Privilege escalation attempt',
    description: 'Process attempted to gain SYSTEM privileges via known exploit.',
    severity: 'critical', status: 'new',
    source: 'EDR', affectedAssets: ['ws-dev-03'],
    mitreTechnique: 'T1068', detectedAt: new Date(Date.now() - 2 * 60_000),
    updatedAt: new Date(), tags: ['privilege-escalation'], confidence: 88,
  },
  {
    id: 'alert-004',
    title: 'Anomalous data exfiltration',
    description: 'Unusual volume of data transferred to external destination.',
    severity: 'high', status: 'investigating',
    source: 'DLP', affectedAssets: ['file-server-02'],
    mitreTechnique: 'T1041', detectedAt: new Date(Date.now() - 45 * 60_000),
    updatedAt: new Date(), assignedTo: 'analyst2@company.com', tags: ['exfiltration', 'dlp'], confidence: 74,
  },
  {
    id: 'alert-005',
    title: 'Unpatched vulnerability exploited',
    description: 'CVE-2024-1234 exploit attempt detected on web server.',
    severity: 'medium', status: 'contained',
    source: 'WAF', sourceIp: '203.0.113.0', affectedAssets: ['web-prod-01'],
    mitreTechnique: 'T1190', detectedAt: new Date(Date.now() - 3 * 60 * 60_000),
    updatedAt: new Date(), tags: ['exploit', 'web'], confidence: 62,
  },
];

// ── Validation helpers ────────────────────────────────────────────────────
// OWASP A03:2021 — Injection / A08:2021 — Software and Data Integrity Failures

const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const;
const VALID_STATUSES   = ['new', 'investigating', 'contained', 'resolved'] as const;

// IPv4 or abbreviated IPv6 — rejects arbitrary strings in IP fields
const IP_RE    = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]{2,39}$/;
// MITRE ATT&CK technique ID format e.g. T1110 or T1110.001
const MITRE_RE = /^T\d{4}(\.\d{3})?$/;

function validateCreateAlert(body: unknown): { error: string } | { data: Partial<SOCAlert> } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;

  // Reject unexpected fields (OWASP mass-assignment protection)
  const ALLOWED = new Set(['title','description','severity','status','source','sourceIp','destinationIp','affectedAssets','mitreTechnique','tags']);
  for (const key of Object.keys(b)) {
    if (!ALLOWED.has(key)) return { error: `Unexpected field: ${key}` };
  }

  if (typeof b.title !== 'string' || b.title.length === 0 || b.title.length > 200)
    return { error: 'title must be a non-empty string ≤ 200 chars' };
  if (!VALID_SEVERITIES.includes(b.severity as typeof VALID_SEVERITIES[number]))
    return { error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}` };
  if (typeof b.source !== 'string' || b.source.length === 0 || b.source.length > 100)
    return { error: 'source must be a non-empty string ≤ 100 chars' };
  if (b.description !== undefined && (typeof b.description !== 'string' || b.description.length > 2000))
    return { error: 'description must be a string ≤ 2000 chars' };
  if (b.status !== undefined && !VALID_STATUSES.includes(b.status as typeof VALID_STATUSES[number]))
    return { error: `status must be one of: ${VALID_STATUSES.join(', ')}` };
  if (b.sourceIp !== undefined && (typeof b.sourceIp !== 'string' || !IP_RE.test(b.sourceIp)))
    return { error: 'sourceIp must be a valid IP address' };
  if (b.destinationIp !== undefined && (typeof b.destinationIp !== 'string' || !IP_RE.test(b.destinationIp)))
    return { error: 'destinationIp must be a valid IP address' };
  if (b.mitreTechnique !== undefined && (typeof b.mitreTechnique !== 'string' || !MITRE_RE.test(b.mitreTechnique)))
    return { error: 'mitreTechnique must match MITRE format e.g. T1110 or T1110.001' };
  if (b.affectedAssets !== undefined) {
    if (!Array.isArray(b.affectedAssets) || b.affectedAssets.length > 50)
      return { error: 'affectedAssets must be an array of ≤ 50 items' };
    if (b.affectedAssets.some((a: unknown) => typeof a !== 'string' || a.length > 100))
      return { error: 'each affectedAsset must be a string ≤ 100 chars' };
  }
  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags) || b.tags.length > 20)
      return { error: 'tags must be an array of ≤ 20 items' };
    if (b.tags.some((t: unknown) => typeof t !== 'string' || t.length > 50))
      return { error: 'each tag must be a string ≤ 50 chars' };
  }

  return { data: b as Partial<SOCAlert> };
}

// ── GET /api/soc/alerts ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const severity = searchParams.get('severity');
  const status   = searchParams.get('status');
  const query    = searchParams.get('q')?.slice(0, 200).toLowerCase();
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

  let results = [...alerts];
  if (severity && VALID_SEVERITIES.includes(severity as typeof VALID_SEVERITIES[number]))
    results = results.filter(a => a.severity === severity);
  if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number]))
    results = results.filter(a => a.status === status);
  if (query) {
    results = results.filter(a =>
      a.title.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query) ||
      a.tags?.some(t => t.toLowerCase().includes(query)) ||
      a.mitreTechnique?.toLowerCase().includes(query) ||
      a.sourceIp?.toLowerCase().includes(query),
    );
  }

  const total = results.length;
  const data  = results.slice((page - 1) * limit, page * limit);
  return NextResponse.json({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}

// ── POST /api/soc/alerts ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { error } = await requireAuthWithRateLimit(req, WRITE_LIMITER);
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const result = validateCreateAlert(raw);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const body = result.data;
  const alert: SOCAlert = {
    id:             `alert-${Date.now()}`,
    title:          body.title!,
    description:    body.description ?? '',
    severity:       body.severity!,
    status:         body.status ?? 'new',
    source:         body.source!,
    sourceIp:       body.sourceIp,
    destinationIp:  body.destinationIp,
    affectedAssets: body.affectedAssets ?? [],
    mitreTechnique: body.mitreTechnique,
    detectedAt:     new Date(),
    updatedAt:      new Date(),
    tags:           body.tags ?? [],
  };

  alerts = [alert, ...alerts];
  return NextResponse.json({ data: alert }, { status: 201 });
}
