import { NextRequest, NextResponse } from 'next/server';
import { requireAuthRead } from '@/lib/api-guard';

// Unified Search API — searches across SOC alerts, GRC controls, risks, and incidents
// Phase 2: replace with Elasticsearch / OpenSearch full-text index

interface SearchResult {
  id: string; type: 'alert' | 'incident' | 'control' | 'risk' | 'finding';
  title: string; description: string; severity?: string; status?: string;
  domain: string; url: string; score: number;
}

const CORPUS: Omit<SearchResult, 'score'>[] = [
  { id: 'alert-001', type: 'alert',    domain: 'soc', title: 'Brute force login attempt detected',        description: 'Multiple failed login attempts from 192.168.1.45 against admin accounts.',        severity: 'high',     status: 'investigating', url: '/soc' },
  { id: 'alert-002', type: 'alert',    domain: 'soc', title: 'Suspicious outbound connection',             description: 'Workstation communicating with known C2 server IP 185.220.101.50.',              severity: 'critical', status: 'new',           url: '/soc' },
  { id: 'alert-003', type: 'alert',    domain: 'soc', title: 'Privilege escalation attempt',               description: 'Process attempted to gain SYSTEM privileges via known exploit T1068.',           severity: 'critical', status: 'new',           url: '/soc' },
  { id: 'alert-004', type: 'alert',    domain: 'soc', title: 'Anomalous data exfiltration',                description: 'Unusual volume of data transferred to external destination via T1041.',          severity: 'high',     status: 'investigating', url: '/soc' },
  { id: 'alert-005', type: 'alert',    domain: 'soc', title: 'Unpatched vulnerability exploited',          description: 'CVE-2024-1234 exploit attempt detected on web-prod-01 via WAF.',                 severity: 'medium',   status: 'contained',     url: '/soc' },
  { id: 'inc-001',   type: 'incident', domain: 'soc', title: 'Ransomware activity on finance segment',     description: 'Suspected ransomware detected on ws-finance-07 and ws-finance-09.',              severity: 'critical', status: 'in_progress',   url: '/soc' },
  { id: 'inc-002',   type: 'incident', domain: 'soc', title: 'Credential compromise via phishing',         description: 'Employee credentials compromised through targeted spear-phishing campaign.',    severity: 'high',     status: 'open',          url: '/soc' },
  { id: 'ctrl-001',  type: 'control',  domain: 'grc', title: 'A.5.1.1 — Policies for information security', description: 'ISO 27001 — A set of policies for information security shall be defined.',  status: 'compliant',   url: '/grc' },
  { id: 'ctrl-002',  type: 'control',  domain: 'grc', title: 'A.9.1.1 — Access control policy',              description: 'ISO 27001 — MFA not enforced on all systems.',                             status: 'partial',     url: '/grc' },
  { id: 'ctrl-003',  type: 'control',  domain: 'grc', title: 'ID.AM-1 — Physical devices inventoried',       description: 'NIST CSF — Asset inventory incomplete, CMDB not up-to-date.',               status: 'non_compliant', url: '/grc' },
  { id: 'ctrl-004',  type: 'control',  domain: 'grc', title: 'CC6.1 — Logical and physical access',          description: 'SOC 2 — Logical access security software and architectures.',               status: 'compliant',   url: '/grc' },
  { id: 'ctrl-005',  type: 'control',  domain: 'grc', title: 'PR.DS-1 — Data-at-rest protected',             description: 'NIST CSF — Encryption not applied to all backup volumes.',                  status: 'partial',     url: '/grc' },
  { id: 'risk-001',  type: 'risk',     domain: 'grc', title: 'Unpatched critical CVEs in production',         description: 'Several production servers have unpatched critical vulnerabilities.',        severity: 'critical', status: 'open', url: '/grc' },
  { id: 'risk-002',  type: 'risk',     domain: 'grc', title: 'Inadequate privileged access controls',         description: 'Over-provisioned admin accounts with no periodic review.',                  severity: 'high',     status: 'open', url: '/grc' },
  { id: 'risk-003',  type: 'risk',     domain: 'grc', title: 'Third-party vendor security gaps',              description: 'Key vendors have not completed security assessments.',                     severity: 'medium',   status: 'open', url: '/grc' },
  { id: 'risk-004',  type: 'risk',     domain: 'grc', title: 'Insufficient backup and DR testing',            description: 'Disaster recovery procedures not tested in 18 months.',                    severity: 'high',     status: 'open', url: '/grc' },
  { id: 'risk-005',  type: 'risk',     domain: 'grc', title: 'Inadequate employee security training',         description: 'Less than 60% of staff completed mandatory security awareness training.',   severity: 'high',     status: 'mitigating', url: '/grc' },
];

const VALID_TYPES   = new Set(['alert', 'incident', 'control', 'risk', 'finding']);
const VALID_DOMAINS = new Set(['soc', 'grc', 'av', 'pentest']);

function computeScore(item: Omit<SearchResult, 'score'>, terms: string[]): number {
  const text = `${item.title} ${item.description}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (item.title.toLowerCase().includes(term))       score += 50;
    if (item.description.toLowerCase().includes(term)) score += 30;
    if (item.type.includes(term))                      score += 10;
    if (item.domain.includes(term))                    score += 10;
    if (text.includes(term))                           score += 5;
  }
  return Math.min(score, 100);
}

export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const q      = searchParams.get('q')?.trim() ?? '';
  const type   = searchParams.get('type')   ?? undefined;
  const domain = searchParams.get('domain') ?? undefined;
  const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));

  // Validate query: 2–200 chars
  if (q.length < 2 || q.length > 200) {
    return NextResponse.json(
      { error: 'Query parameter "q" must be 2–200 characters' },
      { status: 400 },
    );
  }
  // Allowlist filter params — ignore unknown values rather than 400ing
  const safeType   = type   && VALID_TYPES.has(type)   ? type   : undefined;
  const safeDomain = domain && VALID_DOMAINS.has(domain) ? domain : undefined;

  // Split into at most 10 terms to cap scoring iterations
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 10);

  let corpus = [...CORPUS];
  if (safeType)   corpus = corpus.filter(i => i.type   === safeType);
  if (safeDomain) corpus = corpus.filter(i => i.domain === safeDomain);

  const results: SearchResult[] = corpus
    .map(item => ({ ...item, score: computeScore(item, terms) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Do not echo raw user input back — return only term count
  return NextResponse.json({
    data: results,
    meta: { total: results.length, termCount: terms.length },
  });
}
