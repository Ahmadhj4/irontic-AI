// ─────────────────────────────────────────────
//  AV / Endpoint Protection Types
// ─────────────────────────────────────────────

export type EndpointStatus = 'protected' | 'at_risk' | 'infected' | 'quarantined' | 'offline';
export type ThreatStatus   = 'active' | 'quarantined' | 'remediated' | 'false_positive';
export type ThreatType     = 'malware' | 'ransomware' | 'trojan' | 'spyware' | 'adware' | 'rootkit' | 'worm' | 'pup';
export type ScanType       = 'quick' | 'full' | 'custom';

export interface Endpoint {
  id: string;
  name: string;
  ipAddress: string;
  os: string;
  osVersion: string;
  agentVersion: string;
  status: EndpointStatus;
  lastSeen: Date;
  lastScan: Date;
  threatsDetected: number;
  department: string;
  owner: string;
}

export interface ThreatDetection {
  id: string;
  endpointId: string;
  endpointName: string;
  threatType: ThreatType;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: ThreatStatus;
  filePath?: string;
  hash?: string;
  detectedAt: Date;
  resolvedAt?: Date;
  autoRemediated: boolean;
  engine: string;
}

export interface QuarantineEntry {
  id: string;
  endpointId: string;
  endpointName: string;
  fileName: string;
  filePath: string;
  threatName: string;
  threatType: ThreatType;
  quarantinedAt: Date;
  size: number;
}

export interface AVDashboardData {
  endpoints: Endpoint[];
  activeThreats: ThreatDetection[];
  quarantine: QuarantineEntry[];
  totalEndpoints: number;
  protectedCount: number;
  infectedCount: number;
  atRiskCount: number;
  threatsLast24h: number;
  autoRemediatedToday: number;
  detectionRate: number;    // 0–100
  definitionVersion: string;
  lastDefinitionUpdate: Date;
  threatTrend: { hour: string; count: number }[];
  threatsByType: { type: string; count: number }[];
}

export interface AVAgentInput {
  action: 'scan_endpoints' | 'quarantine_threat' | 'remediate_threat' | 'update_definitions' | 'threat_hunt';
  endpointId?: string;
  threatId?: string;
  scanType?: ScanType;
}

export interface AVAgentOutput {
  scanResults?: { endpoint: Endpoint; threatsFound: ThreatDetection[] }[];
  quarantineResult?: { success: boolean; entry: QuarantineEntry };
  remediationResult?: { success: boolean; threatId: string; action: string };
  huntResults?: ThreatDetection[];
  recommendations: string[];
  detectionRate?: number;
}
