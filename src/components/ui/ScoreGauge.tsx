import { useId } from 'react';

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

function getColor(score: number) {
  if (score >= 80) return { stroke: '#22D3EE', glow: 'rgba(34,211,238,0.4)',  label: 'text-irontic-cyan'   };
  if (score >= 60) return { stroke: '#8B5CF6', glow: 'rgba(139,92,246,0.4)', label: 'text-irontic-purple' };
  if (score >= 40) return { stroke: '#F59E0B', glow: 'rgba(245,158,11,0.4)', label: 'text-amber-400'       };
  return              { stroke: '#EF4444', glow: 'rgba(239,68,68,0.4)',   label: 'text-red-400'         };
}

const sizes = { sm: 64, md: 96, lg: 128 };

export function ScoreGauge({ score, label, size = 'md' }: ScoreGaugeProps) {
  const uid = useId();
  const dim = sizes[size];
  const r = (dim / 2) - 8;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score, 0), 100);
  const offset = circ - (pct / 100) * circ;
  const { stroke, label: labelClass } = getColor(score);
  const filterId = `glow-${uid}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        {/* Progress */}
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke={stroke} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${dim/2} ${dim/2})`}
          filter={`url(#${filterId})`} />
        {/* Score text */}
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          style={{ fontSize: dim * 0.22, fill: stroke, fontWeight: 700, fontFamily: 'inherit' }}>
          {score}
        </text>
      </svg>
      {label && <span className={`text-xs font-medium ${labelClass}`}>{label}</span>}
    </div>
  );
}
