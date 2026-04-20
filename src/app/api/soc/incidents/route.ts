import { NextRequest, NextResponse } from 'next/server';
import { Incident } from '@/types';
import { requireAuthRead } from '@/lib/api-guard';

const incidents: Incident[] = [
  {
    id: 'inc-001',
    title: 'Ransomware activity on finance segment',
    description: 'Suspected ransomware detected on finance network segment.',
    severity: 'critical', status: 'in_progress',
    alerts: ['alert-002', 'alert-003'],
    affectedSystems: ['ws-finance-07', 'ws-finance-09'],
    timeline: [
      {
        id: 'ev-1', timestamp: new Date(Date.now() - 30 * 60_000),
        actor: 'SIEM', action: 'Detection',
        details: 'Anomalous process spawning detected',
      },
      {
        id: 'ev-2', timestamp: new Date(Date.now() - 25 * 60_000),
        actor: 'analyst@company.com', action: 'Triage',
        details: 'Alert escalated to incident',
      },
      {
        id: 'ev-3', timestamp: new Date(Date.now() - 10 * 60_000),
        actor: 'analyst@company.com', action: 'Containment',
        details: 'Isolated affected workstations from network',
      },
    ],
    assignedTeam: 'IR Team',
    createdAt: new Date(Date.now() - 30 * 60_000),
  },
  {
    id: 'inc-002',
    title: 'Credential compromise via phishing',
    description: 'Employee credentials compromised through targeted spear-phishing campaign.',
    severity: 'high', status: 'open',
    alerts: ['alert-001'],
    affectedSystems: ['auth-server-01', 'email-gateway'],
    timeline: [
      {
        id: 'ev-4', timestamp: new Date(Date.now() - 2 * 60 * 60_000),
        actor: 'Email Gateway', action: 'Detection',
        details: 'Suspicious email attachment opened by finance-user@company.com',
      },
    ],
    assignedTeam: 'SOC Team',
    createdAt: new Date(Date.now() - 2 * 60 * 60_000),
  },
];

export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const { searchParams } = req.nextUrl;

  // Allowlist filter values
  const VALID_STATUSES   = ['open', 'in_progress', 'resolved', 'closed'];
  const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'];

  const status   = searchParams.get('status');
  const severity = searchParams.get('severity');
  const query    = searchParams.get('q')?.slice(0, 200).toLowerCase();

  let results = [...incidents];
  if (status   && VALID_STATUSES.includes(status))     results = results.filter(i => i.status   === status);
  if (severity && VALID_SEVERITIES.includes(severity)) results = results.filter(i => i.severity === severity);
  if (query)    results = results.filter(i =>
    i.title.toLowerCase().includes(query) ||
    i.description.toLowerCase().includes(query),
  );

  return NextResponse.json({ data: results, meta: { total: results.length } });
}
