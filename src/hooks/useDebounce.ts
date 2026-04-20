import { useState, useEffect } from 'react';

/**
 * Debounces a value by the given delay (default 250ms).
 * Prevents expensive filtering/re-render on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
