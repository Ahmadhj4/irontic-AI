import { BaseAgent } from './BaseAgent';
import { AgentTask, AgentTaskResult, GRCAgentInput, GRCAgentOutput } from '@/types';
import { getGRCDashboard, getControls, getRisks } from '@/services/grc';

export class GRCAgent extends BaseAgent {
  constructor() {
    super('grc');
  }

  protected async handleTask(task: AgentTask): Promise<AgentTaskResult> {
    const input = task.payload as unknown as GRCAgentInput;

    switch (input.action) {
      case 'assess_controls':
        return this.assessControls(input.framework);
      case 'evaluate_risks':
        return this.evaluateRisks();
      case 'generate_report':
        return this.generateReport();
      case 'check_framework':
        return this.checkFramework(input.framework ?? 'ISO 27001');
      default:
        return { success: false, message: `Unknown GRC action: ${input.action}` };
    }
  }

  private async assessControls(framework?: string): Promise<AgentTaskResult> {
    const controls = await getControls();
    const filtered = framework ? controls.filter(c => c.framework === framework) : controls;

    const nonCompliant = filtered.filter(c => c.status !== 'compliant');
    const findings = nonCompliant.map(c =>
      this.createFinding(
        `Control gap: ${c.controlId} - ${c.title}`,
        c.gaps?.join('; ') ?? `Control ${c.controlId} is ${c.status}`,
        c.status === 'non_compliant' ? 'high' : 'medium',
        c.framework,
        `Review and remediate control ${c.controlId} by ${c.nextReview.toLocaleDateString()}`,
      )
    );

    const output: GRCAgentOutput = {
      assessmentResults: filtered,
      recommendations: nonCompliant.map(c => `Remediate ${c.controlId}: ${c.title}`),
      complianceScore: Math.round((filtered.filter(c => c.status === 'compliant').length / filtered.length) * 100),
    };

    return { success: true, data: output, findings, recommendations: output.recommendations };
  }

  private async evaluateRisks(): Promise<AgentTaskResult> {
    const risks = await getRisks();
    const critical = risks.filter(r => r.level === 'critical' || r.level === 'high');

    const findings = critical.map(r =>
      this.createFinding(
        `Risk: ${r.title}`,
        r.description,
        r.level === 'critical' ? 'critical' : 'high',
        r.category,
        r.mitigations[0],
      )
    );

    const output: GRCAgentOutput = {
      riskEvaluation: risks,
      recommendations: critical.map(r => `Prioritize mitigation of: ${r.title}`),
      complianceScore: 0,
    };

    return { success: true, data: output, findings, recommendations: output.recommendations };
  }

  private async generateReport(): Promise<AgentTaskResult> {
    const dashboard = await getGRCDashboard();
    const output: GRCAgentOutput = {
      recommendations: [
        `Overall compliance: ${dashboard.overallComplianceScore}%`,
        `${dashboard.criticalRisks} critical risk(s) require immediate attention`,
        `${dashboard.openFindings} open control finding(s)`,
      ],
      complianceScore: dashboard.overallComplianceScore,
      reportUrl: '/reports/grc-latest.pdf',
    };
    return { success: true, data: output, recommendations: output.recommendations };
  }

  private async checkFramework(framework: string): Promise<AgentTaskResult> {
    const controls = await getControls();
    const frameworkControls = controls.filter(c => c.framework === framework);
    const score = frameworkControls.length
      ? Math.round((frameworkControls.filter(c => c.status === 'compliant').length / frameworkControls.length) * 100)
      : 0;

    return {
      success: true,
      data: { framework, controlCount: frameworkControls.length, score },
      recommendations: [`${framework} compliance score: ${score}%`],
    };
  }
}

export const grcAgent = new GRCAgent();
