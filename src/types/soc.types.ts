export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'new' | 'investigating' | 'contained' | 'resolved' | 'false_positive';
export type IncidentStatus = 'open' | 'in_progress' | 'contained' | 'closed';

export interface SOCAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: string;
  sourceIp?: string;
  destinationIp?: string;
  affectedAssets: string[];
  mitreTechnique?: string;
  detectedAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  tags: string[];
  confidence?: number;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: IncidentStatus;
  alerts: string[];
  affectedSystems: string[];
  timeline: IncidentEvent[];
  assignedTeam: string;
  createdAt: Date;
  containedAt?: Date;
  resolvedAt?: Date;
  postMortemUrl?: string;
}

export interface IncidentEvent {
  id: string;
  timestamp: Date;
  actor: string;
  action: string;
  details: string;
}

export interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email';
  value: string;
  severity: AlertSeverity;
  confidence: number;
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  tags: string[];
}

export interface SOCDashboardData {
  activeAlerts: SOCAlert[];
  openIncidents: Incident[];
  threatIndicators: ThreatIndicator[];
  alertsLast24h: number;
  criticalAlerts: number;
  mttr: number;
  alertTrend: { hour: string; count: number }[];
  severityBreakdown: Record<AlertSeverity, number>;
}

export interface SOCAgentInput {
  action: 'triage_alert' | 'investigate_incident' | 'hunt_threats' | 'correlate_events';
  alertId?: string;
  incidentId?: string;
  timeRangeHours?: number;
}

export interface SOCAgentOutput {
  triageResult?: { alert: SOCAlert; recommendation: string; autoContain: boolean };
  correlatedAlerts?: SOCAlert[];
  threatHuntResults?: ThreatIndicator[];
  recommendations: string[];
  riskScore: number;
}
