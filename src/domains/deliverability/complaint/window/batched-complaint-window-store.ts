import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedComplaintWindow } from "./batched-complaint-window.js";

/** Keeps batched complaint windows by code. */
export interface BatchedComplaintWindowStore {
  find(code: string): BatchedComplaintWindow | undefined;
  save(item: BatchedComplaintWindow): void;
  remove(code: string): boolean;
  list(): BatchedComplaintWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedComplaintWindowStore implements BatchedComplaintWindowStore {
  items: Map<string, BatchedComplaintWindow>;
  order: string[];

  constructor(items: Map<string, BatchedComplaintWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedComplaintWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedComplaintWindow): void {
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

  list(): BatchedComplaintWindow[] {
    const out: BatchedComplaintWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedComplaintWindowStore(): BatchedComplaintWindowStore {
  return new MemoryBatchedComplaintWindowStore(new Map<string, BatchedComplaintWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedComplaintWindowStore implements BatchedComplaintWindowStore {
  inner: BatchedComplaintWindowStore;
  cache: cache.TtlCache<BatchedComplaintWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedComplaintWindowStore,
    cacheValue: cache.TtlCache<BatchedComplaintWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedComplaintWindow | undefined {
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

  save(item: BatchedComplaintWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedComplaintWindow[] {
    return this.inner.list();
  }
}

export function newCachedBatchedComplaintWindowStore(inner: BatchedComplaintWindowStore, ttl: number, clockValue: clock.Clock): BatchedComplaintWindowStore {
  return new CachedBatchedComplaintWindowStore(
    inner,
    cache.newTtlCache<BatchedComplaintWindow>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched complaint windows. Empty fields match all. */
export class BatchedComplaintWindowQuery {
  unit: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minImpressions: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedComplaintWindow): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedComplaintWindow[]): BatchedComplaintWindow[] {
    const matched = collections.filter(items, (candidate: BatchedComplaintWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedComplaintWindows(store: BatchedComplaintWindowStore, query: BatchedComplaintWindowQuery): BatchedComplaintWindow[] {
  return query.apply(store.list());
}
