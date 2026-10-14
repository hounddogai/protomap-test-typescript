import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedFlightCheckpoint } from "./batched-flight-checkpoint.js";

/** Keeps batched flight checkpoints by code. */
export interface BatchedFlightCheckpointStore {
  find(code: string): BatchedFlightCheckpoint | undefined;
  save(item: BatchedFlightCheckpoint): void;
  remove(code: string): boolean;
  list(): BatchedFlightCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedFlightCheckpointStore implements BatchedFlightCheckpointStore {
  items: Map<string, BatchedFlightCheckpoint>;
  order: string[];

  constructor(items: Map<string, BatchedFlightCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedFlightCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedFlightCheckpoint): void {
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

  list(): BatchedFlightCheckpoint[] {
    const out: BatchedFlightCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedFlightCheckpointStore(): BatchedFlightCheckpointStore {
  return new MemoryBatchedFlightCheckpointStore(new Map<string, BatchedFlightCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedFlightCheckpointStore implements BatchedFlightCheckpointStore {
  inner: BatchedFlightCheckpointStore;
  cache: cache.TtlCache<BatchedFlightCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedFlightCheckpointStore,
    cacheValue: cache.TtlCache<BatchedFlightCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedFlightCheckpoint | undefined {
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

  save(item: BatchedFlightCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedFlightCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedBatchedFlightCheckpointStore(inner: BatchedFlightCheckpointStore, ttl: number, clockValue: clock.Clock): BatchedFlightCheckpointStore {
  return new CachedBatchedFlightCheckpointStore(
    inner,
    cache.newTtlCache<BatchedFlightCheckpoint>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched flight checkpoints. Empty fields match all. */
export class BatchedFlightCheckpointQuery {
  country: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRevision: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedFlightCheckpoint): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedFlightCheckpoint[]): BatchedFlightCheckpoint[] {
    const matched = collections.filter(items, (candidate: BatchedFlightCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedFlightCheckpoints(store: BatchedFlightCheckpointStore, query: BatchedFlightCheckpointQuery): BatchedFlightCheckpoint[] {
  return query.apply(store.list());
}
