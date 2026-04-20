// ─────────────────────────────────────────────
//  AV Service — mock endpoint & threat data
// ─────────────────────────────────────────────
import {
  AVDashboardData, Endpoint, ThreatDetection, QuarantineEntry,
} from '@/types';

const mockEndpoints: Endpoint[] = [
  {
    id: 'ep-001', name: 'ws-finance-07', ipAddress: '10.0.1.7',
    os: 'Windows', osVersion: '11 Pro', agentVersion: '5.2.1',
    status: 'infected', lastSeen: new Date(Date.now() - 2 * 60000),
    lastScan: new Date(Date.now() - 30 * 60000),
    threatsDetected: 2, department: 'Finance', owner: 'j.smith@company.com',
  },
  {
    id: 'ep-002', name: 'ws-dev-03', ipAddress: '10.0.2.3',
    os: 'Windows', osVersion: '10 Pro', agentVersion: '5.2.1',
    status: 'at_risk', lastSeen: new Date(Date.now() - 5 * 60000),
    lastScan: new Date(Date.now() - 2 * 60 * 60000),
    threatsDetected: 1, department: 'Engineering', owner: 'a.dev@company.com',
  },
  {
    id: 'ep-003', name: 'srv-web-prod-01', ipAddress: '10.0.3.1',
    os: 'Linux', osVersion: 'Ubuntu 22.04', agentVersion: '5.2.0',
    status: 'protected', lastSeen: new Date(Date.now() - 60000),
    lastScan: new Date(Date.now() - 6 * 60 * 60000),
    threatsDetected: 0, department: 'Infrastructure', owner: 'devops@company.com',
  },
  {
    id: 'ep-004', name: 'ws-hr-02', ipAddress: '10.0.4.2',
    os: 'macOS', osVersion: 'Sonoma 14.2', agentVersion: '5.2.1',
    status: 'protected', lastSeen: new Date(Date.now() - 3 * 60000),
    lastScan: new Date(Date.now() - 12 * 60 * 60000),
    threatsDetected: 0, department: 'HR', owner: 'hr.admin@company.com',
  },
  {
    id: 'ep-005', name: 'ws-exec-01', ipAddress: '10.0.5.1',
    os: 'Windows', osVersion: '11 Pro', agentVersion: '5.2.1',
    status: 'protected', lastSeen: new Date(Date.now() - 1 * 60000),
    lastScan: new Date(Date.now() - 4 * 60 * 60000),
    threatsDetected: 0, department: 'Executive', owner: 'ceo@company.com',
  },
  {
    id: 'ep-006', name: 'ws-finance-09', ipAddress: '10.0.1.9',
    os: 'Windows', osVersion: '10 Pro', agentVersion: '5.1.9',
    status: 'quarantined', lastSeen: new Date(Date.now() - 25 * 60000),
    lastScan: new Date(Date.now() - 25 * 60000),
    threatsDetected: 3, department: 'Finance', owner: 'b.jones@company.com',
  },
];

