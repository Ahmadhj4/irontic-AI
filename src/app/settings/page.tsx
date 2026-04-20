'use client';
import React from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  IconMail, IconSlack, IconPagerDuty, IconSmartphone,
  IconSplunk, IconCrowdStrike, IconSentinelOne, IconJira, IconTeams, IconQualys,
} from '@/components/ui/Icons';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentConfig {
  enabled: boolean;
  scanInterval: number; // minutes
  autoRemediate: boolean;
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  maxConcurrentTasks: number;
  alertOnFinding: boolean;
}

interface NotificationConfig {
  email: { enabled: boolean; address: string; minSeverity: string };
  slack: { enabled: boolean; webhookUrl: string; channel: string; minSeverity: string };
  pagerduty: { enabled: boolean; integrationKey: string; minSeverity: string };
  sms: { enabled: boolean; phoneNumber: string; criticalOnly: boolean };
}

type IntegrationIconKey = 'splunk' | 'crowdstrike' | 'sentinelone' | 'jira' | 'teams' | 'qualys';

interface Integration {
  id: string;
  name: string;
  category: string;
  iconKey: IntegrationIconKey;
  connected: boolean;
  description: string;
  configFields: { key: string; label: string; type: string; placeholder: string }[];
}

const INTEGRATION_ICONS: Record<IntegrationIconKey, React.FC<{ className?: string }>> = {
  splunk:      IconSplunk,
  crowdstrike: IconCrowdStrike,
  sentinelone: IconSentinelOne,
  jira:        IconJira,
  teams:       IconTeams,
  qualys:      IconQualys,
};

// ─── Default states ──────────────────────────────────────────────────────────

const defaultAgents: Record<string, AgentConfig> = {
  SOC: { enabled: true, scanInterval: 5, autoRemediate: false, severityThreshold: 'medium', maxConcurrentTasks: 3, alertOnFinding: true },
  GRC: { enabled: true, scanInterval: 60, autoRemediate: false, severityThreshold: 'high', maxConcurrentTasks: 2, alertOnFinding: true },
  EP: { enabled: true, scanInterval: 15, autoRemediate: true, severityThreshold: 'low', maxConcurrentTasks: 5, alertOnFinding: true },
  Pentest: { enabled: false, scanInterval: 1440, autoRemediate: false, severityThreshold: 'medium', maxConcurrentTasks: 1, alertOnFinding: true },
};

const defaultNotifications: NotificationConfig = {
  email: { enabled: false, address: '', minSeverity: 'high' },
  slack: { enabled: false, webhookUrl: '', channel: '#security-alerts', minSeverity: 'critical' },
  pagerduty: { enabled: false, integrationKey: '', minSeverity: 'critical' },
  sms: { enabled: false, phoneNumber: '', criticalOnly: true },
};

