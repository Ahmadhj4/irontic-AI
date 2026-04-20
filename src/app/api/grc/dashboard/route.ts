import { NextRequest, NextResponse } from 'next/server';
import { requireAuthRead } from '@/lib/api-guard';

function generateTrend(start: number, end: number, points: number) {
  return Array.from({ length: points }, (_, i) => ({
    date: new Date(Date.now() - (points - i) * 7 * 24 * 60 * 60_000)
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Math.round(
      start + ((end - start) / points) * i + (Math.random() - 0.5) * 5,
    ),
  }));
}

export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const data = {
    overallComplianceScore: 74,
    frameworkScores: {
      'ISO 27001': 72,
      'NIST CSF':  64,
      'SOC 2':     88,
    },
    openFindings:          4,
    criticalRisks:         1,
    highRisks:             3,
    controlsTotal:         8,
    controlsCompliant:     4,
    controlsPartial:       3,
    controlsNonCompliant:  1,
    upcomingReviews: [
      { controlId: 'ID.AM-1',  framework: 'NIST CSF',  title: 'Physical devices and systems inventoried', dueDate: new Date(Date.now() + 8  * 24 * 60 * 60_000).toISOString() },
      { controlId: 'PR.DS-1',  framework: 'NIST CSF',  title: 'Data-at-rest is protected',                dueDate: new Date(Date.now() + 33 * 24 * 60 * 60_000).toISOString() },
      { controlId: 'A.12.6.1', framework: 'ISO 27001', title: 'Management of technical vulnerabilities',  dueDate: new Date(Date.now() + 54 * 24 * 60 * 60_000).toISOString() },
    ],
    trendData:   generateTrend(60, 74, 10),
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ data });
}
