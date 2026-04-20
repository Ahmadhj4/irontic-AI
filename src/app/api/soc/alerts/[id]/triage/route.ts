import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRateLimit } from '@/lib/api-guard';
import { WRITE_LIMITER } from '@/lib/rate-limit';

const MITRE_SCORES: Record<string, number> = {
  T1110: 7, T1071: 9, T1068: 9, T1041: 8, T1190: 6, T1566: 7, T1486: 10,
};
const PLAYBOOKS: Record<string, string> = {
  T1110: 'playbook-brute-force',  T1071: 'playbook-c2-malware',
  T1068: 'playbook-privilege-escalation', T1041: 'playbook-data-exfiltration',
  T1190: 'playbook-exploit-web',  T1566: 'playbook-phishing',
  T1486: 'playbook-ransomware',
};

// Alert IDs are alphanumeric + hyphens — prevent path traversal via dynamic segment
const ALERT_ID_RE  = /^[a-zA-Z0-9_-]{1,64}$/;
// MITRE ATT&CK technique ID
const MITRE_RE     = /^T\d{4}(\.\d{3})?$/;
// Asset names: alphanumeric, hyphens, dots only
const ASSET_RE     = /^[a-zA-Z0-9._-]{1,100}$/;
const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAuthWithRateLimit(req, WRITE_LIMITER);
  if (error) return error;

  // Validate path parameter before using it
  const { id: rawId } = await params;
  if (!ALERT_ID_RE.test(rawId)) {
    return NextResponse.json({ error: 'Invalid alert ID format' }, { status: 400 });
  }
  const alertId = rawId;

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const severity: string = VALID_SEVERITIES.includes(body.severity as typeof VALID_SEVERITIES[number])
    ? (body.severity as string)
    : 'medium';

  const mitreTechnique: string | undefined =
    typeof body.mitreTechnique === 'string' && MITRE_RE.test(body.mitreTechnique)
      ? body.mitreTechnique
      : undefined;

  // Validate and sanitise asset names before including in recommendation string
  const rawAssets = Array.isArray(body.affectedAssets) ? body.affectedAssets : [];
  const affectedAssets: string[] = rawAssets
    .filter((a: unknown): a is string => typeof a === 'string' && ASSET_RE.test(a))
    .slice(0, 50);

  const severityScore: Record<string, number> = {
    critical: 10, high: 8, medium: 5, low: 2, info: 1,
  };
  const baseScore  = severityScore[severity] ?? 5;
  const mitreBonus = mitreTechnique ? (MITRE_SCORES[mitreTechnique] ?? 5) : 0;
  const riskScore  = Math.min(10, Math.round((baseScore + mitreBonus) / 2));
  const autoContain = riskScore >= 8;
  const playbook = mitreTechnique ? PLAYBOOKS[mitreTechnique] : undefined;

  const recommendation = autoContain
    ? `CRITICAL: Auto-containment triggered. Immediately isolate: ${affectedAssets.join(', ')}. Activate ${playbook ?? 'incident-response'}.`
    : `MONITOR: Risk score ${riskScore}/10. Assign for investigation within 2 hours. Consider ${playbook ?? 'standard-triage'}.`;

  return NextResponse.json({
    data: {
      alertId, riskScore, autoContain, recommendation, playbook, mitreTechnique,
      triageTimestamp: new Date().toISOString(),
      actions: autoContain
        ? ['isolate_asset', 'preserve_logs', 'notify_ir_team', 'activate_playbook']
        : ['assign_analyst', 'monitor_asset', 'collect_evidence'],
    },
  });
}
