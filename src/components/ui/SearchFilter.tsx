'use client';
import React, { useState, useRef, useCallback, memo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

// ─── SearchBar ────────────────────────────────────────────────────────────────
// Internally debounces the onChange to prevent filter re-computation on every keystroke.

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar = memo(function SearchBar({ value, onChange, placeholder = 'Search…', className = '' }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Show the typed value immediately in the input, debounce the upstream onChange
  const [localValue, setLocalValue] = useState(value);
  const debounced = useDebounce(localValue, 220);

  // Sync debounced value upstream
  const prevDebounced = useRef(debounced);
  if (prevDebounced.current !== debounced) {
    prevDebounced.current = debounced;
    onChange(debounced);
  }

  // If parent resets to empty (e.g. clear button outside), sync down
  if (value === '' && localValue !== '') {
    setLocalValue('');
  }

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <svg
        className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 dark:text-white/25 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="w-full bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.07] rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-800 dark:text-white/80 placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:border-irontic-cyan/40 focus:bg-slate-50 dark:focus:bg-white/[0.05] transition-colors [&::-webkit-search-cancel-button]:hidden"
      />
      {localValue && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2 text-slate-400 dark:text-white/25 hover:text-slate-700 dark:hover:text-white/60 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

// ─── FilterChips ──────────────────────────────────────────────────────────────

interface FilterChipsProps<T extends string> {
  options: { value: T | 'all'; label: string }[];
  value: T | 'all';
  onChange: (v: T | 'all') => void;
  colorMap?: Partial<Record<T | 'all', string>>;
}

export function FilterChips<T extends string>({ options, value, onChange, colorMap }: FilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter options">
      {options.map(opt => {
        const isActive = value === opt.value;
        const color = colorMap?.[opt.value];
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
              isActive
                ? color ?? 'bg-irontic-purple/20 text-irontic-sky border-irontic-purple/40'
                : 'bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-white/35 border-slate-300 dark:border-white/[0.06] hover:border-slate-400 dark:hover:border-white/[0.12] hover:text-slate-800 dark:hover:text-white/60'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── SearchFilterRow ──────────────────────────────────────────────────────────

interface SearchFilterRowProps<T extends string> {
  search: string;
  onSearchChange: (v: string) => void;
  filter: T | 'all';
  onFilterChange: (v: T | 'all') => void;
  filterOptions: { value: T | 'all'; label: string }[];
  filterColorMap?: Partial<Record<T | 'all', string>>;
  searchPlaceholder?: string;
  resultCount?: number;
}

export function SearchFilterRow<T extends string>({
  search, onSearchChange,
  filter, onFilterChange,
  filterOptions,
  filterColorMap,
  searchPlaceholder,
  resultCount,
}: SearchFilterRowProps<T>) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="sm:w-52"
      />
      <FilterChips
        options={filterOptions}
        value={filter}
        onChange={onFilterChange}
        colorMap={filterColorMap}
      />
      {resultCount !== undefined && (
        <span className="text-xs text-slate-500 dark:text-white/25 ml-auto tabular-nums">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

// ─── Utility: highlight match ─────────────────────────────────────────────────

export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-irontic-cyan/20 text-irontic-cyan rounded-sm px-0.5">{part}</mark>
      : part
  );
}
