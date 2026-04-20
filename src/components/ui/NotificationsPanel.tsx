'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

export type NotificationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface AppNotification {
  id:        string;
  title:     string;
  message:   string;
  severity:  NotificationSeverity;
  domain?:   string;
  sentAt:    string;
  read:      boolean;
}

const SEVERITY_DOT: Record<NotificationSeverity, string> = {
  critical: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]',
  high:     'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]',
  medium:   'bg-yellow-300',
  low:      'bg-emerald-400',
  info:     'bg-sky-400',
};

const SEVERITY_BORDER: Record<NotificationSeverity, string> = {
  critical: 'border-red-500/30',
  high:     'border-amber-500/30',
  medium:   'border-yellow-400/20',
  low:      'border-emerald-500/20',
  info:     'border-sky-500/20',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60_000);
  if (min < 1)  return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr  < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// Seed live notifications from active alert events
const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-001', title: 'Critical Alert: Ransomware Detected',
    message: 'ws-finance-07 flagged for ransomware activity — containment initiated.',
    severity: 'critical', domain: 'soc',
    sentAt: new Date(Date.now() - 3 * 60_000).toISOString(), read: false,
  },
  {
    id: 'n-002', title: 'Privilege Escalation Attempt',
    message: 'MITRE T1068 detected on ws-dev-03. Immediate review required.',
    severity: 'critical', domain: 'soc',
    sentAt: new Date(Date.now() - 8 * 60_000).toISOString(), read: false,
  },
  {
    id: 'n-003', title: 'GRC Control Due for Review',
    message: 'ID.AM-1 (NIST CSF) is overdue — last assessed 2024-01-20.',
    severity: 'high', domain: 'grc',
    sentAt: new Date(Date.now() - 25 * 60_000).toISOString(), read: false,
  },
  {
    id: 'n-004', title: 'Brute Force: auth-server-01',
    message: 'Multiple failed logins from 192.168.1.45. Account lockout applied.',
    severity: 'high', domain: 'soc',
    sentAt: new Date(Date.now() - 40 * 60_000).toISOString(), read: true,
  },
  {
    id: 'n-005', title: 'Compliance Score Updated',
    message: 'Overall GRC score: 74% (+3%). SOC 2 now at 88%.',
    severity: 'info', domain: 'grc',
    sentAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(), read: true,
  },
];

interface NotificationsPanelProps {
  onUnreadChange?: (count: number) => void;
}

export function NotificationsPanel({ onUnreadChange }: NotificationsPanelProps) {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED_NOTIFICATIONS);
  const panelRef  = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  // Poll /api/notifications/dispatch every 30s and merge new entries
  useEffect(() => {
    const poll = async () => {
      try {
        const res  = await fetch('/api/notifications/dispatch');
        const json = await res.json();
        const remote: AppNotification[] = (json.data ?? []).map((n: {
          id: string; title: string; message: string;
          severity: NotificationSeverity; domain?: string; sentAt: string;
        }) => ({ ...n, read: false }));
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const fresh = remote.filter(n => !existingIds.has(n.id));
          return fresh.length ? [...fresh, ...prev] : prev;
        });
      } catch { /* ignore */ }
    };

    void poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-irontic-purple rounded-full shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-[#0d1526] border border-white/[0.10] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-white/80">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-irontic-purple/30 text-irontic-sky border border-irontic-purple/40 rounded-full px-1.5 py-0.5 font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-white/30 hover:text-irontic-cyan transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
            {notifications.map(n => (
              <li key={n.id}>
                <button
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors border-l-2 ${
                    n.read ? 'border-transparent' : SEVERITY_BORDER[n.severity]
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY_DOT[n.severity]}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${n.read ? 'text-white/40' : 'text-white/85'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-white/30 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {n.domain && (
                          <span className="text-[10px] text-white/20 uppercase">{n.domain}</span>
                        )}
                        <span className="text-[10px] text-white/20">{timeAgo(n.sentAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="px-4 py-8 text-center text-xs text-white/25">No notifications</li>
            )}
          </ul>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-white/[0.07] text-center">
            <button
              onClick={() => setOpen(false)}
              className="text-[11px] text-white/25 hover:text-irontic-cyan transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
