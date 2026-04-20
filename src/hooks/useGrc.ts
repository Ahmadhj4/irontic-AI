'use client';
import { useState, useEffect, useCallback } from 'react';
import { GRCDashboardData, AgentState, AgentFinding } from '@/types';
import { grcAgent } from '@/agents/GRCAgent';
import { getGRCDashboard } from '@/services/grc';
import { contextBridge } from '@/mcp';

interface UseGrcReturn {
  data: GRCDashboardData | null;
  agentState: AgentState;
  findings: AgentFinding[];
  loading: boolean;
  error: string | null;
  runAssessment: (framework?: string) => Promise<void>;
  runRiskEvaluation: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useGrc(): UseGrcReturn {
  const [data, setData] = useState<GRCDashboardData | null>(null);
  const [agentState, setAgentState] = useState<AgentState>(grcAgent.getState());
  const [findings, setFindings] = useState<AgentFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getGRCDashboard();
      setData(dashboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load GRC data');
    } finally {
      setLoading(false);
    }
  }, []);

  const runAssessment = useCallback(async (framework?: string) => {
    setError(null);
    try {
      const result = await grcAgent.executeTask({
        id: `task-${Date.now()}`, domain: 'grc', action: 'assess_controls',
        priority: 'high', status: 'queued',
        payload: { action: 'assess_controls', framework },
        createdAt: new Date(),
      });
      if (result.findings) {
        setFindings((prev: AgentFinding[]) => [...prev, ...result.findings!]);
        contextBridge.shareFindings('grc', result.findings);
      }
      setAgentState(grcAgent.getState());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assessment failed');
    }
  }, []);

  const runRiskEvaluation = useCallback(async () => {
    setError(null);
    try {
      const result = await grcAgent.executeTask({
        id: `task-${Date.now()}`, domain: 'grc', action: 'evaluate_risks',
        priority: 'high', status: 'queued',
        payload: { action: 'evaluate_risks' },
        createdAt: new Date(),
      });
      if (result.findings) {
        setFindings((prev: AgentFinding[]) => [...prev, ...result.findings!]);
        contextBridge.shareFindings('grc', result.findings);
      }
      setAgentState(grcAgent.getState());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Risk evaluation failed');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, agentState, findings, loading, error, runAssessment, runRiskEvaluation, refresh };
}
