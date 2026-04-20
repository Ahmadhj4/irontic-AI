// ─────────────────────────────────────────────
//  TaskQueue — priority-ordered task queue
// ─────────────────────────────────────────────
import { AgentTask, TaskPriority } from '@/types';

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 4,
  high:     3,
  medium:   2,
  low:      1,
};

export class TaskQueue {
  private queue: AgentTask[] = [];

  enqueue(task: AgentTask): void {
    this.queue.push(task);
    this.sort();
  }

  enqueueMany(tasks: AgentTask[]): void {
    this.queue.push(...tasks);
    this.sort();
  }

  dequeue(): AgentTask | undefined {
    return this.queue.shift();
  }

  peek(): AgentTask | undefined {
    return this.queue[0];
  }

  remove(taskId: string): boolean {
    const idx = this.queue.findIndex(t => t.id === taskId);
    if (idx === -1) return false;
    this.queue.splice(idx, 1);
    return true;
  }

  get size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  getAll(): AgentTask[] {
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }

  private sort(): void {
    this.queue.sort((a, b) => {
      const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (weightDiff !== 0) return weightDiff;
      // tie-break by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }
}
