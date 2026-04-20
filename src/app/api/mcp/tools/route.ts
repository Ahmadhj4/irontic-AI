import { NextRequest, NextResponse } from 'next/server';
import { requireAuthRead, requireAuthWithRateLimit } from '@/lib/api-guard';
import { WRITE_LIMITER } from '@/lib/rate-limit';

const MCP_TOOLS = [
  { name: 'query_alerts',         description: 'Query active security alerts with optional filters',              domain: 'soc',          endpoint: '/api/soc/alerts',             method: 'GET',  parameters: { severity: 'string?', status: 'string?', q: 'string?' } },
  { name: 'run_scan',             description: 'Trigger a full security scan across all agent domains',            domain: 'orchestrator', endpoint: '/api/orchestrator/scan',       method: 'POST', parameters: {} },
  { name: 'get_compliance_status',description: 'Retrieve compliance control status for one or all frameworks',    domain: 'grc',          endpoint: '/api/grc/controls',           method: 'GET',  parameters: { framework: 'string?' } },
  { name: 'create_ticket',        description: 'Create a remediation or incident ticket',                         domain: 'orchestrator', endpoint: '/api/orchestrator/submit',     method: 'POST', parameters: { domain: 'string', action: 'string', payload: 'object?', priority: 'string?' } },
  { name: 'fetch_threat_intel',   description: 'Retrieve current threat intelligence indicators (IOCs)',          domain: 'soc',          endpoint: '/api/soc/dashboard',          method: 'GET',  parameters: {} },
  { name: 'trigger_playbook',     description: 'Activate a named response playbook for a given alert',           domain: 'soc',          endpoint: '/api/soc/alerts/:id/triage',  method: 'POST', parameters: { alertId: 'string', severity: 'string', mitreTechnique: 'string?', affectedAssets: 'string[]?' } },
] as const;

const VALID_TOOL_NAMES = new Set<string>(MCP_TOOLS.map(t => t.name));

// ── GET /api/mcp/tools ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  return NextResponse.json({ data: MCP_TOOLS, count: MCP_TOOLS.length });
}

// ── POST /api/mcp/tools ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { error } = await requireAuthWithRateLimit(req, WRITE_LIMITER);
  if (error) return error;

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
  }

  const b = raw as Record<string, unknown>;
  if (typeof b.tool !== 'string' || !VALID_TOOL_NAMES.has(b.tool)) {
    return NextResponse.json(
      { error: `tool must be one of: ${[...VALID_TOOL_NAMES].join(', ')}` },
      { status: 400 },
    );
  }
  if (b.params !== undefined && (typeof b.params !== 'object' || Array.isArray(b.params))) {
    return NextResponse.json({ error: 'params must be a plain object' }, { status: 400 });
  }

  type ToolName = typeof MCP_TOOLS[number]['name'];
  const tool    = MCP_TOOLS.find(t => t.name === (b.tool as ToolName))!;
  const params  = (b.params ?? {}) as Record<string, unknown>;
  const alertId = typeof params.alertId === 'string' ? params.alertId : '';
  const baseUrl = req.nextUrl.origin;
  const url     = `${baseUrl}${tool.endpoint.replace(':id', alertId)}`;

  // Forward session cookie so upstream auth checks pass
  const upstream = await fetch(url, {
    method:  tool.method,
    headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
    ...(tool.method === 'POST' ? { body: JSON.stringify(params) } : {}),
  });

  const result = await upstream.json();
  return NextResponse.json({ tool: b.tool, status: upstream.status, data: result });
}