const integrations: Integration[] = [
  {
    id: 'elastic', name: 'Elastic SIEM', category: 'SIEM', iconKey: 'splunk' as IntegrationIconKey, connected: true,
    description: '(Phase 1) Ingest Elastic SIEM alerts and correlate with Irontic AI findings',
    configFields: [
      { key: 'host', label: 'Elastic Host', type: 'text', placeholder: 'https://elastic.company.com:9200' },
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Elastic API Key' },
    ],
  },
  {
    id: 'servicenow', name: 'ServiceNow', category: 'Ticketing', iconKey: 'jira' as IntegrationIconKey, connected: true,
    description: '(Phase 1) Auto-create ServiceNow P1/P2 incidents and risk register webhooks',
    configFields: [
      { key: 'instance', label: 'Instance URL', type: 'text', placeholder: 'https://company.service-now.com' },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'svc-irontic' },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'ServiceNow password' },
    ],
  },
  {
    id: 'splunk', name: 'Splunk SIEM', category: 'SIEM', iconKey: 'splunk' as IntegrationIconKey, connected: false,
    description: '(Phase 2) Ingest Splunk alerts and correlate with Irontic AI findings',
    configFields: [
      { key: 'host', label: 'Splunk Host', type: 'text', placeholder: 'https://splunk.company.com:8089' },
      { key: 'token', label: 'API Token', type: 'password', placeholder: 'Splunk HEC token' },
    ],
  },
  {
    id: 'crowdstrike', name: 'CrowdStrike Falcon', category: 'EDR', iconKey: 'crowdstrike' as IntegrationIconKey, connected: true,
    description: 'Sync endpoint detections and IOCs from Falcon',
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Falcon Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Falcon Client Secret' },
    ],
  },
  {
    id: 'sentinelone', name: 'SentinelOne', category: 'EDR', iconKey: 'sentinelone' as IntegrationIconKey, connected: false,
    description: 'Pull endpoint threats and automate response actions',
    configFields: [
      { key: 'apiUrl', label: 'Console URL', type: 'text', placeholder: 'https://usea1.sentinelone.net' },
      { key: 'apiToken', label: 'API Token', type: 'password', placeholder: 'SentinelOne API Token' },
    ],
  },
  {
    id: 'jira', name: 'Jira', category: 'Ticketing', iconKey: 'jira' as IntegrationIconKey, connected: false,
    description: 'Auto-create Jira tickets for critical findings',
    configFields: [
      { key: 'url', label: 'Jira URL', type: 'text', placeholder: 'https://company.atlassian.net' },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'api-user@company.com' },
      { key: 'token', label: 'API Token', type: 'password', placeholder: 'Jira API Token' },
    ],
  },
  {
    id: 'teams', name: 'Microsoft Teams', category: 'Collaboration', iconKey: 'teams' as IntegrationIconKey, connected: false,
    description: 'Post security alerts to Teams channels',
    configFields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://outlook.office.com/webhook/...' },
    ],
  },
  {
    id: 'qualys', name: 'Qualys VMDR', category: 'Vulnerability', iconKey: 'qualys' as IntegrationIconKey, connected: false,
    description: 'Import vulnerability scan results into Pentest module',
    configFields: [
      { key: 'apiUrl', label: 'API URL', type: 'text', placeholder: 'https://qualysapi.qualys.com' },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'Qualys username' },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'Qualys password' },
    ],
  },
];

// ─── Reusable sub-components ──────────────────────────────────────────────────

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-all duration-200 ${value ? 'bg-irontic-cyan' : 'bg-white/10'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      {label && <span className="text-sm text-white/60">{label}</span>}
    </label>
  );
}

function NumberInput({ value, onChange, min, max, step = 1, suffix }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        min={min} max={max} step={step}
        className="w-20 bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1.5 text-sm text-white/80 focus:outline-none focus:border-irontic-cyan/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {suffix && <span className="text-xs text-white/30">{suffix}</span>}
    </div>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1.5 text-sm text-white/80 focus:outline-none focus:border-irontic-cyan/50"
    >
      {options.map(o => <option key={o.value} value={o.value} className="bg-[#0f1117]">{o.label}</option>)}
    </select>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-irontic-cyan/50"
    />
  );
}

