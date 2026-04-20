'use client';
import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id:          string;
  type:        'alert' | 'incident' | 'control' | 'risk' | 'finding';
  title:       string;
  description: string;
  severity?:   string;
  domain:      string;
  url:         string;
  score:       number;
}

const TYPE_ICONS: Record<string, string> = {
  alert:    '🔴',
  incident: '🟠',
  control:  '🟢',
  risk:     '🟡',
  finding:  '🔵',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-amber-400',
  medium:   'text-yellow-300',
  low:      'text-emerald-400',
};

interface CommandPaletteProps {
  open:    boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState<SearchResult[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [selected,   setSelected]   = useState(0);
  const [, startTransition]         = useTransition();
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLUListElement>(null);
  const debounced = useDebounce(query, 220);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Fetch search results
  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debounced)}&limit=8`)
      .then(r => r.json())
      .then(json => {
        if (!cancelled) {
          setResults(json.data ?? []);
          setSelected(0);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debounced]);

  const navigate = useCallback((result: SearchResult) => {
    onClose();
    startTransition(() => router.push(result.url));
  }, [onClose, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    }
    if (e.key === 'Enter' && results[selected]) {
      navigate(results[selected]);
    }
  }, [results, selected, navigate, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 bg-[#0d1526] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
          <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search alerts, controls, risks, incidents…"
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/25 outline-none"
          />
          {loading && (
            <svg className="w-4 h-4 text-irontic-cyan animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
          <kbd className="text-[10px] bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5 text-white/25 shrink-0">ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul ref={listRef} className="max-h-80 overflow-y-auto py-1.5">
            {results.map((r, i) => (
              <li key={r.id}>
                <button
                  onClick={() => navigate(r)}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                    i === selected ? 'bg-irontic-purple/20' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-base leading-none mt-0.5 shrink-0" aria-hidden="true">
                    {TYPE_ICONS[r.type] ?? '•'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate">{r.title}</p>
                    <p className="text-xs text-white/35 truncate mt-0.5">{r.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.severity && (
                      <span className={`text-[10px] font-medium uppercase ${SEVERITY_COLORS[r.severity] ?? 'text-white/40'}`}>
                        {r.severity}
                      </span>
                    )}
                    <span className="text-[10px] text-white/20 uppercase">{r.domain}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-white/30">
            No results for <span className="text-white/50">&ldquo;{query}&rdquo;</span>
          </div>
        )}

        {/* Hint */}
        {query.length < 2 && (
          <div className="px-4 py-4 text-xs text-white/20 space-y-1">
            <p>Search across SOC alerts, GRC controls, risks, and incidents</p>
            <p>Use <kbd className="bg-white/[0.06] border border-white/[0.08] rounded px-1">↑↓</kbd> to navigate · <kbd className="bg-white/[0.06] border border-white/[0.08] rounded px-1">↵</kbd> to open</p>
          </div>
        )}
      </div>
    </div>
  );
}
