// ─────────────────────────────────────────────
//  SOCAgent — Security Operations Center
// ─────────────────────────────────────────────
import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentTaskResult, SOCAgentInput, SOCAgentOutput, AlertSeverity } from '@/types';
import { getSOCDashboard, getAlerts, getIncidents } from '@/services/soc';

export class SOCAgent extends BaseAgent {
  constructor() {
    super('soc');
  }

  protected async handleTask(task: AgentTask): Promise<AgentTaskResult> {
    const input = task.payload as unknown as SOCAgentInput;

    switch (input.action) {
      case 'triage_alert':
        return this.triageAlert(input.alertId);
      case 'investigate_incident':
        return this.investigateIncident(input.incidentId);
      case 'hunt_threats':
        return this.huntThreats();
      case 'correlate_events':
        return this.correlateEvents(input.timeRangeHours ?? 24);
      default:
        return { success: false, message: `Unknown SOC action: ${input.action}` };
    }
  }

  private async triageAlert(alertId?: string): Promise<AgentTaskResult> {
    const alerts = await getAlerts();
    const alert = alertId ? alerts.find(a => a.id === alertId) : alerts[0];
    if (!alert) return { success: false, message: 'Alert not found' };

    const severityMap: Record<AlertSeverity, number> = {
      critical: 10, high: 8, medium: 5, low: 2, info: 1,
    };
    const riskScore = severityMap[alert.severity] ?? 0;
    const autoContain = riskScore >= 8;

    const finding = this.createFinding(
      `Triage: ${alert.title}`,
      alert.description,
      alert.severity === 'critical' ? 'critical'
        : alert.severity === 'high' ? 'high'
        : alert.severity === 'medium' ? 'medium' : 'low',
      alert.affectedAssets[0],
      autoContain ? 'Auto-containment triggered. Isolate affected asset immediately.' : 'Monitor and investigate.',
    );

    const output: SOCAgentOutput = {
      triageResult: {
        alert,
        recommendation: autoContain
          ? 'Critical severity — triggering automated isolation'
          : 'Schedule investigation within 2 hours',
        autoContain,
      },
      recommendations: [
        autoContain ? `Isolate ${alert.affectedAssets.join(', ')} immediately` : `Assign alert ${alertId} for investigation`,
      ],
      riskScore,
    };

    return { success: true, data: output, findings: [finding], recommendations: output.recommendations };
  }

  private async investigateIncident(incidentId?: string): Promise<AgentTaskResult> {
    const incidents = await getIncidents();
    const incident = incidentId ? incidents.find(i => i.id === incidentId) : incidents[0];
    if (!incident) return { success: false, message: 'Incident not found' };

    const findings = incident.affectedSystems.map(system =>
      this.createFinding(
        `System under investigation: ${system}`,
        `Part of incident ${incident.id}: ${incident.title}`,
        incident.severity === 'critical' ? 'critical' : 'high',
        system,
        'Preserve forensic evidence before remediation',
      )
    );

    return {
      success: true,
      data: { incident, timelineEvents: incident.timeline.length },
      findings,
      recommendations: [
        `Incident ${incident.id} has ${incident.affectedSystems.length} affected systems`,
        'Preserve logs and memory dumps for forensics',
        'Notify incident response team and stakeholders',
      ],
    };
  }

  private async huntThreats(): Promise<AgentTaskResult> {
    const dashboard = await getSOCDashboard();
    const iocs = dashboard.threatIndicators;

    const findings = iocs
      .filter(i => i.severity === 'critical' || i.severity === 'high')
      .map(ioc =>
        this.createFinding(
          `Threat IOC: ${ioc.type.toUpperCase()} — ${ioc.value}`,
          `Confidence: ${ioc.confidence}% | Source: ${ioc.source} | Tags: ${ioc.tags.join(', ')}`,
          ioc.severity === 'critical' ? 'critical' : 'high',
          ioc.value,
          'Block IOC across all perimeter controls and EDR',
        )
      );

    const output: SOCAgentOutput = {
      threatHuntResults: iocs,
      recommendations: iocs.map(i => `Block ${i.type}: ${i.value}`),
      riskScore: Math.max(...iocs.map(i => i.confidence / 10)),
    };

    return { success: true, data: output, findings, recommendations: output.recommendations };
  }

  private async correlateEvents(hours: number): Promise<AgentTaskResult> {
    const alerts = await getAlerts();
    const recent = alerts.filter(a =>
      new Date(a.detectedAt).getTime() >= Date.now() - hours * 60 * 60 * 1000
    );

    // Group by MITRE technique
    const byTechnique: Record<string, typeof alerts> = {};
    for (const a of recent) {
      if (a.mitreTechnique) {
        byTechnique[a.mitreTechnique] = [...(byTechnique[a.mitreTechnique] ?? []), a];
      }
    }

    const correlationFindings = Object.entries(byTechnique)
      .filter(([, alerts]) => alerts.length > 1)
      .map(([technique, alerts]) =>
        this.createFinding(
          `Correlated activity: MITRE ${technique}`,
          `${alerts.length} alerts share technique ${technique}`,
          'high',
          undefined,
          `Investigate campaign using MITRE ATT&CK technique ${technique}`,
        )
      );

    const output: SOCAgentOutput = {
      correlatedAlerts: recent,
      recommendations: Object.entries(byTechnique)
        .filter(([, a]) => a.length > 1)
        .map(([t, a]) => `${a.length} alerts correlated on MITRE ${t}`),
      riskScore: Object.keys(byTechnique).length * 2,
    };

    return { success: true, data: output, findings: correlationFindings, recommendations: output.recommendations };
  }
}

export const socAgent = new SOCAgent();
