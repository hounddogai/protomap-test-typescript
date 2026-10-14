import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedFlightSnapshot } from "./batched-flight-snapshot.js";

/** Keeps batched flight snapshots by code. */
export interface BatchedFlightSnapshotStore {
  find(code: string): BatchedFlightSnapshot | undefined;
  save(item: BatchedFlightSnapshot): void;
  remove(code: string): boolean;
  list(): BatchedFlightSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedFlightSnapshotStore implements BatchedFlightSnapshotStore {
  items: Map<string, BatchedFlightSnapshot>;
  order: string[];

  constructor(items: Map<string, BatchedFlightSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedFlightSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedFlightSnapshot): void {
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

  list(): BatchedFlightSnapshot[] {
    const out: BatchedFlightSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedFlightSnapshotStore(): BatchedFlightSnapshotStore {
  return new MemoryBatchedFlightSnapshotStore(new Map<string, BatchedFlightSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedFlightSnapshotStore implements BatchedFlightSnapshotStore {
  inner: BatchedFlightSnapshotStore;
  cache: cache.TtlCache<BatchedFlightSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedFlightSnapshotStore,
    cacheValue: cache.TtlCache<BatchedFlightSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedFlightSnapshot | undefined {
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

  save(item: BatchedFlightSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedFlightSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedBatchedFlightSnapshotStore(inner: BatchedFlightSnapshotStore, ttl: number, clockValue: clock.Clock): BatchedFlightSnapshotStore {
  return new CachedBatchedFlightSnapshotStore(
    inner,
    cache.newTtlCache<BatchedFlightSnapshot>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched flight snapshots. Empty fields match all. */
export class BatchedFlightSnapshotQuery {
  category: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRetries: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedFlightSnapshot): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedFlightSnapshot[]): BatchedFlightSnapshot[] {
    const matched = collections.filter(items, (candidate: BatchedFlightSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedFlightSnapshots(store: BatchedFlightSnapshotStore, query: BatchedFlightSnapshotQuery): BatchedFlightSnapshot[] {
  return query.apply(store.list());
}
