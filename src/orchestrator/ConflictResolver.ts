// ─────────────────────────────────────────────
//  ConflictResolver — handles agent conflicts
//  e.g. two agents acting on the same asset,
//  contradictory findings, or resource contention
// ─────────────────────────────────────────────
import { AgentTask, AgentDomain, AgentFinding, FindingSeverity } from '@/types';

export type ConflictType =
  | 'duplicate_task'
  | 'asset_contention'
  | 'contradictory_finding'
  | 'priority_clash';

export interface Conflict {
  id: string;
  type: ConflictType;
  domains: AgentDomain[];
  description: string;
  resolution: string;
  resolvedAt?: Date;
}

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  critical: 5, high: 4, medium: 3, low: 2, info: 1,
};

export class ConflictResolver {
  private conflicts: Conflict[] = [];
  private conflictCounter = 0;

  // ── Detect if a new task conflicts with active tasks ───────
  detectTaskConflict(
    newTask: AgentTask,
    activeTasks: AgentTask[]
  ): Conflict | null {
    // Duplicate: same domain + same action + same payload target
    const duplicate = activeTasks.find(
      t =>
        t.domain === newTask.domain &&
        t.action === newTask.action &&
        t.status === 'in_progress'
    );

    if (duplicate) {
      const conflict: Conflict = {
        id: `conflict-${++this.conflictCounter}`,
        type: 'duplicate_task',
        domains: [newTask.domain],
        description: `Duplicate ${newTask.action} task already in-progress for ${newTask.domain} agent`,
        resolution: 'Queue new task; will execute after current completes',
      };
      this.conflicts.push(conflict);
      return conflict;
    }

    // Asset contention: two domains acting on same asset
    const newAsset = (newTask.payload as Record<string, unknown> | undefined)?.assetId as string | undefined;
    if (newAsset) {
      const contending = activeTasks.find(
        t =>
          t.domain !== newTask.domain &&
          t.status === 'in_progress' &&
          (t.payload as Record<string, unknown> | undefined)?.assetId === newAsset
      );
      if (contending) {
        const conflict: Conflict = {
          id: `conflict-${++this.conflictCounter}`,
          type: 'asset_contention',
          domains: [newTask.domain, contending.domain],
          description: `Both ${newTask.domain} and ${contending.domain} agents targeting asset: ${newAsset}`,
          resolution: `${contending.domain} agent has priority; ${newTask.domain} task queued`,
        };
        this.conflicts.push(conflict);
        return conflict;
      }
    }

    return null;
  }

  // ── Merge/deduplicate findings from multiple agents ────────
  mergeFindings(allFindings: AgentFinding[]): AgentFinding[] {
    const seen = new Map<string, AgentFinding>();

    for (const finding of allFindings) {
      const key = `${finding.title.toLowerCase().trim()}-${finding.affectedAsset ?? ''}`;
      const existing = seen.get(key);

      if (!existing) {
        seen.set(key, finding);
      } else {
        // Keep the higher-severity version
        if (SEVERITY_RANK[finding.severity] > SEVERITY_RANK[existing.severity]) {
          seen.set(key, { ...finding, description: `[Merged] ${finding.description}` });
        }
      }
    }

    return Array.from(seen.values());
  }

  // ── Arbitrate priority between domains ─────────────────────
  arbitratePriority(tasks: AgentTask[]): AgentTask[] {
    // SOC critical tasks always go first
    return tasks.sort((a, b) => {
      if (a.domain === 'soc' && a.priority === 'critical') return -1;
      if (b.domain === 'soc' && b.priority === 'critical') return 1;
      return 0;
    });
  }

  resolveConflict(conflictId: string): void {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (conflict) conflict.resolvedAt = new Date();
  }

  getConflicts(includeResolved = false): Conflict[] {
    return includeResolved
      ? this.conflicts
      : this.conflicts.filter(c => !c.resolvedAt);
  }
}
