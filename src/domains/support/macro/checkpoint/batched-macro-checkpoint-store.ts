import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedMacroCheckpoint } from "./batched-macro-checkpoint.js";

/** Keeps batched macro checkpoints by code. */
export interface BatchedMacroCheckpointStore {
  find(code: string): BatchedMacroCheckpoint | undefined;
  save(item: BatchedMacroCheckpoint): void;
  remove(code: string): boolean;
  list(): BatchedMacroCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedMacroCheckpointStore implements BatchedMacroCheckpointStore {
  items: Map<string, BatchedMacroCheckpoint>;
  order: string[];

  constructor(items: Map<string, BatchedMacroCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedMacroCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedMacroCheckpoint): void {
    if (!this.items.has(item.code)) {
      this.order.push(item.code);
    }
    this.items.set(item.code, item);
  }

  remove(code: string): boolean {
    if (!this.items.has(code)) return false;
    this.items.delete(code);
    const kept: string[] = [];
    for (const existing of this.order) {
      if (existing !== code) {
        kept.push(existing);
      }
    }
    this.order = kept;
    return true;
  }

  list(): BatchedMacroCheckpoint[] {
    const out: BatchedMacroCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedMacroCheckpointStore(): BatchedMacroCheckpointStore {
  return new MemoryBatchedMacroCheckpointStore(new Map<string, BatchedMacroCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedMacroCheckpointStore implements BatchedMacroCheckpointStore {
  inner: BatchedMacroCheckpointStore;
  cache: cache.TtlCache<BatchedMacroCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedMacroCheckpointStore,
    cacheValue: cache.TtlCache<BatchedMacroCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedMacroCheckpoint | undefined {
    const hit = this.cache.get(code);
    if (hit === undefined) {
      this.misses += 1;
      const found = this.inner.find(code);
      if (found === undefined) return undefined;
      this.cache.put(code, found);
      return found;
    }
    this.hits += 1;
    return hit;
  }

  save(item: BatchedMacroCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedMacroCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedBatchedMacroCheckpointStore(inner: BatchedMacroCheckpointStore, ttl: number, clockValue: clock.Clock): BatchedMacroCheckpointStore {
  return new CachedBatchedMacroCheckpointStore(
    inner,
    cache.newTtlCache<BatchedMacroCheckpoint>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched macro checkpoints. Empty fields match all. */
export class BatchedMacroCheckpointQuery {
  channel: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minLimit: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedMacroCheckpoint): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedMacroCheckpoint[]): BatchedMacroCheckpoint[] {
    const matched = collections.filter(items, (candidate: BatchedMacroCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedMacroCheckpoints(store: BatchedMacroCheckpointStore, query: BatchedMacroCheckpointQuery): BatchedMacroCheckpoint[] {
  return query.apply(store.list());
}
