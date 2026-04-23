import { NextRequest, NextResponse } from 'next/server';
import { requireAuthRead } from '@/lib/api-guard';
import { agentRouter } from '@/orchestrator';

// Composite risk score formula (Tech Doc §18.3):
//   CRS = 0.30 × SOC_score + 0.25 × GRC_score + 0.25 × AV_score + 0.20 × PT_score
// Each domain score = 100 - (weighted finding severity sum / max) × 100
const WEIGHTS = { soc: 0.30, grc: 0.25, av: 0.25, pentest: 0.20 } as const;

const SEVERITY_PENALTY = { critical: 40, high: 20, medium: 10, low: 5, info: 1 } as const;

function domainScore(findingsBySeverity: Record<string, number>): number {
  let penalty = 0;
  for (const [sev, count] of Object.entries(findingsBySeverity)) {
    penalty += (SEVERITY_PENALTY[sev as keyof typeof SEVERITY_PENALTY] ?? 0) * count;
  }
  // Cap penalty at 100, score = 100 - penalty
  return Math.max(0, 100 - Math.min(penalty, 100));
}

// GET /api/v1/risk/score — composite risk score across all domains (Tech Doc §22.2, §18.3)
export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const states = agentRouter.getAllStates();

  const domainScores = {
    soc:     domainScore(states.soc?.metrics?.findingsBySeverity     ?? {}),
    grc:     domainScore(states.grc?.metrics?.findingsBySeverity     ?? {}),
    av:      domainScore(states.av?.metrics?.findingsBySeverity      ?? {}),
    pentest: domainScore(states.pentest?.metrics?.findingsBySeverity ?? {}),
  };

  const crs = Math.round(
    domainScores.soc     * WEIGHTS.soc     +
    domainScores.grc     * WEIGHTS.grc     +
    domainScores.av      * WEIGHTS.av      +
    domainScores.pentest * WEIGHTS.pentest
  );

  const riskLevel =
    crs >= 80 ? 'low' :
    crs >= 60 ? 'medium' :
    crs >= 40 ? 'high' : 'critical';

  return NextResponse.json({
    data: {
      compositeRiskScore: crs,
      riskLevel,
      breakdown: {
        soc:     { score: domainScores.soc,     weight: WEIGHTS.soc     },
        grc:     { score: domainScores.grc,     weight: WEIGHTS.grc     },
        av:      { score: domainScores.av,      weight: WEIGHTS.av      },
        pentest: { score: domainScores.pentest, weight: WEIGHTS.pentest },
      },
      timestamp: new Date().toISOString(),
    },
  });
}
