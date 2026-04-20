import { clsx } from '@/lib/clsx';

type Variant = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success' | 'neutral';

const variantClasses: Record<Variant, string> = {
  critical: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.15)]',
  high:     'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30',
  medium:   'bg-amber-100 dark:bg-yellow-500/15 text-amber-700 dark:text-yellow-400 border border-amber-200 dark:border-yellow-500/30',
  low:      'bg-sky-100 dark:bg-irontic-sky/10 text-sky-700 dark:text-irontic-sky border border-sky-200 dark:border-irontic-sky/25',
  info:     'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/50 border border-slate-300 dark:border-white/10',
  success:  'bg-cyan-100 dark:bg-irontic-cyan/10 text-cyan-700 dark:text-irontic-cyan border border-cyan-200 dark:border-irontic-cyan/25',
  neutral:  'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-white/40 border border-slate-300 dark:border-white/[0.08]',
};

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  );
}
