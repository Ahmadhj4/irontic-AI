import { NextRequest, NextResponse } from 'next/server';
import { requireAuthRead } from '@/lib/api-guard';

// Integration health states (Phase 2: read from Redis circuit-breaker state — Tech Doc §12)
// Circuit breaker states: CLOSED (healthy), OPEN (failing), HALF_OPEN (recovering)
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface IntegrationHealth {
  name: string;
  type: string;
  circuitState: CircuitState;
  lastChecked: string;
  latencyMs: number;
  errorRate: number;
  healthy: boolean;
}

function buildIntegrationHealth(): IntegrationHealth[] {
  const now = new Date();
  return [
    {
      name: 'splunk',
      type: 'SIEM',
      circuitState: 'CLOSED',
      lastChecked: new Date(now.getTime() - 30_000).toISOString(),
      latencyMs: 42,
      errorRate: 0,
      healthy: true,
    },
    {
      name: 'crowdstrike',
      type: 'EDR',
      circuitState: 'CLOSED',
      lastChecked: new Date(now.getTime() - 15_000).toISOString(),
      latencyMs: 78,
      errorRate: 0,
      healthy: true,
    },
    {
      name: 'tenable',
      type: 'Vulnerability Scanner',
      circuitState: 'CLOSED',
      lastChecked: new Date(now.getTime() - 60_000).toISOString(),
      latencyMs: 120,
      errorRate: 0,
      healthy: true,
    },
    {
      name: 'servicenow',
      type: 'ITSM',
      circuitState: 'HALF_OPEN',
      lastChecked: new Date(now.getTime() - 120_000).toISOString(),
      latencyMs: 450,
      errorRate: 0.12,
      healthy: false,
    },
    {
      name: 'aws-securityhub',
      type: 'Cloud Security',
      circuitState: 'CLOSED',
      lastChecked: new Date(now.getTime() - 45_000).toISOString(),
      latencyMs: 95,
      errorRate: 0,
      healthy: true,
    },
  ];
}

// GET /api/v1/integrations/health — circuit breaker state for all integrations (Tech Doc §22.2)
export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const integrations = buildIntegrationHealth();
  const healthyCount = integrations.filter(i => i.healthy).length;

  return NextResponse.json({
    data: {
      integrations,
      summary: {
        total: integrations.length,
        healthy: healthyCount,
        degraded: integrations.length - healthyCount,
      },
      timestamp: new Date().toISOString(),
    },
  });
}
