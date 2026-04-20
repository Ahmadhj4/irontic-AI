'use client';
import { useState, useCallback, createContext, useContext, useEffect } from 'react';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface Toast { id: number; msg: string; kind: ToastKind }

interface ToastCtx { show: (msg: string, kind?: ToastKind) => void }

const Ctx = createContext<ToastCtx>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;

  const show = useCallback((msg: string, kind: ToastKind = 'success') => {
    const id = ++nextId;
    setToasts(p => [...p, { id, msg, kind }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium max-w-sm animate-in slide-in-from-right-4 fade-in duration-200 ${
              t.kind === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' :
              t.kind === 'error'   ? 'bg-red-500/15 border-red-500/30 text-red-300' :
              t.kind === 'warning' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' :
              'bg-irontic-cyan/10 border-irontic-cyan/25 text-irontic-cyan'
            }`}
          >
            <span className="shrink-0 mt-0.5">
              {t.kind === 'success' ? '✓' : t.kind === 'error' ? '✕' : t.kind === 'warning' ? '⚠' : 'ℹ'}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
