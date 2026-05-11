// -------------------------------------------------------------------
// WRITE QUEUE — serialize async read-modify-write per file path
// -------------------------------------------------------------------
// Prevents concurrent writes to the same JSONL (or any) file from
// clobbering each other. Each file path gets its own Promise chain.

const _queues = new Map<string, Promise<unknown>>();

export function enqueueWrite<T>(path: string, fn: () => Promise<T>): Promise<T> {
  const prev = _queues.get(path) || Promise.resolve();
  const next = prev.then(fn, fn);
  _queues.set(path, next);
  return next as Promise<T>;
}
