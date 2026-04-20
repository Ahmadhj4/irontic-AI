import { NextRequest, NextResponse } from 'next/server';
import { requireAuthRead } from '@/lib/api-guard';

// MCP Context API — returns the current shared context across all agents
// Phase 2: reads from Redis MemoryStore

export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const context = {
    sessionId:    `mcp-session-${Date.now()}`,
    lastUpdated:  new Date().toISOString(),
    agentStates: {
      grc:     { status: 'idle',      lastActivity: new Date(Date.now() - 5  * 60_000).toISOString() },
      soc:     { status: 'executing', lastActivity: new Date(Date.now() - 30_000).toISOString()       },
      av:      { status: 'idle',      lastActivity: new Date(Date.now() - 10 * 60_000).toISOString() },
      pentest: { status: 'idle',      lastActivity: new Date(Date.now() - 30 * 60_000).toISOString() },
    },
    sharedFindings: [
      {
        id:          'find-001',
        domain:      'soc',
        title:       'Active C2 Communication Detected',
        description: 'ws-finance-07 communicating with known C2 IP 185.220.101.50',
        severity:    'critical',
        asset:       'ws-finance-07',
        detectedAt:  new Date(Date.now() - 5 * 60_000).toISOString(),
        recommendation: 'Isolate asset immediately and activate playbook-c2-malware',
      },
      {
        id:          'find-002',
        domain:      'grc',
        title:       'Control Gap: MFA Not Enforced',
        description: 'ISO 27001 A.9.1.1 partial — MFA missing on 3 critical systems',
        severity:    'high',
        asset:       'auth-server-01',
        detectedAt:  new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
        recommendation: 'Enforce MFA on auth-server-01, db-prod-01, admin-panel before next review',
      },
    ],
    crossAgentInsights: {
      criticalFindingsCount: 1,
      highFindingsCount:     1,
      activeAgents:          ['soc'],
      busyAgents:            ['soc'],
      totalFindings:         2,
      findingsByDomain:      { grc: 1, soc: 1, av: 0, pentest: 0 },
    },
  };

  return NextResponse.json({ data: context });
}
