// ─────────────────────────────────────────────
//  SOC Service — calls /api/soc/* routes
//  Phase 2: API Gateway + TimescaleDB backend
// ─────────────────────────────────────────────
import { SOCDashboardData, SOCAlert, Incident, ThreatIndicator } from '@/types';
import { apiClient } from './api';

// ── Dashboard ──────────────────────────────────────────────────────────────────
export async function getSOCDashboard(): Promise<SOCDashboardData> {
  const res = await apiClient.get<{
    alertsLast24h:       number;
    criticalAlerts:      number;
    mttr:                number;
    activeAlerts:        number;
    openIncidents:       number;
    threatIndicators:    number;
    severityBreakdown:   SOCDashboardData['severityBreakdown'];
    alertTrend:          SOCDashboardData['alertTrend'];
    topMitreTechniques:  unknown[];
    recentActivity:      unknown[];
    generatedAt:         string;
  }>('/soc/dashboard');

  const alertsRes     = await getAlerts();
  const incidentsRes  = await getIncidents();
  const d             = res.data;

  return {
    activeAlerts:       alertsRes.filter(a => a.status !== 'resolved' && a.status !== 'false_positive'),
    openIncidents:      incidentsRes.filter(i => i.status !== 'closed'),
    threatIndicators:   [] as ThreatIndicator[],   // Phase 2: /api/soc/iocs
    alertsLast24h:      d.alertsLast24h,
    criticalAlerts:     d.criticalAlerts,
    mttr:               d.mttr,
    alertTrend:         d.alertTrend,
    severityBreakdown:  d.severityBreakdown,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────────
export async function getAlerts(params?: {
  severity?: string;
  status?:   string;
  q?:        string;
}): Promise<SOCAlert[]> {
  const res = await apiClient.get<SOCAlert[]>('/soc/alerts', params as Record<string, string>);
  return res.data ?? [];
}

export async function createAlert(payload: Partial<SOCAlert>): Promise<SOCAlert> {
  const res = await apiClient.post<SOCAlert>('/soc/alerts', payload);
  return res.data;
}

export async function triageAlert(
  alertId:  string,
  context:  { severity: string; mitreTechnique?: string; affectedAssets?: string[] }
): Promise<{
  riskScore:    number;
  autoContain:  boolean;
  recommendation: string;
  playbook?:    string;
  actions:      string[];
}> {
  const res = await apiClient.post<{
    alertId:        string;
    riskScore:      number;
    autoContain:    boolean;
    recommendation: string;
    playbook?:      string;
    actions:        string[];
  }>(`/soc/alerts/${alertId}/triage`, context);
  return res.data;
}

// ── Incidents ──────────────────────────────────────────────────────────────────
export async function getIncidents(params?: {
  status?:   string;
  severity?: string;
}): Promise<Incident[]> {
  const res = await apiClient.get<Incident[]>('/soc/incidents', params as Record<string, string>);
  return res.data ?? [];
}
