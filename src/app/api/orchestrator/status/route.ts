import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthRead } from '@/lib/api-guard';

// Agent state simulation (Phase 2: read from Redis)
const agentStates = {
  grc:     { status: 'idle', lastRun: new Date(Date.now() - 5  * 60_000).toISOString(), tasksCompleted: 12 },
  soc:     { status: 'idle', lastRun: new Date(Date.now() - 2  * 60_000).toISOString(), tasksCompleted: 47 },
  av:      { status: 'idle', lastRun: new Date(Date.now() - 10 * 60_000).toISOString(), tasksCompleted: 8  },
  pentest: { status: 'idle', lastRun: new Date(Date.now() - 30 * 60_000).toISOString(), tasksCompleted: 3  },
};

// taskId format matches what submit/route.ts generates: task-<timestamp>-<5 chars>
const TaskIdSchema = z.string().regex(/^task-\d+-[a-z0-9]{5}$/);

export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const rawTaskId = searchParams.get('taskId');

  if (rawTaskId) {
    // Validate taskId format before passing to the store lookup
    const parsed = TaskIdSchema.safeParse(rawTaskId);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid taskId format' }, { status: 400 });
    }

    const { taskStore } = await import('../submit/route');
    const task = taskStore.get(parsed.data);

    if (!task) {
      // Return a generic 404 — do not echo the supplied taskId back to avoid reflection
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ data: task });
  }

  // Omit process.uptime() — server operational metadata should not be client-visible
  return NextResponse.json({
    data: {
      agents:    agentStates,
      queueSize: 0,
      conflicts: [],
      timestamp: new Date().toISOString(),
    },
  });
}
