import { NextRequest, NextResponse } from 'next/server';
import { RiskItem } from '@/types';
import { requireAuthRead } from '@/lib/api-guard';

const risks: RiskItem[] = [
  {
    id: 'risk-001',
    title: 'Unpatched critical CVEs in production',
    description: 'Several production servers have unpatched critical vulnerabilities.',
    category: 'Technical', likelihood: 4, impact: 5, riskScore: 20, level: 'critical',
    owner: 'IT Ops',
    mitigations: ['Emergency patching window scheduled', 'WAF rules updated as compensating control'],
    residualRisk: 8, status: 'open', identifiedAt: new Date('2024-03-10'),
  },
  {
    id: 'risk-002',
    title: 'Inadequate privileged access controls',
    description: 'Over-provisioned admin accounts with no periodic review.',
    category: 'Access Control', likelihood: 3, impact: 4, riskScore: 12, level: 'high',
    owner: 'IT Security',
    mitigations: ['PAM solution evaluation underway', 'Quarterly access reviews initiated'],
    residualRisk: 6, status: 'open', identifiedAt: new Date('2024-02-01'),
  },
  {
    id: 'risk-003',
    title: 'Third-party vendor security gaps',
    description: 'Key vendors have not completed security assessments.',
    category: 'Third Party', likelihood: 3, impact: 3, riskScore: 9, level: 'medium',
    owner: 'Procurement',
    mitigations: ['Vendor assessment questionnaires sent', 'Risk acceptance pending CISO approval'],
    residualRisk: 4, status: 'open', identifiedAt: new Date('2024-01-20'),
  },
  {
    id: 'risk-004',
    title: 'Insufficient backup and DR testing',
    description: 'Disaster recovery procedures have not been tested in 18 months.',
    category: 'Business Continuity', likelihood: 2, impact: 5, riskScore: 10, level: 'high',
    owner: 'IT Ops',
    mitigations: ['DR tabletop exercise scheduled for Q2'],
    residualRisk: 7, status: 'open', identifiedAt: new Date('2024-01-05'),
  },
  {
    id: 'risk-005',
    title: 'Inadequate employee security training',
    description: 'Less than 60% of staff have completed mandatory security awareness training.',
    category: 'Human Factor', likelihood: 4, impact: 3, riskScore: 12, level: 'high',
    owner: 'HR / Security',
    mitigations: ['Mandatory training campaign launched', 'Phishing simulation scheduled'],
    residualRisk: 5, status: 'open', identifiedAt: new Date('2024-02-10'),
  },
];

// Allowlists for filter params
const VALID_LEVELS    = ['critical', 'high', 'medium', 'low'];
const VALID_STATUSES  = ['open', 'mitigating', 'accepted', 'closed'];
const VALID_CATEGORIES = ['Technical', 'Access Control', 'Third Party', 'Business Continuity', 'Human Factor'];

export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const level    = searchParams.get('level');
  const status   = searchParams.get('status');
  const category = searchParams.get('category');
  const query    = searchParams.get('q')?.slice(0, 200).toLowerCase();

  let results = [...risks];
  if (level    && VALID_LEVELS.includes(level))       results = results.filter(r => r.level    === level);
  if (status   && VALID_STATUSES.includes(status))    results = results.filter(r => r.status   === status);
  if (category && VALID_CATEGORIES.includes(category)) results = results.filter(r => r.category === category);
  if (query)   results = results.filter(r =>
    r.title.toLowerCase().includes(query) ||
    r.description.toLowerCase().includes(query),
  );

  results.sort((a, b) => b.riskScore - a.riskScore);

  return NextResponse.json({
    data: results,
    meta: {
      total:        results.length,
      critical:     results.filter(r => r.level === 'critical').length,
      high:         results.filter(r => r.level === 'high').length,
      medium:       results.filter(r => r.level === 'medium').length,
      low:          results.filter(r => r.level === 'low').length,
      avgRiskScore: Math.round(results.reduce((s, r) => s + r.riskScore, 0) / (results.length || 1)),
    },
  });
}
