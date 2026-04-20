// ─────────────────────────────────────────────────────────────────────────────
//  Realtime simulation service
//  Generates synthetic security events at random intervals to simulate
//  a live security operations environment.
// ─────────────────────────────────────────────────────────────────────────────

export type LiveEventType =
  | 'new_alert'
  | 'alert_resolved'
  | 'new_threat'
  | 'threat_quarantined'
  | 'compliance_change'
  | 'vuln_discovered'
  | 'agent_task_complete'
  | 'score_update';

export interface LiveEvent {
  id: string;
  type: LiveEventType;
  timestamp: Date;
  domain: 'SOC' | 'EP' | 'GRC' | 'Pentest' | 'System';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  detail: string;
}

type Listener = (event: LiveEvent) => void;

// ─── Synthetic event pools ────────────────────────────────────────────────────

const SOC_ALERTS = [
  { title: 'DNS tunneling detected', detail: 'Suspicious DNS query volume from ws-eng-11', severity: 'high' as const },
  { title: 'Lateral movement attempt', detail: 'SMB enumeration from 10.0.2.15 to 5 hosts', severity: 'critical' as const },
  { title: 'Credential stuffing attack', detail: '2,400 failed login attempts via login portal', severity: 'high' as const },
  { title: 'PowerShell obfuscation detected', detail: 'Encoded PowerShell execution on ws-hr-04', severity: 'medium' as const },
  { title: 'Suspicious scheduled task created', detail: 'New AT job on auth-server-01 by unknown user', severity: 'high' as const },
  { title: 'Port scan from external IP', detail: '203.0.113.99 scanned 1,024 ports in 30s', severity: 'medium' as const },
  { title: 'Anomalous admin login at 3AM', detail: 'Admin account used from unusual geolocation', severity: 'critical' as const },
  { title: 'LDAP enumeration detected', detail: 'LDAP bind queries exceed baseline by 400%', severity: 'medium' as const },
];

const AV_THREATS = [
  { title: 'Malware detected on ws-sales-02', detail: 'Trojan.GenericKD variant quarantined automatically', severity: 'high' as const },
  { title: 'PUP detected on ws-mkt-07', detail: 'Potentially unwanted program blocked at execution', severity: 'low' as const },
  { title: 'Rootkit attempt blocked', detail: 'Kernel driver injection attempt prevented on srv-db-01', severity: 'critical' as const },
  { title: 'Crypto miner activity halted', detail: 'XMRig variant terminated; CPU restored to normal', severity: 'medium' as const },
  { title: 'Definition update applied', detail: 'Signatures updated to 2026.04.09.002 on 6 endpoints', severity: 'info' as const },
  { title: 'USB threat intercepted', detail: 'Autorun malware blocked on removable drive', severity: 'high' as const },
];

const GRC_EVENTS = [
  { title: 'ISO 27001 control re-assessed', detail: 'A.12.6.1 moved from partial → compliant', severity: 'info' as const },
  { title: 'New risk identified', detail: 'Supply chain risk from vendor API dependency added', severity: 'medium' as const },
  { title: 'Compliance review overdue', detail: 'SOC 2 CC7.1 review is 14 days past schedule', severity: 'high' as const },
  { title: 'Risk score improved', detail: 'Privileged access risk residual reduced after PAM deployment', severity: 'info' as const },
  { title: 'Policy exception requested', detail: 'Firewall rule exception for dev environment submitted', severity: 'low' as const },
];

const PENTEST_EVENTS = [
  { title: 'New vulnerability discovered', detail: 'SSRF in /api/fetch endpoint — CVSS 7.5', severity: 'high' as const },
  { title: 'CVE-2024-1001 validated as exploitable', detail: 'Proof of concept executed against api.company.com', severity: 'critical' as const },
  { title: 'Scan completed: internal subnet', detail: '10.0.4.0/24 assessed; 3 new medium findings', severity: 'medium' as const },
  { title: 'Remediation verified', detail: 'SQL injection on /api/auth/login confirmed patched', severity: 'info' as const },
];

const ALL_EVENTS = [
  ...SOC_ALERTS.map(e => ({ ...e, domain: 'SOC' as const, type: 'new_alert' as const })),
  ...AV_THREATS.map(e => ({ ...e, domain: 'EP' as const, type: 'new_threat' as const })),
  ...GRC_EVENTS.map(e => ({ ...e, domain: 'GRC' as const, type: 'compliance_change' as const })),
  ...PENTEST_EVENTS.map(e => ({ ...e, domain: 'Pentest' as const, type: 'vuln_discovered' as const })),
];

let _counter = 1000;
function nextId() { return `live-${++_counter}`; }

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Simulator class ─────────────────────────────────────────────────────────

class RealtimeSimulator {
  private listeners = new Set<Listener>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private minIntervalMs: number;
  private maxIntervalMs: number;
  private nextTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(minMs = 8000, maxMs = 20000) {
    this.minIntervalMs = minMs;
    this.maxIntervalMs = maxMs;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNext();
  }

  stop() {
    this.isRunning = false;
    if (this.nextTimeout) {
      clearTimeout(this.nextTimeout);
      this.nextTimeout = null;
    }
  }

  private scheduleNext() {
    if (!this.isRunning) return;
    const delay = this.minIntervalMs + Math.random() * (this.maxIntervalMs - this.minIntervalMs);
    this.nextTimeout = setTimeout(() => {
      this.emit(this.generateEvent());
      this.scheduleNext();
    }, delay);
  }

  private generateEvent(): LiveEvent {
    const template = randomFrom(ALL_EVENTS);
    return {
      id: nextId(),
      type: template.type,
      timestamp: new Date(),
      domain: template.domain,
      severity: template.severity,
      title: template.title,
      detail: template.detail,
    };
  }

  private emit(event: LiveEvent) {
    this.listeners.forEach(l => l(event));
  }

  /** Manually fire a specific event (for testing / button triggers) */
  fireEvent(event: Omit<LiveEvent, 'id' | 'timestamp'>) {
    this.emit({ ...event, id: nextId(), timestamp: new Date() });
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const realtimeSimulator = new RealtimeSimulator();
