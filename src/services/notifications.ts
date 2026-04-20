// ─────────────────────────────────────────────
//  Notifications Service — calls /api/notifications/*
//  Phase 2: SES email + Slack webhooks
// ─────────────────────────────────────────────
import { apiClient } from './api';

export type NotificationChannel  = 'email' | 'slack' | 'in_app';
export type NotificationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Notification {
  id:          string;
  title:       string;
  message:     string;
  severity:    NotificationSeverity;
  domain?:     string;
  entityId?:   string;
  entityType?: 'alert' | 'incident' | 'control' | 'risk' | 'finding';
  sentAt:      string;
  read:        boolean;
}

export interface DispatchResult {
  id:       string;
  sentAt:   string;
  channels: Array<{ channel: NotificationChannel; status: string; note: string }>;
  severity: NotificationSeverity;
  title:    string;
}

export async function dispatch(payload: {
  channel:    NotificationChannel | NotificationChannel[];
  severity:   NotificationSeverity;
  title:      string;
  message:    string;
  domain?:    string;
  entityId?:  string;
  entityType?: string;
  recipients?: string[];
}): Promise<DispatchResult> {
  const res = await apiClient.post<DispatchResult>('/notifications/dispatch', payload);
  return res.data;
}

export async function getNotificationLog(): Promise<Notification[]> {
  const res = await apiClient.get<Notification[]>('/notifications/dispatch');
  return res.data ?? [];
}

// Convenience helpers
export const notifyAlert = (title: string, message: string, severity: NotificationSeverity) =>
  dispatch({ channel: ['in_app', 'slack'], severity, title, message, domain: 'soc' });

export const notifyCompliance = (title: string, message: string) =>
  dispatch({ channel: ['in_app', 'email'], severity: 'medium', title, message, domain: 'grc' });

export const notifyCritical = (title: string, message: string) =>
  dispatch({ channel: ['in_app', 'slack', 'email'], severity: 'critical', title, message });
