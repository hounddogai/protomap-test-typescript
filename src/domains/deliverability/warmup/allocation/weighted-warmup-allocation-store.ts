import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedWarmupAllocation } from "./weighted-warmup-allocation.js";

/** Keeps weighted warmup allocations by code. */
export interface WeightedWarmupAllocationStore {
  find(code: string): WeightedWarmupAllocation | undefined;
  save(item: WeightedWarmupAllocation): void;
  remove(code: string): boolean;
  list(): WeightedWarmupAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedWarmupAllocationStore implements WeightedWarmupAllocationStore {
  items: Map<string, WeightedWarmupAllocation>;
  order: string[];

  constructor(items: Map<string, WeightedWarmupAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedWarmupAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedWarmupAllocation): void {
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

  list(): WeightedWarmupAllocation[] {
    const out: WeightedWarmupAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedWarmupAllocationStore(): WeightedWarmupAllocationStore {
  return new MemoryWeightedWarmupAllocationStore(new Map<string, WeightedWarmupAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedWarmupAllocationStore implements WeightedWarmupAllocationStore {
  inner: WeightedWarmupAllocationStore;
  cache: cache.TtlCache<WeightedWarmupAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedWarmupAllocationStore,
    cacheValue: cache.TtlCache<WeightedWarmupAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedWarmupAllocation | undefined {
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

  save(item: WeightedWarmupAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedWarmupAllocation[] {
    return this.inner.list();
  }
}

export function newCachedWeightedWarmupAllocationStore(inner: WeightedWarmupAllocationStore, ttl: number, clockValue: clock.Clock): WeightedWarmupAllocationStore {
  return new CachedWeightedWarmupAllocationStore(
    inner,
    cache.newTtlCache<WeightedWarmupAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted warmup allocations. Empty fields match all. */
export class WeightedWarmupAllocationQuery {
  category: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAmount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedWarmupAllocation): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedWarmupAllocation[]): WeightedWarmupAllocation[] {
    const matched = collections.filter(items, (candidate: WeightedWarmupAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedWarmupAllocations(store: WeightedWarmupAllocationStore, query: WeightedWarmupAllocationQuery): WeightedWarmupAllocation[] {
  return query.apply(store.list());
}
