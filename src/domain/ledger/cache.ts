// -------------------------------------------------------------------
// LEDGER CACHE — simple TTL cache for JSONL reads
// -------------------------------------------------------------------
// Invalidated automatically on any write via the write queue.

import type { LedgerEntry } from "../../core/types";

const TTL_MS = 5000; // 5 seconds

interface CacheEntry {
  data: LedgerEntry[];
  ts: number;
}

const _cache = new Map<string, CacheEntry>();

export function getCached(path: string): LedgerEntry[] | null {
  const entry = _cache.get(path);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    _cache.delete(path);
    return null;
  }
  return entry.data;
}

export function setCache(path: string, data: LedgerEntry[]): void {
  _cache.set(path, { data, ts: Date.now() });
}

export function invalidate(path?: string): void {
  if (path) {
    _cache.delete(path);
  } else {
    _cache.clear();
  }
}
