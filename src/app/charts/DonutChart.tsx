'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type DonutSlice = { name: string; value: number; color: string };

interface DonutChartProps {
  data:   DonutSlice[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  centerLabel?: string;
}

export function DonutChart({
  data,
  height       = 220,
  innerRadius  = 55,
  outerRadius  = 85,
  showLegend   = true,
  centerLabel,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const label = centerLabel ?? String(total);

  return (
    <div style={{ height }} className="relative w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((slice, i) => (
              <Cell key={i} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#0d1526',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              fontSize: 11,
              color: 'rgba(255,255,255,0.8)',
            }}
            formatter={(value: number, name: string) => [`${value} (${total ? Math.round((value / total) * 100) : 0}%)`, name]}
          />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-2xl font-bold text-white/90">{label}</p>
        <p className="text-[10px] text-white/30 mt-0.5">total</p>
      </div>
    </div>
  );
}
