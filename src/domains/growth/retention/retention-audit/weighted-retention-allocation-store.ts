import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedRetentionAllocation } from "./weighted-retention-allocation.js";

/** Keeps weighted retention allocations by code. */
export interface WeightedRetentionAllocationStore {
  find(code: string): WeightedRetentionAllocation | undefined;
  save(item: WeightedRetentionAllocation): void;
  remove(code: string): boolean;
  list(): WeightedRetentionAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedRetentionAllocationStore implements WeightedRetentionAllocationStore {
  items: Map<string, WeightedRetentionAllocation>;
  order: string[];

  constructor(items: Map<string, WeightedRetentionAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedRetentionAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedRetentionAllocation): void {
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

  list(): WeightedRetentionAllocation[] {
    const out: WeightedRetentionAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedRetentionAllocationStore(): WeightedRetentionAllocationStore {
  return new MemoryWeightedRetentionAllocationStore(new Map<string, WeightedRetentionAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedRetentionAllocationStore implements WeightedRetentionAllocationStore {
  inner: WeightedRetentionAllocationStore;
  cache: cache.TtlCache<WeightedRetentionAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedRetentionAllocationStore,
    cacheValue: cache.TtlCache<WeightedRetentionAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedRetentionAllocation | undefined {
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

  save(item: WeightedRetentionAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedRetentionAllocation[] {
    return this.inner.list();
  }
}

export function newCachedWeightedRetentionAllocationStore(inner: WeightedRetentionAllocationStore, ttl: number, clockValue: clock.Clock): WeightedRetentionAllocationStore {
  return new CachedWeightedRetentionAllocationStore(
    inner,
    cache.newTtlCache<WeightedRetentionAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted retention allocations. Empty fields match all. */
export class WeightedRetentionAllocationQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedRetentionAllocation): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedRetentionAllocation[]): WeightedRetentionAllocation[] {
    const matched = collections.filter(items, (candidate: WeightedRetentionAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedRetentionAllocations(store: WeightedRetentionAllocationStore, query: WeightedRetentionAllocationQuery): WeightedRetentionAllocation[] {
  return query.apply(store.list());
}
