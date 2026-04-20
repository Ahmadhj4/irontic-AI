interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  agentStatus?: 'idle' | 'running' | 'paused' | 'error' | 'terminated' | 'initializing' | 'assigned' | 'executing' | 'reporting' | string;
}

const statusConfig: Record<string, { dot: string; label: string; text: string }> = {
  idle:       { dot: 'bg-slate-400 dark:bg-white/25',                    label: 'idle',       text: 'text-slate-500 dark:text-white/35'        },
  running:    { dot: 'bg-irontic-cyan animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.7)]', label: 'running', text: 'text-irontic-cyan' },
  paused:     { dot: 'bg-yellow-400',                                    label: 'paused',     text: 'text-yellow-400'      },
  error:      { dot: 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.7)]', label: 'error',      text: 'text-red-400'         },
  terminated: { dot: 'bg-slate-300 dark:bg-white/15',                    label: 'terminated', text: 'text-slate-400 dark:text-white/25'        },
};

export function PageHeader({ title, subtitle, action, agentStatus }: PageHeaderProps) {
  const cfg = agentStatus ? statusConfig[agentStatus] : null;

  return (
    <div className="flex items-start justify-between mb-6 pb-5 border-b border-slate-200 dark:border-white/[0.07]">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
          {cfg && (
            <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              Agent {cfg.label}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-slate-600 dark:text-white/40 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