const mockThreats: ThreatDetection[] = [
  {
    id: 'thr-001', endpointId: 'ep-001', endpointName: 'ws-finance-07',
    threatType: 'ransomware', name: 'LockBit.3.0',
    description: 'LockBit ransomware variant detected attempting file encryption on C:\\Users\\Finance\\Documents.',
    severity: 'critical', status: 'active',
    filePath: 'C:\\Users\\Finance\\AppData\\Roaming\\svchost32.exe',
    hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
    detectedAt: new Date(Date.now() - 12 * 60000),
    autoRemediated: false, engine: 'Heuristic Engine v3',
  },
  {
    id: 'thr-002', endpointId: 'ep-001', endpointName: 'ws-finance-07',
    threatType: 'trojan', name: 'Trojan.AgentTesla',
    description: 'AgentTesla keylogger trojan extracting credentials from browser sessions.',
    severity: 'high', status: 'quarantined',
    filePath: 'C:\\Windows\\Temp\\update32.dll',
    hash: 'deadbeef1234567890abcdef1234567890abcdef',
    detectedAt: new Date(Date.now() - 45 * 60000),
    resolvedAt: new Date(Date.now() - 30 * 60000),
    autoRemediated: true, engine: 'Signature Engine v12',
  },
  {
    id: 'thr-003', endpointId: 'ep-002', endpointName: 'ws-dev-03',
    threatType: 'malware', name: 'Miner.CryptoJack',
    description: 'Cryptocurrency miner consuming CPU resources via injected browser extension.',
    severity: 'medium', status: 'active',
    filePath: 'C:\\Users\\Dev\\AppData\\Local\\Temp\\chrome_ext.exe',
    detectedAt: new Date(Date.now() - 2 * 60 * 60000),
    autoRemediated: false, engine: 'Behavioral Engine v5',
  },
  {
    id: 'thr-004', endpointId: 'ep-006', endpointName: 'ws-finance-09',
    threatType: 'spyware', name: 'SpyEye.Keylogger',
    description: 'Keylogger capturing financial credentials and screenshots.',
    severity: 'critical', status: 'quarantined',
    filePath: 'C:\\ProgramData\\WinHelper\\svchost.exe',
    detectedAt: new Date(Date.now() - 30 * 60000),
    resolvedAt: new Date(Date.now() - 20 * 60000),
    autoRemediated: true, engine: 'Heuristic Engine v3',
  },
  {
    id: 'thr-005', endpointId: 'ep-006', endpointName: 'ws-finance-09',
    threatType: 'worm', name: 'Worm.AutoSpread',
    description: 'Self-replicating worm attempting lateral movement via SMB shares.',
    severity: 'high', status: 'quarantined',
    detectedAt: new Date(Date.now() - 35 * 60000),
    resolvedAt: new Date(Date.now() - 22 * 60000),
    autoRemediated: true, engine: 'Network Monitor v2',
  },
];

const mockQuarantine: QuarantineEntry[] = [
  {
    id: 'qe-001', endpointId: 'ep-001', endpointName: 'ws-finance-07',
    fileName: 'update32.dll', filePath: 'C:\\Windows\\Temp\\update32.dll',
    threatName: 'Trojan.AgentTesla', threatType: 'trojan',
    quarantinedAt: new Date(Date.now() - 30 * 60000), size: 245760,
  },
  {
    id: 'qe-002', endpointId: 'ep-006', endpointName: 'ws-finance-09',
    fileName: 'svchost.exe', filePath: 'C:\\ProgramData\\WinHelper\\svchost.exe',
    threatName: 'SpyEye.Keylogger', threatType: 'spyware',
    quarantinedAt: new Date(Date.now() - 20 * 60000), size: 102400,
  },
  {
    id: 'qe-003', endpointId: 'ep-006', endpointName: 'ws-finance-09',
    fileName: 'autorun.bat', filePath: 'C:\\Users\\Finance09\\autorun.bat',
    threatName: 'Worm.AutoSpread', threatType: 'worm',
    quarantinedAt: new Date(Date.now() - 22 * 60000), size: 4096,
  },
];

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function generateHourlyThreatTrend(hours: number) {
  return Array.from({ length: hours }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    count: Math.floor(Math.random() * 8),
  }));
}

export async function getAVDashboard(): Promise<AVDashboardData> {
  await delay(350);
  return {
    endpoints: mockEndpoints,
    activeThreats: mockThreats.filter(t => t.status === 'active'),
    quarantine: mockQuarantine,
    totalEndpoints: mockEndpoints.length,
    protectedCount: mockEndpoints.filter(e => e.status === 'protected').length,
    infectedCount: mockEndpoints.filter(e => e.status === 'infected' || e.status === 'quarantined').length,
    atRiskCount: mockEndpoints.filter(e => e.status === 'at_risk').length,
    threatsLast24h: 47,
    autoRemediatedToday: 12,
    detectionRate: 98.7,
    definitionVersion: '2026.04.07.001',
    lastDefinitionUpdate: new Date(Date.now() - 3 * 60 * 60000),
    threatTrend: generateHourlyThreatTrend(24),
    threatsByType: [
      { type: 'Ransomware', count: 3 },
      { type: 'Trojan',     count: 8 },
      { type: 'Malware',    count: 12 },
      { type: 'Spyware',    count: 5 },
      { type: 'Worm',       count: 4 },
      { type: 'PUP',        count: 7 },
    ],
  };
}

export async function getEndpoints(): Promise<Endpoint[]> {
  await delay(300);
  return mockEndpoints;
}

export async function getThreats(): Promise<ThreatDetection[]> {
  await delay(300);
  return mockThreats;
}

export async function getQuarantine(): Promise<QuarantineEntry[]> {
  await delay(300);
  return mockQuarantine;
}
