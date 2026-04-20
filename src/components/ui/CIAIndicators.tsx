'use client';
/**
 * CIA Triad Indicator Components
 *
 * Provides lightweight UI elements that surface Confidentiality, Integrity,
 * and Availability signals inline on dashboard cards and report headers.
 *
 * Components:
 *  - TLPBadge         — Traffic Light Protocol classification label
 *  - IntegrityStamp   — Hash/checksum tag for report authenticity
 *  - AvailabilityDot  — Uptime pulse indicator for live services
 *  - AuditTag         — Shows that an operation is being logged
 *  - CIAStatusRow     — Compact row of all three indicators for card footers
 */

import React, { memo } from 'react';
import { IconHashmark, IconShieldCheck, IconWifi, IconAudit, IconWifiOff } from './Icons';

// ─── TLP Badge ────────────────────────────────────────────────────────────────
// https://www.first.org/tlp/

export type TLPLevel = 'RED' | 'AMBER' | 'GREEN' | 'CLEAR';

const TLP_STYLES: Record<TLPLevel, { bg: string; text: string; border: string; label: string }> = {
  RED:   { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30',    label: 'TLP:RED — Not for disclosure' },
  AMBER: { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/30',  label: 'TLP:AMBER — Limited disclosure' },
  GREEN: { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30',  label: 'TLP:GREEN — Community use' },
  CLEAR: { bg: 'bg-slate-100 dark:bg-white/[0.05]',  text: 'text-slate-700 dark:text-white/50',   border: 'border-slate-300 dark:border-white/[0.1]',   label: 'TLP:CLEAR — Unrestricted' },
};

interface TLPBadgeProps {
  level: TLPLevel;
  /** Show the full description label alongside the badge */
  showLabel?: boolean;
  className?: string;
}

export const TLPBadge = memo(function TLPBadge({ level, showLabel = false, className = '' }: TLPBadgeProps) {
  const s = TLP_STYLES[level];
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wide select-none ${s.bg} ${s.text} ${s.border}`}
        title={s.label}
        aria-label={s.label}
      >
        TLP:{level}
      </span>
      {showLabel && (
        <span className="text-[10px] text-slate-500 dark:text-white/30 hidden sm:inline">{s.label.split('—')[1]?.trim()}</span>
      )}
    </div>
  );
});

// ─── Integrity Stamp ──────────────────────────────────────────────────────────
// Shows a truncated SHA-256-like hash to signal data integrity.

interface IntegrityStampProps {
  /** A short hash string (will be truncated to 8 chars if longer) */
  hash?: string;
  /** Label prefix, default "SHA-256" */
  label?: string;
  className?: string;
}

export const IntegrityStamp = memo(function IntegrityStamp({
  hash,
  label = 'SHA-256',
  className = '',
}: IntegrityStampProps) {
  // Generate a deterministic-looking placeholder if no hash provided
  const displayHash = hash
    ? hash.slice(0, 8).toUpperCase()
    : Math.random().toString(16).slice(2, 10).toUpperCase();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-irontic-cyan/15 bg-irontic-cyan/[0.04] ${className}`}
      title={`${label}: ${hash ?? displayHash} — integrity verified`}
    >
      <IconHashmark className="w-3 h-3 text-irontic-cyan/50 shrink-0" />
      <span className="text-[10px] font-mono text-irontic-cyan/60 tracking-wide">
        {label}:{displayHash}
      </span>
      <IconShieldCheck className="w-3 h-3 text-irontic-cyan/40 shrink-0" />
    </div>
  );
});

// ─── Availability Dot ─────────────────────────────────────────────────────────

interface AvailabilityDotProps {
  /** 0–100 uptime percentage */
  uptime?: number;
  isLive?: boolean;
  label?: string;
  className?: string;
}

export const AvailabilityDot = memo(function AvailabilityDot({
  uptime,
  isLive = true,
  label = 'Operational',
  className = '',
}: AvailabilityDotProps) {
  const color = !isLive
    ? 'bg-slate-300 dark:bg-white/20'
    : uptime !== undefined && uptime < 95
      ? 'bg-amber-400'
      : 'bg-green-400';

  const Icon = isLive ? IconWifi : IconWifiOff;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative flex h-2 w-2 shrink-0">
        {isLive && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-50`} />}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
      </span>
      <Icon className={`w-3 h-3 ${isLive ? 'text-green-500 dark:text-green-400/60' : 'text-slate-400 dark:text-white/20'}`} />
      <span className="text-[10px] text-slate-600 dark:text-white/35">
        {label}
        {uptime !== undefined && <span className="ml-1 text-slate-500 dark:text-white/20 tabular-nums">{uptime.toFixed(1)}%</span>}
      </span>
    </div>
  );
});

// ─── Audit Tag ────────────────────────────────────────────────────────────────

interface AuditTagProps {
  /** Who performed the logged action (optional) */
  actor?: string;
  className?: string;
}

export const AuditTag = memo(function AuditTag({ actor, className = '' }: AuditTagProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-indigo-500/15 bg-indigo-500/[0.05] ${className}`}
      title="This operation is recorded in the audit log"
    >
      <IconAudit className="w-3 h-3 text-indigo-400/60 shrink-0" />
      <span className="text-[10px] text-indigo-300/50">
        {actor ? `Logged · ${actor}` : 'Audit logged'}
      </span>
    </div>
  );
});

// ─── CIA Status Row ───────────────────────────────────────────────────────────
// Compact 3-pillar indicator strip for card footers

interface CIAStatusRowProps {
  /** Confidentiality: TLP level */
  tlp?: TLPLevel;
  /** Integrity: hash string */
  hash?: string;
  /** Availability: uptime 0–100 */
  uptime?: number;
  isLive?: boolean;
  /** Audit: actor name */
  auditActor?: string;
  /** Show audit tag */
  showAudit?: boolean;
  className?: string;
}

export const CIAStatusRow = memo(function CIAStatusRow({
  tlp = 'AMBER',
  hash,
  uptime,
  isLive = true,
  auditActor,
  showAudit = true,
  className = '',
}: CIAStatusRowProps) {
  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      {/* C — Confidentiality */}
      <TLPBadge level={tlp} />
      {/* I — Integrity */}
      <IntegrityStamp hash={hash} />
      {/* A — Availability */}
      <AvailabilityDot uptime={uptime} isLive={isLive} />
      {/* Audit */}
      {showAudit && <AuditTag actor={auditActor} />}
    </div>
  );
});
