'use client';
import { useState, useEffect } from 'react';

interface SLATimerProps {
  /** Total SLA minutes remaining when the component mounts */
  totalMins: number;
  /** If true the timer counts up (elapsed) instead of down */
  countUp?: boolean;
  showLabel?: boolean;
}

/**
 * Live SLA countdown / elapsed timer.
 * Pulses red when fewer than 5 minutes remain.
 * Used by AnalystWorkload (§20.2 SOC View — SLA countdown timers)
 * and by ApprovalCard (§9.2 — card expires after 15 minutes).
 */
export function SLATimer({ totalMins, countUp = false, showLabel = false }: SLATimerProps) {
  const [secs, setSecs] = useState(countUp ? 0 : totalMins * 60);

  useEffect(() => {
    const id = setInterval(() => {
      setSecs(s => {
        if (!countUp && s <= 0) return 0;
        return countUp ? s + 1 : s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countUp]);

  const m = Math.floor(Math.abs(secs) / 60);
  const s = Math.abs(secs) % 60;
  const expired = !countUp && secs <= 0;
  const urgent  = !countUp && secs > 0 && secs < 300; // < 5 min

  return (
    <span className={`font-mono text-xs font-bold tabular-nums ${
      expired ? 'text-red-500' :
      urgent  ? 'text-red-400 animate-pulse' :
                'text-yellow-400'
    }`}>
      {expired
        ? 'EXPIRED'
        : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      }
      {showLabel && !expired && (
        <span className="ml-1 font-normal text-slate-500 dark:text-white/25">{countUp ? 'elapsed' : 'left'}</span>
      )}
    </span>
  );
}
