import { NextRequest, NextResponse } from 'next/server';
import { requireAuthRead } from '@/lib/api-guard';
import { agentRouter } from '@/orchestrator';
import { AgentDomain } from '@/types';

const VALID_DOMAINS: AgentDomain[] = ['grc', 'soc', 'av', 'pentest'];

// GET /api/v1/agents — live state + metrics for all agents (Tech Doc §22.2)
export async function GET(req: NextRequest) {
  const { error } = await requireAuthRead(req);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const rawDomain = searchParams.get('domain');

  const allStates = agentRouter.getAllStates();

  if (rawDomain) {
    if (!VALID_DOMAINS.includes(rawDomain as AgentDomain)) {
      return NextResponse.json(
        { error: `domain must be one of: ${VALID_DOMAINS.join(', ')}` },
        { status: 400 },
      );
    }
    const state = allStates[rawDomain as AgentDomain];
    return NextResponse.json({ data: state });
  }

  // Return all four agents as an array (§22.2 GET /v1/agents)
  const agents = VALID_DOMAINS.map(d => ({ ...allStates[d], domain: d }));
  return NextResponse.json({ data: agents });
}
