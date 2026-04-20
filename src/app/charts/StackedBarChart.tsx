'use client';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface StackConfig {
  key: string;
  color: string;
  label?: string;
}

interface StackedBarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  stacks: StackConfig[];
  height?: number;
  barSize?: number;
  showLegend?: boolean;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1526',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#e2e8f0',
};

/**
 * Stacked bar chart — used for alert volume histograms (SOC §20.2).
 * Wraps recharts with the project's dark theme.
 */
export function StackedBarChart({
  data, xKey, stacks, height = 180, barSize = 8, showLegend = false,
}: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barSize={barSize} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        {showLegend && <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} iconSize={8} />}
        {stacks.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="a"
            fill={s.color}
            name={s.label ?? s.key}
            radius={i === stacks.length - 1 ? [2, 2, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
