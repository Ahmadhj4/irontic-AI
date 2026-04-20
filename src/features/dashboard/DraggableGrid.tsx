'use client';
import { useState, useEffect } from 'react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { Badge } from '@/components/ui/Badge';
import { LineChart } from '@/app/charts/LineChart';

/**
 * §FR-D2 Draggable widget grid — react-grid-layout.
 * Layout is persisted per-session via localStorage.
 * Each widget is independently draggable and resizable.
 */

const STORAGE_KEY = 'irontic_grid_layout_v1';

interface GridItem { i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number }

const COLS = 10;
const DEFAULT_LAYOUT: GridItem[] = [
  { i:'crs',       x:0, y:0, w:2, h:4, minW:2, minH:3 },
  { i:'alerts',    x:2, y:0, w:4, h:4, minW:3, minH:2 },
  { i:'domains',   x:6, y:0, w:4, h:4, minW:3, minH:2 },
  { i:'trend',     x:0, y:4, w:6, h:4, minW:4, minH:3 },
  { i:'incidents', x:6, y:4, w:4, h:4, minW:3, minH:3 },
];

const MOCK_TREND = Array.from({ length: 12 }, (_, i) => ({
  h: `${(i * 2).toString().padStart(2,'0')}:00`,
  v: Math.floor(40 + Math.sin(i * 0.6) * 20 + Math.random() * 10),
}));

const DOMAIN_SCORES = [
  { d:'SOC', score:72, color:'text-irontic-cyan'  },
  { d:'GRC', score:76, color:'text-green-400'      },
  { d:'EP',  score:83, color:'text-emerald-400'    },
  { d:'PT',  score:62, color:'text-orange-400'     },
];

const RECENT_ALERTS = [
  { id:'ALR-881', title:'Lateral Movement',    sev:'critical' as const },
  { id:'ALR-880', title:'PowerShell Exec',      sev:'high'     as const },
  { id:'ALR-879', title:'Container Escape PoC', sev:'critical' as const },
  { id:'ALR-878', title:'MFA Brute Force',       sev:'medium'   as const },
  { id:'ALR-877', title:'ISO Gap A.9.4.2',       sev:'high'     as const },
];

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="h-full rounded-xl border border-white/[0.08] bg-white/[0.04] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] shrink-0">
        <p className="text-xs font-semibold text-white/70">{title}</p>
        <svg className="w-3.5 h-3.5 text-white/20 cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </div>
      <div className="flex-1 overflow-hidden p-3">{children}</div>
    </div>
  );
}

function GridContent({ crs, layout, width, onLayoutChange }: {
  crs: number;
  layout: GridItem[];
  width: number;
  onLayoutChange: (l: GridItem[]) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const GridLayout = require('react-grid-layout').default as React.ComponentType<{
    layout: GridItem[];
    cols: number;
    rowHeight: number;
    width: number;
    onLayoutChange: (l: GridItem[]) => void;
    margin: [number, number];
    children: React.ReactNode;
  }>;

  return (
    <GridLayout
      layout={layout}
      cols={COLS}
      rowHeight={38}
      width={width}
      onLayoutChange={onLayoutChange}
      margin={[10, 10]}
    >
      <div key="crs">
        <Widget title="Composite Risk Score">
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <ScoreGauge score={crs} size="sm" />
            <p className="text-[10px] text-white/30">Weighted §18.3</p>
          </div>
        </Widget>
      </div>

      <div key="alerts">
        <Widget title="Recent Alerts">
          <div className="space-y-1.5 overflow-hidden">
            {RECENT_ALERTS.map(a => (
              <div key={a.id} className="flex items-center gap-2">
                <Badge variant={a.sev}>{a.sev.toUpperCase()}</Badge>
                <p className="text-[10px] text-white/60 truncate">{a.title}</p>
              </div>
            ))}
          </div>
        </Widget>
      </div>

      <div key="domains">
        <Widget title="Domain Scores">
          <div className="grid grid-cols-2 gap-2 h-full">
            {DOMAIN_SCORES.map(d => (
              <div key={d.d} className="bg-white/[0.03] rounded-lg p-2 flex flex-col items-center justify-center">
                <p className={`text-lg font-bold ${d.color}`}>{d.score}</p>
                <p className="text-[9px] text-white/30">{d.d}</p>
              </div>
            ))}
          </div>
        </Widget>
      </div>

      <div key="trend">
        <Widget title="Risk Trend (24h)">
          <LineChart
            data={MOCK_TREND}
            xKey="h"
            lines={[{ key:'v', color:'#8B5CF6', label:'Risk' }]}
            height={110}
          />
        </Widget>
      </div>

      <div key="incidents">
        <Widget title="Open Incidents">
          <div className="space-y-2 overflow-y-auto h-full">
            {[
              { id:'INC-881', title:'Lateral Movement',     sev:'critical', dom:'SOC' },
              { id:'INC-879', title:'Container Escape PoC', sev:'critical', dom:'PT'  },
              { id:'INC-877', title:'ISO Gap A.9.4.2',      sev:'high',     dom:'GRC' },
            ].map(inc => (
              <div key={inc.id} className="bg-white/[0.03] rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge variant={inc.sev as 'critical'|'high'}>{inc.sev.toUpperCase()}</Badge>
                  <span className="text-[9px] text-irontic-sky/60">{inc.dom}</span>
                </div>
                <p className="text-[10px] text-white/70">{inc.title}</p>
                <p className="text-[9px] text-white/25">{inc.id}</p>
              </div>
            ))}
          </div>
        </Widget>
      </div>
    </GridLayout>
  );
}

export function DraggableGrid({ crs }: { crs: number }) {
  const [mounted, setMounted] = useState(false);
  const [layout, setLayout] = useState<GridItem[]>(DEFAULT_LAYOUT);
  const [width, setWidth] = useState(900);

  useEffect(() => {
    setMounted(true);
    const el = document.getElementById('draggable-grid-container');
    if (el) setWidth(el.clientWidth);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLayout(JSON.parse(saved) as GridItem[]);
    } catch { /* ignore */ }
  }, []);

  const handleLayoutChange = (newLayout: GridItem[]) => {
    setLayout(newLayout);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout)); } catch { /* ignore */ }
  };

  return (
    <div id="draggable-grid-container">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-white/80">Operations Widget Grid</p>
          <p className="text-xs text-white/30">Drag to reorder · Resize from corners · Layout saved per session · §FR-D2</p>
        </div>
        <button
          onClick={() => { setLayout(DEFAULT_LAYOUT); try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } }}
          className="text-[10px] text-white/25 hover:text-white/60 border border-white/[0.08] hover:border-white/[0.15] px-2 py-1 rounded-lg transition-colors"
        >
          Reset Layout
        </button>
      </div>

      {!mounted ? (
        <div className="h-32 flex items-center justify-center text-white/20 text-xs rounded-xl border border-white/[0.06]">
          Loading widget grid…
        </div>
      ) : (
        <GridContent crs={crs} layout={layout} width={width} onLayoutChange={handleLayoutChange} />
      )}
    </div>
  );
}
