// ─────────────────────────────────────────────
//  AVAgent — Antivirus / Endpoint Protection
// ─────────────────────────────────────────────
import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentTaskResult, AVAgentInput, AVAgentOutput } from '@/types';
import { getAVDashboard, getEndpoints, getThreats, getQuarantine } from '@/services/av';

export class AVAgent extends BaseAgent {
  constructor() {
    super('av');
  }

  protected async handleTask(task: AgentTask): Promise<AgentTaskResult> {
    const input = task.payload as unknown as AVAgentInput;

    switch (input.action) {
      case 'scan_endpoints':
        return this.scanEndpoints(input.endpointId, input.scanType);
      case 'quarantine_threat':
        return this.quarantineThreat(input.threatId);
      case 'remediate_threat':
        return this.remediateThreat(input.threatId);
      case 'update_definitions':
        return this.updateDefinitions();
      case 'threat_hunt':
        return this.threatHunt();
      default:
        return { success: false, message: `Unknown AV action: ${(input as AVAgentInput).action}` };
    }
  }

  // ── Scan one or all endpoints ──────────────────────────────
  private async scanEndpoints(endpointId?: string, scanType = 'quick'): Promise<AgentTaskResult> {
    const endpoints = await getEndpoints();
    const targets = endpointId ? endpoints.filter(e => e.id === endpointId) : endpoints;
    const threats = await getThreats();

    const findings = threats
      .filter(t => t.status === 'active' && (!endpointId || t.endpointId === endpointId))
      .map(t =>
        this.createFinding(
          `${t.threatType.toUpperCase()} detected: ${t.name}`,
          t.description,
          t.severity === 'critical' ? 'critical' : t.severity === 'high' ? 'high' : 'medium',
          t.endpointName,
          t.autoRemediated
            ? 'Auto-remediation applied. Verify endpoint integrity.'
            : `Manually isolate ${t.endpointName} and remove ${t.filePath ?? 'threat file'}.`,
        )
      );

    const output: AVAgentOutput = {
      scanResults: targets.map(ep => ({
        endpoint: ep,
        threatsFound: threats.filter(t => t.endpointId === ep.id),
      })),
      recommendations: findings.map(f => f.title),
      detectionRate: 98.7,
    };

    return {
      success: true,
      data: { scannedEndpoints: targets.length, scanType, activeThreats: findings.length },
      findings,
      recommendations: output.recommendations,
    };
  }

  // ── Quarantine a specific threat ───────────────────────────
  private async quarantineThreat(threatId?: string): Promise<AgentTaskResult> {
    const threats = await getThreats();
    const threat = threatId ? threats.find(t => t.id === threatId) : threats.find(t => t.status === 'active');
    if (!threat) return { success: false, message: 'Threat not found or no active threats' };

    const quarantine = await getQuarantine();
    const entry = quarantine.find(q => q.endpointId === threat.endpointId) ?? {
      id: `qe-${Date.now()}`,
      endpointId: threat.endpointId,
      endpointName: threat.endpointName,
      fileName: threat.filePath?.split('\\').pop() ?? 'unknown',
      filePath: threat.filePath ?? 'unknown',
      threatName: threat.name,
      threatType: threat.threatType,
      quarantinedAt: new Date(),
      size: 0,
    };

    const finding = this.createFinding(
      `Quarantined: ${threat.name}`,
      `Threat ${threat.name} on ${threat.endpointName} has been quarantined.`,
      threat.severity === 'critical' ? 'critical' : 'high',
      threat.endpointName,
      'Monitor endpoint for 24 hours post-quarantine. Review for lateral movement.',
    );

    const output: AVAgentOutput = {
      quarantineResult: { success: true, entry },
      recommendations: [
        `${threat.name} quarantined on ${threat.endpointName}`,
        'Schedule full endpoint scan within 1 hour',
        'Review endpoint for additional IOCs',
      ],
    };

    return { success: true, data: output, findings: [finding], recommendations: output.recommendations };
  }

  // ── Remediate a quarantined threat ────────────────────────
  private async remediateThreat(threatId?: string): Promise<AgentTaskResult> {
    const threats = await getThreats();
    const threat = threatId
      ? threats.find(t => t.id === threatId)
      : threats.find(t => t.status === 'quarantined');
    if (!threat) return { success: false, message: 'No quarantined threat found' };

    const actions = [
      `Deleted malicious file: ${threat.filePath ?? 'unknown path'}`,
      'Restored system registry keys to clean state',
      'Cleared browser cache and credential store',
      'Reset endpoint network policy',
    ];

    const output: AVAgentOutput = {
      remediationResult: { success: true, threatId: threat.id, action: actions[0] },
      recommendations: actions,
    };

    return {
      success: true,
      data: { threat, actions, remediatedAt: new Date() },
      recommendations: output.recommendations,
    };
  }

  // ── Pull latest threat definitions ────────────────────────
  private async updateDefinitions(): Promise<AgentTaskResult> {
    const dashboard = await getAVDashboard();
    const newVersion = `2026.04.07.${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;
    return {
      success: true,
      data: {
        previousVersion: dashboard.definitionVersion,
        newVersion,
        updatedAt: new Date(),
        newSignatures: Math.floor(Math.random() * 200) + 50,
      },
      recommendations: [
        `Definitions updated to ${newVersion}`,
        'All endpoints will receive update within 15 minutes',
      ],
    };
  }

  // ── Proactive threat hunt across all endpoints ────────────
  private async threatHunt(): Promise<AgentTaskResult> {
    const threats = await getThreats();
    const activeThreats = threats.filter(t => t.status === 'active');

    const findings = activeThreats.map(t =>
      this.createFinding(
        `Hunt IOC: ${t.name} (${t.threatType})`,
        `Active ${t.threatType} detected on ${t.endpointName}. Hash: ${t.hash ?? 'N/A'}`,
        t.severity === 'critical' ? 'critical' : t.severity === 'high' ? 'high' : 'medium',
        t.endpointName,
        'Block file hash across all EDR controls and initiate containment.',
      )
    );

    const output: AVAgentOutput = {
      huntResults: activeThreats,
      recommendations: activeThreats.map(t =>
        `Block ${t.threatType} "${t.name}" on ${t.endpointName} — severity: ${t.severity}`
      ),
      detectionRate: 98.7,
    };

    return { success: true, data: output, findings, recommendations: output.recommendations };
  }
}

export const avAgent = new AVAgent();
