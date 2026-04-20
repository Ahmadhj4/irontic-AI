import React from 'react';
import { clsx } from '@/lib/clsx';

interface CardProps {
  children?: React.ReactNode;
  /** Optional header render prop — rendered above children with a subtle divider */
  header?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: boolean;
}

const paddingClasses = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };

export function Card({ children, header, className, padding = 'md', glow = false }: CardProps) {
  return (
    <div className={clsx(
      'rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] backdrop-blur-sm relative overflow-hidden transition-all duration-300',
      glow && 'hover:border-irontic-purple/30 hover:shadow-glow-sm',
      paddingClasses[padding],
      className
    )}>
      {/* subtle inner highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
      {header && (
        <div className="pb-3 mb-3 border-b border-slate-200 dark:border-white/[0.06]">
          {header}
        </div>
      )}
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white/90">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-white/35 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
