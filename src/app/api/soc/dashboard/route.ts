import { NextRequest, NextResponse } from 'next/server';
import { requireAuthRead } from '@/lib/api-guard';

function generateHourlyTrend(hours: number) {
  return Array.from({ length: hours }, (_, i) => ({
    hour:  `${String(i).padStart(2, '0')}:00`,
    count: Math.floor(Math.random() * 15) + 1,
  }));
}

export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const now = Date.now();

  const data = {
    alertsLast24h:    47,
    criticalAlerts:   3,
    mttr:             142,
    openIncidents:    2,
    activeAlerts:     4,
    threatIndicators: 3,
    severityBreakdown: { critical: 3, high: 12, medium: 18, low: 9, info: 5 },
    alertTrend: generateHourlyTrend(24),
    topMitreTechniques: [
      { technique: 'T1110', name: 'Brute Force',                    count: 12 },
      { technique: 'T1071', name: 'Application Layer Protocol',     count: 8  },
      { technique: 'T1068', name: 'Exploitation for Privilege Esc', count: 5  },
      { technique: 'T1041', name: 'Exfiltration Over C2 Channel',   count: 4  },
      { technique: 'T1190', name: 'Exploit Public-Facing App',      count: 3  },
    ],
    recentActivity: [
      { time: new Date(now - 2  * 60_000).toISOString(), event: 'Critical alert: privilege escalation on ws-dev-03' },
      { time: new Date(now - 5  * 60_000).toISOString(), event: 'Alert triaged: C2 connection from ws-finance-07' },
      { time: new Date(now - 15 * 60_000).toISOString(), event: 'Incident inc-001 updated: containment in progress' },
      { time: new Date(now - 30 * 60_000).toISOString(), event: 'New incident opened: ransomware on finance segment' },
    ],
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ data });
}
