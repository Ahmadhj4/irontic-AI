// ─────────────────────────────────────────────
//  ContextBridge — standardized context exchange
//  between agents via the MCP protocol
// ─────────────────────────────────────────────
import { EventEmitter } from '@/lib/EventEmitter';
import { v4 as uuidv4 } from '@/lib/uuid';
import {
  AgentDomain,
  AgentFinding,
  MCPContext,
  MCPMessage,
  AgentState,
} from '@/types';
import { memoryStore, MemoryStore } from './MemoryStore';

export type ContextBridgeEventType = 'message' | 'finding_shared' | 'context_sync' | 'alert';

export class ContextBridge extends EventEmitter {
  private sessionId: string;
  private store: MemoryStore;
  private messageLog: MCPMessage[] = [];
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor(store: MemoryStore = memoryStore) {
    super();
    this.sessionId = uuidv4();
    this.store = store;
    this.startAutoSync();
  }

  // ── Send a message from one agent to another (or broadcast) ─
  send(
    from: AgentDomain,
    to: AgentDomain | 'broadcast',
    type: MCPMessage['type'],
    payload: unknown
  ): void {
    const message: MCPMessage = { from, to, type, payload, timestamp: new Date() };
    this.messageLog.push(message);
    this.store.set(from, `last_message_sent`, message, 60_000);
    this.emit('message', message);

    // Handle specific message types
    if (type === 'finding_share' && Array.isArray(payload)) {
      this.store.addFindings(payload as AgentFinding[]);
      this.emit('finding_shared', { from, findings: payload });
    }

    if (type === 'alert') {
      this.emit('alert', { from, to, payload });
    }
  }

  // ── Share findings from one agent with all others ────────────
  shareFindings(from: AgentDomain, findings: AgentFinding[]): void {
    if (!findings.length) return;
    this.send(from, 'broadcast', 'finding_share', findings);
    this.store.addFindings(findings);
  }

  // ── Request current context snapshot ──────────────────────
  getContext(): MCPContext {
    return {
      sessionId: this.sessionId,
      sharedFindings: this.store.getFindings(),
      agentStates: Object.fromEntries(this.store.getAllAgentStates()) as Record<string, AgentState>,
      lastUpdated: new Date(),
    };
  }

  // ── Update an agent's state in shared store ────────────────
  updateAgentState(domain: AgentDomain, state: AgentState): void {
    this.store.updateAgentState(domain, state);
    this.send(domain, 'broadcast', 'context_response', { domain, status: state.status });
  }

  // ── Get cross-agent intelligence summary ──────────────────
  getCrossAgentInsights(): {
    criticalFindings: AgentFinding[];
    activeAgents: AgentDomain[];
    busyAgents: AgentDomain[];
    totalFindings: number;
    findingsByDomain: Record<AgentDomain, number>;
  } {
    const ctx = this.getContext();
    const findings = ctx.sharedFindings;
    const domains: AgentDomain[] = ['grc', 'soc', 'av', 'pentest'];

    const findingsByDomain = domains.reduce((acc, d) => {
      acc[d] = findings.filter(f => f.domain === d).length;
      return acc;
    }, {} as Record<AgentDomain, number>);

    const activeAgents = domains.filter(d => {
      const state = this.store.getAgentState(d);
      return state && state.status !== 'terminated';
    });

    const busyAgents = domains.filter(d => {
      const state = this.store.getAgentState(d);
      return state && (state.status as string) === 'executing';
    });

    return {
      criticalFindings: findings.filter(f => f.severity === 'critical'),
      activeAgents,
      busyAgents,
      totalFindings: findings.length,
      findingsByDomain,
    };
  }

  // ── Message history ────────────────────────────────────────
  getMessages(filter?: { from?: AgentDomain; type?: MCPMessage['type'] }): MCPMessage[] {
    let msgs = [...this.messageLog];
    if (filter?.from) msgs = msgs.filter(m => m.from === filter.from);
    if (filter?.type) msgs = msgs.filter(m => m.type === filter.type);
    return msgs;
  }

  // ── Auto-sync agent states every 30s ──────────────────────
  private startAutoSync(): void {
    this.syncInterval = setInterval(() => {
      this.store.evictExpired();
      this.emit('context_sync', this.getContext());
    }, 30_000);
  }

  destroy(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.removeAllListeners();
  }
}

export const contextBridge = new ContextBridge();
