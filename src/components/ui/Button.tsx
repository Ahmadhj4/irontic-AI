import { clsx } from '@/lib/clsx';
import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary:   'bg-irontic-purple hover:bg-irontic-purple/80 text-white shadow-glow-sm hover:shadow-glow-purple transition-all duration-300',
  secondary: 'bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-white/10 hover:border-irontic-purple/40 transition-all duration-200',
  danger:    'bg-red-600/80 hover:bg-red-600 text-white border border-red-500/30 shadow-[0_0_12px_rgba(220,38,38,0.3)]',
  ghost:     'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white/80 transition-colors',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-irontic-purple/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
