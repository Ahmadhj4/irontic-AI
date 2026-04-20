'use client';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * §20.1 Force-directed agent topology graph.
 * Shows agent nodes (Orchestrator, SOC, GRC, EP, Pentest) and their
 * active communication edges with tool call counts and health colour.
 */

interface TopoNode {
  id: string;
  label: string;
  type: 'orchestrator' | 'domain' | 'integration';
  health: 'healthy' | 'degraded' | 'error';
  tasksDone: number;
}

interface TopoEdge {
  source: string;
  target: string;
  calls: number;
  label: string;
}

const NODES: TopoNode[] = [
  { id:'orch',     label:'Orchestrator',     type:'orchestrator', health:'healthy',  tasksDone:312 },
  { id:'soc',      label:'SOC Agent',        type:'domain',       health:'healthy',  tasksDone:147 },
  { id:'grc',      label:'GRC Agent',        type:'domain',       health:'healthy',  tasksDone:88  },
  { id:'ep',       label:'EP Agent',         type:'domain',       health:'healthy',  tasksDone:203 },
  { id:'pt',       label:'Pentest Agent',    type:'domain',       health:'degraded', tasksDone:41  },
  { id:'elastic',  label:'Elastic SIEM',     type:'integration',  health:'healthy',  tasksDone:0   },
  { id:'snow',     label:'ServiceNow',       type:'integration',  health:'healthy',  tasksDone:0   },
  { id:'cs',       label:'CrowdStrike',      type:'integration',  health:'healthy',  tasksDone:0   },
];

const EDGES: TopoEdge[] = [
  { source:'orch',    target:'soc',     calls:147, label:'triage, hunt'   },
  { source:'orch',    target:'grc',     calls:88,  label:'assess, eval'   },
  { source:'orch',    target:'ep',      calls:203, label:'scan, quarantine'},
  { source:'orch',    target:'pt',      calls:41,  label:'recon, exploit'  },
  { source:'soc',     target:'elastic', calls:312, label:'query alerts'    },
  { source:'soc',     target:'snow',    calls:29,  label:'create ticket'   },
  { source:'ep',      target:'cs',      calls:119, label:'EDR events'      },
  { source:'grc',     target:'soc',     calls:14,  label:'GRC-Impact §17.4'},
  { source:'soc',     target:'grc',     calls:9,   label:'alert→control'   },
];

const NODE_COLOR: Record<string, string> = {
  orchestrator: '#8B5CF6',
  domain:       '#22D3EE',
  integration:  '#64748b',
};

const HEALTH_RING: Record<string, string> = {
  healthy:  '#10b981',
  degraded: '#f59e0b',
  error:    '#ef4444',
};

export function AgentTopology() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const W = el.clientWidth || 640;
    const H = 320;
    el.setAttribute('height', String(H));

    const svg = d3.select(el);
    svg.selectAll('*').remove();

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 18).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', 'rgba(255,255,255,0.15)');

    const nodeMap = new Map(NODES.map(n => [n.id, { ...n, x: W / 2, y: H / 2 }]));

    type SimNode = TopoNode & d3.SimulationNodeDatum;
    type SimEdge = { source: SimNode; target: SimNode; calls: number; label: string };

    const simNodes: SimNode[] = NODES.map(n => ({ ...n, x: W / 2, y: H / 2 }));
    const simEdges = EDGES.map(e => ({
      source: simNodes.find(n => n.id === e.source)!,
      target: simNodes.find(n => n.id === e.target)!,
      calls: e.calls,
      label: e.label,
    }));

    const sim = d3.forceSimulation<SimNode>(simNodes)
      .force('link', d3.forceLink<SimNode, SimEdge>(simEdges).distance(d => 80 + d.calls * 0.2).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(32));

    // Edges
    const edgeG = svg.append('g');
    const edgeSel = edgeG.selectAll('line')
      .data(simEdges)
      .enter().append('line')
      .attr('stroke', 'rgba(255,255,255,0.08)')
      .attr('stroke-width', d => Math.max(1, Math.log2(d.calls + 1) * 0.6))
      .attr('marker-end', 'url(#arrow)');

    // Edge labels (call counts)
    const edgeLabelSel = edgeG.selectAll('text')
      .data(simEdges)
      .enter().append('text')
      .attr('fill', 'rgba(255,255,255,0.20)')
      .attr('font-size', '8')
      .attr('text-anchor', 'middle')
      .text(d => d.calls > 0 ? `×${d.calls}` : '');

    // Node groups
    const nodeG = svg.append('g');
    const nodeSel = nodeG.selectAll('g')
      .data(simNodes)
      .enter().append('g')
      .style('cursor', 'pointer');

    // Outer health ring
    nodeSel.append('circle')
      .attr('r', d => d.type === 'orchestrator' ? 20 : d.type === 'domain' ? 16 : 12)
      .attr('fill', 'none')
      .attr('stroke', d => HEALTH_RING[d.health])
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6);

    // Node fill circle
    nodeSel.append('circle')
      .attr('r', d => d.type === 'orchestrator' ? 17 : d.type === 'domain' ? 13 : 9)
      .attr('fill', d => NODE_COLOR[d.type] + '25')
      .attr('stroke', d => NODE_COLOR[d.type])
      .attr('stroke-width', 1.5);

    // Label below
    nodeSel.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => (d.type === 'orchestrator' ? 20 : d.type === 'domain' ? 16 : 12) + 11)
      .attr('fill', 'rgba(255,255,255,0.55)')
      .attr('font-size', '9')
      .attr('font-family', 'monospace')
      .text(d => d.label);

    // Tasks done badge (domain + orchestrator only)
    nodeSel.filter(d => d.type !== 'integration').append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', d => NODE_COLOR[d.type])
      .attr('font-size', '8')
      .attr('font-weight', 'bold')
      .text(d => d.tasksDone > 0 ? String(d.tasksDone) : '');

    // Drag
    const drag = d3.drag<SVGGElement, SimNode>()
      .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
      .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });

    nodeSel.call(drag as unknown as (selection: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>) => void);

    sim.on('tick', () => {
      edgeSel
        .attr('x1', d => (d.source as SimNode).x ?? 0)
        .attr('y1', d => (d.source as SimNode).y ?? 0)
        .attr('x2', d => (d.target as SimNode).x ?? 0)
        .attr('y2', d => (d.target as SimNode).y ?? 0);

      edgeLabelSel
        .attr('x', d => (((d.source as SimNode).x ?? 0) + ((d.target as SimNode).x ?? 0)) / 2)
        .attr('y', d => (((d.source as SimNode).y ?? 0) + ((d.target as SimNode).y ?? 0)) / 2 - 4);

      nodeSel.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { sim.stop(); };
  }, []);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white/90">Agent Topology</h3>
          <p className="text-xs text-white/30 mt-0.5">Force-directed · drag nodes · edge width = call volume · §20.1</p>
        </div>
        <div className="flex items-center gap-3">
          {[['healthy','#10b981'],['degraded','#f59e0b']].map(([l,c]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c as string }} />
              <span className="text-[9px] text-white/30 capitalize">{l}</span>
            </div>
          ))}
          {[['Orchestrator','#8B5CF6'],['Domain Agent','#22D3EE'],['Integration','#64748b']].map(([l,c]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded" style={{ backgroundColor: (c as string)+'60', border:`1px solid ${c}` }} />
              <span className="text-[9px] text-white/30">{l}</span>
            </div>
          ))}
        </div>
      </div>
      <svg ref={svgRef} width="100%" className="w-full" />
    </div>
  );
}