function SaveBanner({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#1a1f2e] border border-green-500/30 rounded-xl px-4 py-3 shadow-xl">
      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
        <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-sm text-white/80">Settings saved</span>
      <button onClick={onDismiss} className="text-white/30 hover:text-white/60 ml-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

const TABS = ['Agents', 'Notifications', 'Integrations', 'Escalation', 'Security', 'API Keys'] as const;
type Tab = typeof TABS[number];

const severityOptions = [
  { value: 'low', label: 'Low & above' },
  { value: 'medium', label: 'Medium & above' },
  { value: 'high', label: 'High & above' },
  { value: 'critical', label: 'Critical only' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Agents');
  const [agents, setAgents] = useState(defaultAgents);
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [connectedIntegrations, setConnectedIntegrations] = useState<Record<string, boolean>>(
    Object.fromEntries(integrations.map(i => [i.id, i.connected]))
  );
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [apiKeys] = useState([
    { id: 'key-1', name: 'Production Dashboard', created: '2026-01-15', lastUsed: '2026-04-09', prefix: 'iak_prod_' },
    { id: 'key-2', name: 'CI/CD Pipeline', created: '2026-02-20', lastUsed: '2026-04-08', prefix: 'iak_ci_' },
  ]);
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [auditLog, setAuditLog] = useState(true);
  const [ipWhitelist, setIpWhitelist] = useState('');

  const updateAgent = (domain: string, field: keyof AgentConfig, value: unknown) => {
    setAgents(prev => ({ ...prev, [domain]: { ...prev[domain], [field]: value } }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const domainColors: Record<string, string> = {
    SOC: 'text-red-400 bg-red-500/10 border-red-500/20',
    GRC: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20',
    AV: 'text-green-400 bg-green-500/10 border-green-500/20',
    Pentest: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-white/[0.07] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-sm text-white/40 mt-1">Configure agents, integrations, and security preferences</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave}>Save Changes</Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-irontic-purple/20 text-irontic-sky border border-irontic-purple/30'
                : 'text-white/40 hover:text-white/70'
            }`}
          >{tab}</button>
        ))}
      </div>

      {/* ── Agents tab ────────────────────────────────────────────────── */}
      {activeTab === 'Agents' && (
        <div className="space-y-4">
          {Object.entries(agents).map(([domain, cfg]) => (
            <Card key={domain} header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${domainColors[domain]}`}>{domain}</span>
                  <span className="text-sm font-semibold text-white/70">{domain} Agent</span>
                </div>
                <Toggle value={cfg.enabled} onChange={v => updateAgent(domain, 'enabled', v)} />
              </div>
            }>
              <div className={`space-y-4 ${!cfg.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1.5">Scan Interval</label>
                    <NumberInput value={cfg.scanInterval} onChange={v => updateAgent(domain, 'scanInterval', v)} min={1} max={10080} suffix="min" />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1.5">Alert Threshold</label>
                    <SelectInput value={cfg.severityThreshold} onChange={v => updateAgent(domain, 'severityThreshold', v)} options={severityOptions} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1.5">Max Tasks</label>
                    <NumberInput value={cfg.maxConcurrentTasks} onChange={v => updateAgent(domain, 'maxConcurrentTasks', v)} min={1} max={10} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 pt-1">
                  <Toggle value={cfg.autoRemediate} onChange={v => updateAgent(domain, 'autoRemediate', v)} label="Auto-remediate threats" />
                  <Toggle value={cfg.alertOnFinding} onChange={v => updateAgent(domain, 'alertOnFinding', v)} label="Alert on new findings" />
                </div>
              </div>
            </Card>
          ))}
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave}>Save Agent Settings</Button>
          </div>
        </div>
      )}

      {/* ── Notifications tab ─────────────────────────────────────────── */}
      {activeTab === 'Notifications' && (
        <div className="space-y-4">
          {/* Email */}
          <Card header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconMail className="w-4 h-4 text-white/50" />
                <span className="text-sm font-semibold text-white/70">Email Alerts</span>
              </div>
              <Toggle value={notifications.email.enabled} onChange={v => setNotifications(prev => ({ ...prev, email: { ...prev.email, enabled: v } }))} />
            </div>
          }>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${!notifications.email.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1.5">Email Address</label>
                <TextInput value={notifications.email.address} onChange={v => setNotifications(prev => ({ ...prev, email: { ...prev.email, address: v } }))} placeholder="security@company.com" type="email" />
              </div>
              <div>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1.5">Minimum Severity</label>
                <SelectInput value={notifications.email.minSeverity} onChange={v => setNotifications(prev => ({ ...prev, email: { ...prev.email, minSeverity: v } }))} options={severityOptions} />
              </div>
            </div>
          </Card>

          {/* Slack */}
          <Card header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconSlack className="w-4 h-4 text-white/50" />
                <span className="text-sm font-semibold text-white/70">Slack</span>
                {!notifications.slack.enabled && <Badge variant="neutral">Disconnected</Badge>}
              </div>
              <Toggle value={notifications.slack.enabled} onChange={v => setNotifications(prev => ({ ...prev, slack: { ...prev.slack, enabled: v } }))} />
            </div>
          }>
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${!notifications.slack.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1.5">Webhook URL</label>
                <TextInput value={notifications.slack.webhookUrl} onChange={v => setNotifications(prev => ({ ...prev, slack: { ...prev.slack, webhookUrl: v } }))} placeholder="https://hooks.slack.com/services/..." />
              </div>
              <div>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1.5">Channel</label>
                <TextInput value={notifications.slack.channel} onChange={v => setNotifications(prev => ({ ...prev, slack: { ...prev.slack, channel: v } }))} placeholder="#security-alerts" />
              </div>
              <div>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1.5">Minimum Severity</label>
                <SelectInput value={notifications.slack.minSeverity} onChange={v => setNotifications(prev => ({ ...prev, slack: { ...prev.slack, minSeverity: v } }))} options={severityOptions} />
              </div>
            </div>
          </Card>

          {/* PagerDuty */}
          <Card header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconPagerDuty className="w-4 h-4 text-white/50" />
                <span className="text-sm font-semibold text-white/70">PagerDuty</span>
                {!notifications.pagerduty.enabled && <Badge variant="neutral">Disconnected</Badge>}
              </div>
              <Toggle value={notifications.pagerduty.enabled} onChange={v => setNotifications(prev => ({ ...prev, pagerduty: { ...prev.pagerduty, enabled: v } }))} />
            </div>
          }>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${!notifications.pagerduty.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1.5">Integration Key</label>
                <TextInput value={notifications.pagerduty.integrationKey} onChange={v => setNotifications(prev => ({ ...prev, pagerduty: { ...prev.pagerduty, integrationKey: v } }))} placeholder="PagerDuty Events API v2 key" type="password" />
              </div>
              <div>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1.5">Alert Level</label>
                <SelectInput value={notifications.pagerduty.minSeverity} onChange={v => setNotifications(prev => ({ ...prev, pagerduty: { ...prev.pagerduty, minSeverity: v } }))} options={severityOptions} />
              </div>
            </div>
          </Card>

          {/* SMS */}
          <Card header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconSmartphone className="w-4 h-4 text-white/50" />
                <span className="text-sm font-semibold text-white/70">SMS Alerts</span>
                {!notifications.sms.enabled && <Badge variant="neutral">Disconnected</Badge>}
              </div>
              <Toggle value={notifications.sms.enabled} onChange={v => setNotifications(prev => ({ ...prev, sms: { ...prev.sms, enabled: v } }))} />
            </div>
          }>
            <div className={`flex flex-wrap items-end gap-4 ${!notifications.sms.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1.5">Phone Number</label>
                <TextInput value={notifications.sms.phoneNumber} onChange={v => setNotifications(prev => ({ ...prev, sms: { ...prev.sms, phoneNumber: v } }))} placeholder="+1 555 000 0000" type="tel" />
              </div>
              <Toggle value={notifications.sms.criticalOnly} onChange={v => setNotifications(prev => ({ ...prev, sms: { ...prev.sms, criticalOnly: v } }))} label="Critical severity only" />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave}>Save Notification Settings</Button>
          </div>
        </div>
      )}

      {/* ── Integrations tab ──────────────────────────────────────────── */}
      {activeTab === 'Integrations' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            {[
              { label: 'Connected', count: Object.values(connectedIntegrations).filter(Boolean).length, color: 'text-green-400' },
              { label: 'Available', count: integrations.length, color: 'text-white/50' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex items-center gap-3">
                <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
                <span className="text-sm text-white/40">{s.label} integrations</span>
              </div>
            ))}
          </div>

          {['SIEM', 'EDR', 'Ticketing', 'Collaboration', 'Vulnerability'].map(category => {
            const catIntegrations = integrations.filter(i => i.category === category);
            return (
              <div key={category}>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">{category}</p>
                <div className="space-y-2">
                  {catIntegrations.map(integration => {
                    const isConnected = connectedIntegrations[integration.id];
                    const isExpanded = expandedIntegration === integration.id;
                    return (
                      <div key={integration.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                        <div className="p-3.5 flex items-center gap-3">
                          {React.createElement(INTEGRATION_ICONS[integration.iconKey], { className: 'w-7 h-7 shrink-0 text-white/60' })}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white/80">{integration.name}</p>
                              {isConnected
                                ? <Badge variant="success">Connected</Badge>
                                : <Badge variant="neutral">Not connected</Badge>
                              }
                            </div>
                            <p className="text-xs text-white/35 mt-0.5">{integration.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setExpandedIntegration(isExpanded ? null : integration.id)}
                              className="text-xs text-irontic-cyan hover:text-irontic-purple transition-colors"
                            >
                              {isExpanded ? 'Collapse' : 'Configure'}
                            </button>
                            <button
                              onClick={() => setConnectedIntegrations(prev => ({ ...prev, [integration.id]: !isConnected }))}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                                isConnected
                                  ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                  : 'border-irontic-cyan/30 text-irontic-cyan hover:bg-irontic-cyan/10'
                              }`}
                            >
                              {isConnected ? 'Disconnect' : 'Connect'}
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-white/[0.05] p-3.5 bg-white/[0.015] space-y-3">
                            {integration.configFields.map(field => (
                              <div key={field.key}>
                                <label className="text-xs text-white/40 font-semibold uppercase tracking-wide block mb-1">{field.label}</label>
                                <TextInput value="" onChange={() => {}} placeholder={field.placeholder} type={field.type} />
                              </div>
                            ))}
                            <div className="flex gap-2 pt-1">
                              <Button variant="secondary" size="sm" onClick={() => setExpandedIntegration(null)}>Cancel</Button>
                              <Button variant="primary" size="sm" onClick={() => { setConnectedIntegrations(prev => ({ ...prev, [integration.id]: true })); setExpandedIntegration(null); handleSave(); }}>Save & Connect</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Escalation tab ────────────────────────────────────────────── */}
      {activeTab === 'Escalation' && (
        <div className="space-y-4">
          <p className="text-xs text-white/35">
            §17.5 — Escalation trees define how unresolved alerts and approval expirations are routed through the organisation.
            Each tier auto-escalates if no action is taken within the configured window.
          </p>

          {/* Visual escalation tree per domain */}
          {[
            {
              domain: 'SOC', color: 'text-red-400 border-red-500/20 bg-red-500/5',
              tiers: [
                { level: 1, role: 'SOC Analyst',       window: '15 min', action: 'Triage alert, apply playbook' },
                { level: 2, role: 'SOC Lead',           window: '30 min', action: 'Dual-approve high-impact write, assign analyst' },
                { level: 3, role: 'Security Engineer',  window: '60 min', action: 'Escalate to cross-domain incident, notify GRC' },
                { level: 4, role: 'Administrator',      window: '90 min', action: 'Executive brief, engage IR retainer' },
              ],
            },
            {
              domain: 'GRC', color: 'text-indigo-300 border-indigo-500/20 bg-indigo-500/5',
              tiers: [
                { level: 1, role: 'GRC Analyst',        window: '24 h',  action: 'Collect evidence, assess control gap' },
                { level: 2, role: 'Security Engineer',  window: '48 h',  action: 'Approve remediation task, update risk register' },
                { level: 3, role: 'Administrator',      window: '72 h',  action: 'Board notification, SLA breach report' },
              ],
            },
            {
              domain: 'EP', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
              tiers: [
                { level: 1, role: 'EP Agent (auto)',    window: 'Instant', action: 'Quarantine endpoint, snapshot memory' },
                { level: 2, role: 'Security Engineer',  window: '10 min',  action: 'Confirm quarantine, begin forensic analysis' },
                { level: 3, role: 'SOC Lead',           window: '30 min',  action: 'Cross-domain correlation with SOC alerts' },
              ],
            },
            {
              domain: 'PT', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
              tiers: [
                { level: 1, role: 'Pentester',          window: '48 h',  action: 'Document finding, assign CVSS score' },
                { level: 2, role: 'Security Engineer',  window: '72 h',  action: 'Dual-approve report publication' },
                { level: 3, role: 'Administrator',      window: '96 h',  action: 'Client escalation, SLA breach notification' },
              ],
            },
          ].map(tree => (
            <Card key={tree.domain} header={
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${tree.color}`}>{tree.domain}</span>
                <span className="text-sm font-semibold text-white/70">Escalation Tree</span>
              </div>
            }>
              <div className="space-y-0">
                {tree.tiers.map((tier, i) => (
                  <div key={tier.level} className="flex items-start gap-3">
                    {/* Connector line */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-[9px] font-bold text-white/40 shrink-0">
                        {tier.level}
                      </div>
                      {i < tree.tiers.length - 1 && (
                        <div className="w-px h-6 bg-white/[0.08] my-0.5" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-white/80">{tier.role}</p>
                        <span className="text-[9px] font-mono text-irontic-cyan/60 border border-irontic-cyan/20 bg-irontic-cyan/5 px-1.5 py-0.5 rounded">
                          ⏱ {tier.window}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/35 mt-0.5">{tier.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* Global escalation settings */}
          <Card header={<span className="text-sm font-semibold text-white/70">Global Escalation Settings</span>}>
            <div className="space-y-4">
              {[
                { label: 'Auto-escalate on approval card expiry', desc: 'Notify next tier when 15-min SLA expires', value: true },
                { label: 'Escalation PagerDuty integration', desc: 'Page on-call engineer when Level 3 is reached', value: true },
                { label: 'Executive alert on Level 4 breach', desc: 'Send executive brief when Level 4 escalation triggers', value: false },
              ].map(setting => (
                <div key={setting.label} className="flex items-center justify-between border-b border-white/[0.04] pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-white/70">{setting.label}</p>
                    <p className="text-xs text-white/35 mt-0.5">{setting.desc}</p>
                  </div>
                  <div className={`relative w-9 h-5 rounded-full transition-all duration-200 cursor-pointer ${setting.value ? 'bg-irontic-cyan' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${setting.value ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave}>Save Escalation Settings</Button>
          </div>
        </div>
      )}

      {/* ── Security tab ──────────────────────────────────────────────── */}
      {activeTab === 'Security' && (
        <div className="space-y-4">
          <Card header={<span className="text-sm font-semibold text-white/70">Authentication & Access</span>}>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">Multi-Factor Authentication</p>
                  <p className="text-xs text-white/35 mt-0.5">Require MFA for all user logins</p>
                </div>
                <Toggle value={mfaEnabled} onChange={setMfaEnabled} />
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                <div>
                  <p className="text-sm font-medium text-white/70">Session Timeout</p>
                  <p className="text-xs text-white/35 mt-0.5">Automatically log out inactive sessions</p>
                </div>
                <NumberInput value={sessionTimeout} onChange={setSessionTimeout} min={5} max={1440} suffix="min" />
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                <div>
                  <p className="text-sm font-medium text-white/70">Audit Logging</p>
                  <p className="text-xs text-white/35 mt-0.5">Log all user actions and agent operations</p>
                </div>
                <Toggle value={auditLog} onChange={setAuditLog} />
              </div>
            </div>
          </Card>

          <Card header={<span className="text-sm font-semibold text-white/70">IP Allowlist</span>}>
            <div className="space-y-3">
              <p className="text-xs text-white/35">Restrict platform access to specific IP ranges. Leave blank to allow all.</p>
              <textarea
                value={ipWhitelist}
                onChange={e => setIpWhitelist(e.target.value)}
                placeholder={"10.0.0.0/8\n192.168.1.0/24\n203.0.113.10"}
                rows={4}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 font-mono focus:outline-none focus:border-irontic-cyan/50 resize-none"
              />
            </div>
          </Card>

          <Card header={<span className="text-sm font-semibold text-white/70">Role-Based Access Control</span>}>
            <div className="space-y-2">
              {[
                { role: 'Admin', desc: 'Full access to all agents, settings, and reports', users: 1, color: 'text-irontic-sky' },
                { role: 'SOC Analyst', desc: 'Read/write access to SOC; read-only to GRC, AV, Pentest', users: 3, color: 'text-red-400' },
                { role: 'GRC Manager', desc: 'Full access to GRC; read-only to all other domains', users: 2, color: 'text-indigo-300' },
                { role: 'AV Engineer', desc: 'Full access to AV; read-only to all other domains', users: 2, color: 'text-green-400' },
                { role: 'Read Only', desc: 'View-only access to all dashboards and reports', users: 5, color: 'text-white/40' },
              ].map(r => (
                <div key={r.role} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className={`text-sm font-semibold ${r.color}`}>{r.role}</p>
                    <p className="text-xs text-white/30 mt-0.5">{r.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/30">{r.users} user{r.users !== 1 ? 's' : ''}</span>
                    <button className="text-xs text-irontic-cyan hover:text-irontic-purple transition-colors">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave}>Save Security Settings</Button>
          </div>
        </div>
      )}

      {/* ── API Keys tab ──────────────────────────────────────────────── */}
      {activeTab === 'API Keys' && (
        <div className="space-y-4">
          <Card header={
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white/70">API Keys</span>
              <Button variant="secondary" size="sm">Generate New Key</Button>
            </div>
          }>
            <div className="space-y-1 mb-4">
              <p className="text-xs text-white/35">Use API keys to authenticate programmatic access to the Irontic AI platform. Keys are shown only once at creation.</p>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {apiKeys.map(key => (
                <div key={key.id} className="py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-irontic-purple/10 border border-irontic-purple/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-irontic-sky" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80">{key.name}</p>
                    <p className="text-xs font-mono text-white/30 mt-0.5">{key.prefix}••••••••••••••••</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/30">Created {new Date(key.created).toLocaleDateString()}</p>
                    <p className="text-xs text-white/20 mt-0.5">Last used {new Date(key.lastUsed).toLocaleDateString()}</p>
                  </div>
                  <button className="ml-2 text-xs text-red-400/60 hover:text-red-400 transition-colors">Revoke</button>
                </div>
              ))}
            </div>
          </Card>

          <Card header={<span className="text-sm font-semibold text-white/70">API Documentation</span>}>
            <div className="space-y-3">
              {[
                { method: 'GET', path: '/api/v1/dashboard', desc: 'Retrieve composite risk score and agent statuses' },
                { method: 'GET', path: '/api/v1/alerts', desc: 'List active SOC alerts with optional filters' },
                { method: 'POST', path: '/api/v1/alerts/:id/triage', desc: 'Triage a specific alert by ID' },
                { method: 'GET', path: '/api/v1/findings', desc: 'List cross-agent security findings' },
                { method: 'POST', path: '/api/v1/scan', desc: 'Trigger a full-spectrum scan across all agents' },
                { method: 'GET', path: '/api/v1/reports', desc: 'Generate and retrieve security reports' },
              ].map(ep => (
                <div key={ep.path} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${ep.method === 'GET' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-irontic-cyan/10 text-irontic-cyan border border-irontic-cyan/20'}`}>
                    {ep.method}
                  </span>
                  <code className="text-xs font-mono text-irontic-sky/70 shrink-0">{ep.path}</code>
                  <span className="text-xs text-white/30 truncate">{ep.desc}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <SaveBanner show={saved} onDismiss={() => setSaved(false)} />
    </div>
  );
}
