// ─────────────────────────────────────────────
//  Orchestrator Service — calls /api/orchestrator/*
//  Phase 2: dispatches to Kafka + FastAPI backend
// ─────────────────────────────────────────────
import { AgentDomain, TaskPriority } from '@/types';
import { apiClient } from './api';

export interface TaskStatus {
  id:           string;
  domain:       AgentDomain;
  action:       string;
  priority:     TaskPriority;
  status:       'queued' | 'assigned' | 'executing' | 'reporting' | 'completed' | 'failed' | 'cancelled';
  createdAt:    string;
  startedAt?:   string;
  completedAt?: string;
  result?:      unknown;
}

export interface OrchestratorStatus {
  agents:    Record<AgentDomain, { status: string; lastRun: string; tasksCompleted: number }>;
  queueSize: number;
  conflicts: unknown[];
  uptime:    number;
  timestamp: string;
}

export async function submitTask(
  domain:   AgentDomain,
  action:   string,
  payload?: Record<string, unknown>,
  priority: TaskPriority = 'medium'
): Promise<TaskStatus> {
  const res = await apiClient.post<TaskStatus>('/orchestrator/submit', {
    domain, action, payload, priority,
  });
  return res.data;
}

export async function getOrchestratorStatus(): Promise<OrchestratorStatus> {
  const res = await apiClient.get<OrchestratorStatus>('/orchestrator/status');
  return res.data;
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const res = await apiClient.get<TaskStatus>(`/orchestrator/status?taskId=${taskId}`);
  return res.data;
}

export async function runFullScan(): Promise<{
  scanId:    string;
  startedAt: string;
  tasks:     TaskStatus[];
  message:   string;
}> {
  const res = await apiClient.post<{
    scanId:    string;
    startedAt: string;
    tasks:     TaskStatus[];
    message:   string;
  }>('/orchestrator/scan', {});
  return res.data;
}
