// ─────────────────────────────────────────────
//  GRC Service — calls /api/grc/* routes
//  Phase 2: API Gateway + TimescaleDB backend
// ─────────────────────────────────────────────
import { GRCDashboardData, ComplianceControl, RiskItem } from '@/types';
import { apiClient } from './api';

// ── Dashboard ──────────────────────────────────────────────────────────────────
// Composes the full GRCDashboardData from the dashboard summary, controls, and
// risks endpoints — the summary alone doesn't carry the full arrays.
export async function getGRCDashboard(): Promise<GRCDashboardData> {
  const [dashRes, controlsRes, risksRes] = await Promise.all([
    apiClient.get<{
      overallComplianceScore: number;
      frameworkScores:        Record<string, number>;
      openFindings:           number;
      criticalRisks:          number;
      trendData:              { date: string; score: number }[];
    }>('/grc/dashboard'),
    apiClient.get<ComplianceControl[]>('/grc/controls'),
    apiClient.get<RiskItem[]>('/grc/risks'),
  ]);

  const dash     = dashRes.data;
  const controls = (controlsRes.data ?? []).map(deserializeControl);
  const risks    = (risksRes.data    ?? []).map(deserializeRisk);

  // Upcoming reviews: controls whose nextReview falls within the next 60 days
  const in60Days      = new Date(Date.now() + 60 * 24 * 60 * 60_000);
  const upcomingReviews = controls.filter(
    c => c.nextReview && new Date(c.nextReview) <= in60Days
  );

  return {
    overallComplianceScore: dash.overallComplianceScore,
    frameworkScores:        dash.frameworkScores,
    controls,
    risks,
    openFindings:           dash.openFindings,
    criticalRisks:          dash.criticalRisks,
    upcomingReviews,
    trendData:              dash.trendData,
  };
}

// JSON → Date deserialization helpers (API returns ISO strings, types expect Date)
function deserializeControl(c: ComplianceControl): ComplianceControl {
  return {
    ...c,
    lastAssessed: c.lastAssessed ? new Date(c.lastAssessed) : c.lastAssessed,
    nextReview:   c.nextReview   ? new Date(c.nextReview)   : c.nextReview,
  };
}

function deserializeRisk(r: RiskItem): RiskItem {
  return {
    ...r,
    identifiedAt: r.identifiedAt ? new Date(r.identifiedAt) : r.identifiedAt,
    reviewedAt:   r.reviewedAt   ? new Date(r.reviewedAt)   : r.reviewedAt,
  };
}

// ── Controls ───────────────────────────────────────────────────────────────────
export async function getControls(params?: {
  framework?: string;
  status?:    string;
  q?:         string;
}): Promise<ComplianceControl[]> {
  const res = await apiClient.get<ComplianceControl[]>('/grc/controls', params as Record<string, string>);
  return (res.data ?? []).map(deserializeControl);
}

// ── Risks ──────────────────────────────────────────────────────────────────────
export async function getRisks(params?: {
  level?:    string;
  status?:   string;
  category?: string;
}): Promise<RiskItem[]> {
  const res = await apiClient.get<RiskItem[]>('/grc/risks', params as Record<string, string>);
  return (res.data ?? []).map(deserializeRisk);
}

// ── Report Generation ─────────────────────────────────────────────────────────
export async function generateReport(
  framework: string = 'all',
  format:    'json' | 'pdf' = 'json'
): Promise<{
  id:          string;
  title:       string;
  generatedAt: string;
  overallScore: number;
  summary:     Record<string, number>;
  recommendations: string[];
  downloadUrl: string;
}> {
  const res = await apiClient.post<{
    id:              string;
    title:           string;
    generatedAt:     string;
    overallScore:    number;
    summary:         Record<string, number>;
    recommendations: string[];
    downloadUrl:     string;
  }>('/grc/report', { framework, format });
  return res.data;
}
