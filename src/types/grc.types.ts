export type ComplianceStatus = 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ComplianceControl {
  id: string;
  framework: string;
  controlId: string;
  title: string;
  description: string;
  status: ComplianceStatus;
  owner: string;
  lastAssessed: Date;
  nextReview: Date;
  evidence?: string[];
  gaps?: string[];
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  level: RiskLevel;
  owner: string;
  mitigations: string[];
  residualRisk: number;
  status: 'open' | 'mitigated' | 'accepted' | 'transferred';
  identifiedAt: Date;
  reviewedAt?: Date;
}

export interface GRCDashboardData {
  overallComplianceScore: number;
  frameworkScores: Record<string, number>;
  controls: ComplianceControl[];
  risks: RiskItem[];
  openFindings: number;
  criticalRisks: number;
  upcomingReviews: ComplianceControl[];
  trendData: { date: string; score: number }[];
}

export interface GRCAgentInput {
  action: 'assess_controls' | 'evaluate_risks' | 'generate_report' | 'check_framework';
  framework?: string;
  controlIds?: string[];
  riskIds?: string[];
}

export interface GRCAgentOutput {
  assessmentResults?: ComplianceControl[];
  riskEvaluation?: RiskItem[];
  recommendations: string[];
  complianceScore: number;
  reportUrl?: string;
}
