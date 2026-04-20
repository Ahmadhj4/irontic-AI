'use client';
import { useState, useEffect, useCallback } from 'react';
import { agentRouter } from '@/orchestrator';
import { AVDashboardData, AgentState, AgentFinding } from '@/types';
import { getAVDashboard } from '@/services/av';
import { contextBridge } from '@/mcp';

export function useAV() {
  const [data, setData]             = useState<AVDashboardData | null>(null);
  const [agentState, setAgentState] = useState<AgentState>(agentRouter.getAgent('av')!.getState());
  const [findings, setFindings]     = useState<AgentFinding[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]     = useState<string | null>(null);

  // ── Refresh helpers ─────────────────────────────────────────────────────────
  const refreshState = useCallback(() => {
    setAgentState(agentRouter.getAgent('av')!.getState());
    setFindings(agentRouter.getAgent('av')!.getState().findings);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const d = await getAVDashboard();
      setData(d);
    } catch {
      // non-fatal — keep stale data visible
    }
  }, []);

  // ── Initial data load ───────────────────────────────────────────────────────
  useEffect(() => {
    getAVDashboard()
      .then(d => { setData(d); })
      .finally(() => { setLoading(false); });
  }, []);

  // ── Action wrapper — sets loading/error, refreshes state + data after ──────
  const runAction = useCallback(async (fn: () => Promise<{ findings?: AgentFinding[] }>) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const result = await fn();
      if (result.findings?.length) {
        contextBridge.shareFindings('av', result.findings);
      }
      refreshState();
      await refreshData();
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Action failed';
      setActionError(msg);
      return { findings: [] };
    } finally {
      setActionLoading(false);
    }
  }, [refreshState, refreshData]);

  // ── Scan all endpoints ──────────────────────────────────────────────────────
  const scanEndpoints = useCallback(async (endpointId?: string) => {
    return runAction(() =>
      agentRouter.getAgent('av')!.executeTask({
        id: `av-scan-${Date.now()}`, domain: 'av', action: 'scan_endpoints',
        priority: 'high', status: 'queued', createdAt: new Date(),
        payload: { action: 'scan_endpoints', endpointId },
      })
    );
  }, [runAction]);

  // ── Quarantine a threat ─────────────────────────────────────────────────────
  const quarantineThreat = useCallback(async (threatId?: string) => {
    return runAction(() =>
      agentRouter.getAgent('av')!.executeTask({
        id: `av-quarantine-${Date.now()}`, domain: 'av', action: 'quarantine_threat',
        priority: 'critical', status: 'queued', createdAt: new Date(),
        payload: { action: 'quarantine_threat', threatId },
      })
    );
  }, [runAction]);

  // ── Remediate a threat ──────────────────────────────────────────────────────
  const remediateThreat = useCallback(async (threatId?: string) => {
    return runAction(() =>
      agentRouter.getAgent('av')!.executeTask({
        id: `av-remediate-${Date.now()}`, domain: 'av', action: 'remediate_threat',
        priority: 'critical', status: 'queued', createdAt: new Date(),
        payload: { action: 'remediate_threat', threatId },
      })
    );
  }, [runAction]);

  // ── Threat hunt ─────────────────────────────────────────────────────────────
  const threatHunt = useCallback(async () => {
    return runAction(() =>
      agentRouter.getAgent('av')!.executeTask({
        id: `av-hunt-${Date.now()}`, domain: 'av', action: 'threat_hunt',
        priority: 'high', status: 'queued', createdAt: new Date(),
        payload: { action: 'threat_hunt' },
      })
    );
  }, [runAction]);

  // ── Update definitions ──────────────────────────────────────────────────────
  const updateDefinitions = useCallback(async () => {
    return runAction(() =>
      agentRouter.getAgent('av')!.executeTask({
        id: `av-defs-${Date.now()}`, domain: 'av', action: 'update_definitions',
        priority: 'medium', status: 'queued', createdAt: new Date(),
        payload: { action: 'update_definitions' },
      })
    );
  }, [runAction]);

  return {
    data, agentState, findings,
    loading, actionLoading, actionError,
    scanEndpoints, quarantineThreat, remediateThreat, threatHunt, updateDefinitions,
  };
}
