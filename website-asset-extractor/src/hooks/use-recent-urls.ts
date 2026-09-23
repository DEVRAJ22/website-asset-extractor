"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "wae-recent-urls";
const MAX_RECENT = 8;
const EMPTY_RECENT: string[] = [];

const listeners = new Set<() => void>();

let cachedSerialized = "";
let cachedSnapshot: string[] = EMPTY_RECENT;

function readRecentFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      return parsed.length > 0 ? parsed : EMPTY_RECENT;
    }
  } catch {
    /* ignore */
  }
  return EMPTY_RECENT;
}

function getRecentSnapshot(): string[] {
  const next = readRecentFromStorage();
  const serialized = JSON.stringify(next);
  if (serialized === cachedSerialized) {
    return cachedSnapshot;
  }
  cachedSerialized = serialized;
  cachedSnapshot = next;
  return cachedSnapshot;
}

function subscribeRecent(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function notifyRecent() {
  cachedSerialized = "";
  for (const listener of listeners) listener();
}

export function useRecentUrls() {
  const recent = useSyncExternalStore(
    subscribeRecent,
    getRecentSnapshot,
    () => EMPTY_RECENT,
  );

  const addRecent = useCallback((url: string) => {
    const prev = readRecentFromStorage();
    const next = [url, ...prev.filter((u) => u !== url)].slice(0, MAX_RECENT);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      notifyRecent();
    } catch {
      /* ignore */
    }
  }, []);

  return { recent, addRecent };
}
