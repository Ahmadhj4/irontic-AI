'use client';
import { useSyncExternalStore, useCallback } from 'react';
import { realtimeSimulator, LiveEvent } from '@/services/realtime';

// ─── Module-level shared store ────────────────────────────────────────────────
// Using useSyncExternalStore so all components share ONE event array.
// A single event fires ONE setState across all subscribers — no duplicate renders.

const MAX_EVENTS = 100;

let _events: LiveEvent[] = [];
let _newCount = 0;
let _isLive = false;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach(l => l());
}

function getSnapshot(): LiveEvent[] {
  return _events;
}
function getNewCountSnapshot(): number {
  return _newCount;
}
function getIsLiveSnapshot(): boolean {
  return _isLive;
}

function subscribeToStore(cb: () => void) {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

// Wire up the singleton simulator once
let _initialized = false;
function initStore() {
  if (_initialized || typeof window === 'undefined') return;
  _initialized = true;

  realtimeSimulator.subscribe((event) => {
    _events = [event, ..._events].slice(0, MAX_EVENTS);
    _newCount += 1;
    notify();
  });

  realtimeSimulator.start();
  _isLive = true;
  notify();
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Returns the rolling window of live events. All components share the same array. */
export function useRealtime(maxVisible = 50) {
  // Ensure simulator is started on first client render
  if (typeof window !== 'undefined') initStore();

  const allEvents = useSyncExternalStore(subscribeToStore, getSnapshot, () => []);
  const newCount = useSyncExternalStore(subscribeToStore, getNewCountSnapshot, () => 0);
  const isLive = useSyncExternalStore(subscribeToStore, getIsLiveSnapshot, () => false);

  const clearNewCount = useCallback(() => {
    _newCount = 0;
    notify();
  }, []);

  const stop = useCallback(() => {
    realtimeSimulator.stop();
    _isLive = false;
    notify();
  }, []);

  const start = useCallback(() => {
    realtimeSimulator.start();
    _isLive = true;
    notify();
  }, []);

  return {
    events: allEvents.slice(0, maxVisible),
    isLive,
    newCount,
    start,
    stop,
    clearNewCount,
  };
}

/** Lightweight summary hook — just the latest event and domain counts. */
export function useRealtimeSummary() {
  if (typeof window !== 'undefined') initStore();

  const events = useSyncExternalStore(subscribeToStore, getSnapshot, () => []);
  const isLive = useSyncExternalStore(subscribeToStore, getIsLiveSnapshot, () => false);
  const newCount = useSyncExternalStore(subscribeToStore, getNewCountSnapshot, () => 0);

  const clearNewCount = useCallback(() => {
    _newCount = 0;
    notify();
  }, []);

  const domainCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.domain] = (acc[e.domain] ?? 0) + 1;
    return acc;
  }, {});

  return {
    latest: events[0] ?? null,
    domainCounts,
    isLive,
    newCount,
    clearNewCount,
    events,
  };
}
