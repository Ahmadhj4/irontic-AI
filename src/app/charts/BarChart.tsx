'use client';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; color: string; label?: string }[];
  height?: number;
  multiColor?: boolean;
  colors?: string[];
}

const DEFAULT_COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

export function BarChart({ data, xKey, bars, height = 200, multiColor = false, colors = DEFAULT_COLORS }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
        {bars.map(b => (
          <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[3, 3, 0, 0]} name={b.label ?? b.key} maxBarSize={40}>
            {multiColor && data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Bar>
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  );
}
