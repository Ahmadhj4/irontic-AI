// ─────────────────────────────────────────────
//  MemoryStore — shared in-memory context store
//  Agents read/write here to share knowledge
// ─────────────────────────────────────────────
import { AgentDomain, AgentFinding, AgentState } from '@/types';

export interface MemoryEntry {
  key: string;
  domain: AgentDomain;
  value: unknown;
  ttlMs?: number;
  createdAt: Date;
  expiresAt?: Date;
}

export class MemoryStore {
  private store: Map<string, MemoryEntry> = new Map();
  private sharedFindings: AgentFinding[] = [];
  private agentStates: Map<AgentDomain, AgentState> = new Map();

  // ── Generic key-value store with optional TTL ─────────────
  set(domain: AgentDomain, key: string, value: unknown, ttlMs?: number): void {
    const entry: MemoryEntry = {
      key,
      domain,
      value,
      ttlMs,
      createdAt: new Date(),
      expiresAt: ttlMs ? new Date(Date.now() + ttlMs) : undefined,
    };
    this.store.set(`${domain}:${key}`, entry);
  }

  get<T = unknown>(domain: AgentDomain, key: string): T | undefined {
    const entry = this.store.get(`${domain}:${key}`);
    if (!entry) return undefined;
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.store.delete(`${domain}:${key}`);
      return undefined;
    }
    return entry.value as T;
  }

  delete(domain: AgentDomain, key: string): boolean {
    return this.store.delete(`${domain}:${key}`);
  }

  // Cross-domain read (for shared context)
  getAcrossDomains<T = unknown>(key: string): Map<AgentDomain, T> {
    const result = new Map<AgentDomain, T>();
    for (const [storeKey, entry] of this.store) {
      if (storeKey.endsWith(`:${key}`)) {
        const domain = storeKey.split(':')[0] as AgentDomain;
        result.set(domain, entry.value as T);
      }
    }
    return result;
  }

  // ── Shared Findings ────────────────────────────────────────
  addFinding(finding: AgentFinding): void {
    // Avoid exact duplicates
    const exists = this.sharedFindings.some(f => f.id === finding.id);
    if (!exists) this.sharedFindings.push(finding);
  }

  addFindings(findings: AgentFinding[]): void {
    for (const f of findings) this.addFinding(f);
  }

  getFindings(domain?: AgentDomain): AgentFinding[] {
    return domain
      ? this.sharedFindings.filter(f => f.domain === domain)
      : [...this.sharedFindings];
  }

  getCriticalFindings(): AgentFinding[] {
    return this.sharedFindings.filter(f => f.severity === 'critical');
  }

  clearFindings(domain?: AgentDomain): void {
    if (domain) {
      this.sharedFindings = this.sharedFindings.filter(f => f.domain !== domain);
    } else {
      this.sharedFindings = [];
    }
  }

  // ── Agent State Cache ──────────────────────────────────────
  updateAgentState(domain: AgentDomain, state: AgentState): void {
    this.agentStates.set(domain, state);
  }

  getAgentState(domain: AgentDomain): AgentState | undefined {
    return this.agentStates.get(domain);
  }

  getAllAgentStates(): Map<AgentDomain, AgentState> {
    return new Map(this.agentStates);
  }

  // ── Housekeeping ───────────────────────────────────────────
  evictExpired(): number {
    let count = 0;
    const now = new Date();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  snapshot(): { entries: number; findings: number; agentStates: number } {
    return {
      entries: this.store.size,
      findings: this.sharedFindings.length,
      agentStates: this.agentStates.size,
    };
  }
}

export const memoryStore = new MemoryStore();
