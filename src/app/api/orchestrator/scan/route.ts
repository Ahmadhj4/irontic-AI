import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRateLimit } from '@/lib/api-guard';
import { COSTLY_LIMITER } from '@/lib/rate-limit';

// Full scan — triggers all 4 domain agents in parallel (Tech Doc §8 runFullScan)
// Phase 2: dispatch to Kafka topics: soc.events, grc.events, av.events, pentest.events

export async function POST(req: NextRequest) {
  // High-cost operation: strict rate limit (5 per user per minute)
  const { error } = await requireAuthWithRateLimit(req, COSTLY_LIMITER);
  if (error) return error;

  const scanId  = `scan-${Date.now()}`;
  const started = new Date().toISOString();

  const domains = ['grc', 'soc', 'av', 'pentest'] as const;
  const tasks = domains.map(domain => ({
    id:       `${scanId}-${domain}`,
    domain,
    action:   domain === 'grc'     ? 'assess_controls'
             : domain === 'soc'    ? 'hunt_threats'
             : domain === 'av'     ? 'scan_endpoints'
             :                       'run_scan',
    status:   'queued',
    priority: 'high',
    createdAt: started,
  }));

  return NextResponse.json({
    data: {
      scanId,
      startedAt: started,
      tasks,
      message:   'Full system scan initiated across all 4 agent domains',
    },
  }, { status: 202 });
}
