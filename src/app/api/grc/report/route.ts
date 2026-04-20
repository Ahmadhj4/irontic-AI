import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRateLimit } from '@/lib/api-guard';
import { COSTLY_LIMITER } from '@/lib/rate-limit';

const VALID_FRAMEWORKS = ['ISO 27001', 'NIST CSF', 'SOC 2', 'all'] as const;
const VALID_FORMATS    = ['json', 'pdf'] as const;

// ── POST /api/grc/report ──────────────────────────────────────────────────
// Report generation is costly — limited to 5 per user per minute
export async function POST(req: NextRequest) {
  const { error } = await requireAuthWithRateLimit(req, COSTLY_LIMITER);
  if (error) return error;

  const raw = await req.json().catch(() => ({})) as Record<string, unknown>;

  const framework = VALID_FRAMEWORKS.includes(raw.framework as typeof VALID_FRAMEWORKS[number])
    ? (raw.framework as string)
    : 'all';
  const format = VALID_FORMATS.includes(raw.format as typeof VALID_FORMATS[number])
    ? (raw.format as string)
    : 'json';

  // Phase 2: integrate with real PDF generator and ServiceNow
  const report = {
    id:          `rpt-${Date.now()}`,
    title:       `GRC Compliance Report — ${framework === 'all' ? 'All Frameworks' : framework}`,
    framework, format,
    generatedAt: new Date().toISOString(),
    overallScore: 74,
    frameworkScores: { 'ISO 27001': 72, 'NIST CSF': 64, 'SOC 2': 88 },
    summary: { totalControls: 8, compliant: 4, partial: 3, nonCompliant: 1, criticalRisks: 1, openFindings: 4 },
    recommendations: [
      'Enforce MFA across all systems (A.9.1.1)',
      'Complete asset inventory and update CMDB (ID.AM-1)',
      'Apply encryption to all backup volumes (PR.DS-1)',
      'Patch critical CVEs within 72-hour SLA (A.12.6.1)',
      'Schedule and conduct DR tabletop exercise',
    ],
    // Phase 2: replace with a signed S3/GCS pre-signed URL (time-limited, opaque token)
    downloadUrl: null,
  };

  return NextResponse.json({ data: report }, { status: 201 });
}
