import { NextRequest, NextResponse } from 'next/server';
import { ComplianceControl } from '@/types';
import { requireAuthRead } from '@/lib/api-guard';

const controls: ComplianceControl[] = [
  {
    id: 'ctrl-001', framework: 'ISO 27001', controlId: 'A.5.1.1',
    title: 'Policies for information security',
    description: 'A set of policies for information security shall be defined.',
    status: 'compliant', owner: 'CISO Office',
    lastAssessed: new Date('2024-01-15'), nextReview: new Date('2024-07-15'),
  },
  {
    id: 'ctrl-002', framework: 'ISO 27001', controlId: 'A.9.1.1',
    title: 'Access control policy',
    description: 'An access control policy shall be established and reviewed.',
    status: 'partial', owner: 'IT Security',
    lastAssessed: new Date('2024-02-01'), nextReview: new Date('2024-08-01'),
    gaps: ['MFA not enforced on all systems'],
  },
  {
    id: 'ctrl-003', framework: 'NIST CSF', controlId: 'ID.AM-1',
    title: 'Physical devices and systems inventoried',
    description: 'Physical devices and systems within the organization are inventoried.',
    status: 'non_compliant', owner: 'IT Ops',
    lastAssessed: new Date('2024-01-20'), nextReview: new Date('2024-04-20'),
    gaps: ['Asset inventory incomplete', 'CMDB not up-to-date'],
  },
  {
    id: 'ctrl-004', framework: 'SOC 2', controlId: 'CC6.1',
    title: 'Logical and physical access controls',
    description: 'Logical access security software, infrastructure, and architectures.',
    status: 'compliant', owner: 'IT Security',
    lastAssessed: new Date('2024-03-01'), nextReview: new Date('2024-09-01'),
  },
  {
    id: 'ctrl-005', framework: 'NIST CSF', controlId: 'PR.DS-1',
    title: 'Data-at-rest is protected',
    description: 'Data-at-rest is protected per organizational policy.',
    status: 'partial', owner: 'Data Team',
    lastAssessed: new Date('2024-02-15'), nextReview: new Date('2024-05-15'),
    gaps: ['Encryption not applied to all backup volumes'],
  },
  {
    id: 'ctrl-006', framework: 'ISO 27001', controlId: 'A.12.6.1',
    title: 'Management of technical vulnerabilities',
    description: 'Timely identification and remediation of technical vulnerabilities.',
    status: 'partial', owner: 'IT Ops',
    lastAssessed: new Date('2024-03-05'), nextReview: new Date('2024-06-05'),
    gaps: ['Patch cycle exceeds 30-day SLA for critical CVEs'],
  },
  {
    id: 'ctrl-007', framework: 'NIST CSF', controlId: 'RS.RP-1',
    title: 'Response plan executed during or after an incident',
    description: 'Response plan is executed during or after an event.',
    status: 'compliant', owner: 'IR Team',
    lastAssessed: new Date('2024-02-28'), nextReview: new Date('2024-08-28'),
  },
  {
    id: 'ctrl-008', framework: 'SOC 2', controlId: 'CC7.2',
    title: 'System monitoring',
    description: 'The entity monitors system components for anomalies.',
    status: 'compliant', owner: 'SOC',
    lastAssessed: new Date('2024-03-10'), nextReview: new Date('2024-09-10'),
  },
];

// Allowlists for filter params
const VALID_FRAMEWORKS = ['ISO 27001', 'NIST CSF', 'SOC 2'];
const VALID_STATUSES   = ['compliant', 'partial', 'non_compliant'];

export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const framework = searchParams.get('framework');
  const status    = searchParams.get('status');
  const query     = searchParams.get('q')?.slice(0, 200).toLowerCase();

  let results = [...controls];
  if (framework && VALID_FRAMEWORKS.includes(framework)) results = results.filter(c => c.framework === framework);
  if (status    && VALID_STATUSES.includes(status))      results = results.filter(c => c.status    === status);
  if (query)     results = results.filter(c =>
    c.title.toLowerCase().includes(query) ||
    c.controlId.toLowerCase().includes(query) ||
    c.description.toLowerCase().includes(query),
  );

  const frameworks = [...new Set(controls.map(c => c.framework))];
  const scores: Record<string, number> = {};
  for (const fw of frameworks) {
    const fwControls = controls.filter(c => c.framework === fw);
    scores[fw] = Math.round(
      (fwControls.filter(c => c.status === 'compliant').length / fwControls.length) * 100,
    );
  }

  return NextResponse.json({
    data: results,
    meta: {
      total:        results.length,
      compliant:    results.filter(c => c.status === 'compliant').length,
      partial:      results.filter(c => c.status === 'partial').length,
      nonCompliant: results.filter(c => c.status === 'non_compliant').length,
      frameworkScores: scores,
    },
  });
}
