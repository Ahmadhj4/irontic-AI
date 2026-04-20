'use client';
import { useState, useEffect, useCallback } from 'react';
import { SOCDashboardData, AgentState, AgentFinding } from '@/types';
import { socAgent } from '@/agents/SOCAgent';
import { getSOCDashboard } from '@/services/soc';
import { contextBridge } from '@/mcp';

interface UseSOCReturn {
  data: SOCDashboardData | null;
  agentState: AgentState;
  findings: AgentFinding[];
  loading: boolean;
  error: string | null;
  triageAlert: (alertId?: string) => Promise<void>;
  huntThreats: () => Promise<void>;
  correlateEvents: (hours?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSOC(): UseSOCReturn {
  const [data, setData] = useState<SOCDashboardData | null>(null);
  const [agentState, setAgentState] = useState<AgentState>(socAgent.getState());
  const [findings, setFindings] = useState<AgentFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getSOCDashboard();
      setData(dashboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load SOC data');
    } finally {
      setLoading(false);
    }
  }, []);

  const triageAlert = useCallback(async (alertId?: string) => {
    setError(null);
    try {
      const result = await socAgent.executeTask({
        id: `task-${Date.now()}`, domain: 'soc', action: 'triage_alert',
        priority: 'critical', status: 'queued',
        payload: { action: 'triage_alert', alertId },
        createdAt: new Date(),
      });
      if (result.findings) {
        setFindings((prev: AgentFinding[]) => [...prev, ...result.findings!]);
        contextBridge.shareFindings('soc', result.findings);
      }
      setAgentState(socAgent.getState());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Triage failed');
    }
  }, []);

  const huntThreats = useCallback(async () => {
    setError(null);
    try {
      const result = await socAgent.executeTask({
        id: `task-${Date.now()}`, domain: 'soc', action: 'hunt_threats',
        priority: 'high', status: 'queued',
        payload: { action: 'hunt_threats' },
        createdAt: new Date(),
      });
      if (result.findings) {
        setFindings((prev: AgentFinding[]) => [...prev, ...result.findings!]);
        contextBridge.shareFindings('soc', result.findings);
      }
      setAgentState(socAgent.getState());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Threat hunt failed');
    }
  }, []);

  const correlateEvents = useCallback(async (hours = 24) => {
    setError(null);
    try {
      const result = await socAgent.executeTask({
        id: `task-${Date.now()}`, domain: 'soc', action: 'correlate_events',
        priority: 'high', status: 'queued',
        payload: { action: 'correlate_events', timeRangeHours: hours },
        createdAt: new Date(),
      });
      if (result.findings) {
        setFindings((prev: AgentFinding[]) => [...prev, ...result.findings!]);
        contextBridge.shareFindings('soc', result.findings);
      }
      setAgentState(socAgent.getState());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Correlation failed');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, agentState, findings, loading, error, triageAlert, huntThreats, correlateEvents, refresh };
}
