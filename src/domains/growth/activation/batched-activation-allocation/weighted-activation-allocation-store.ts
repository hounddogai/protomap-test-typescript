import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedActivationAllocation } from "./weighted-activation-allocation.js";

/** Keeps weighted activation allocations by code. */
export interface WeightedActivationAllocationStore {
  find(code: string): WeightedActivationAllocation | undefined;
  save(item: WeightedActivationAllocation): void;
  remove(code: string): boolean;
  list(): WeightedActivationAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedActivationAllocationStore implements WeightedActivationAllocationStore {
  items: Map<string, WeightedActivationAllocation>;
  order: string[];

  constructor(items: Map<string, WeightedActivationAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedActivationAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedActivationAllocation): void {
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

  list(): WeightedActivationAllocation[] {
    const out: WeightedActivationAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedActivationAllocationStore(): WeightedActivationAllocationStore {
  return new MemoryWeightedActivationAllocationStore(new Map<string, WeightedActivationAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedActivationAllocationStore implements WeightedActivationAllocationStore {
  inner: WeightedActivationAllocationStore;
  cache: cache.TtlCache<WeightedActivationAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedActivationAllocationStore,
    cacheValue: cache.TtlCache<WeightedActivationAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedActivationAllocation | undefined {
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

  save(item: WeightedActivationAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedActivationAllocation[] {
    return this.inner.list();
  }
}

export function newCachedWeightedActivationAllocationStore(inner: WeightedActivationAllocationStore, ttl: number, clockValue: clock.Clock): WeightedActivationAllocationStore {
  return new CachedWeightedActivationAllocationStore(
    inner,
    cache.newTtlCache<WeightedActivationAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted activation allocations. Empty fields match all. */
export class WeightedActivationAllocationQuery {
  name: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCapacity: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedActivationAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedActivationAllocation[]): WeightedActivationAllocation[] {
    const matched = collections.filter(items, (candidate: WeightedActivationAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedActivationAllocations(store: WeightedActivationAllocationStore, query: WeightedActivationAllocationQuery): WeightedActivationAllocation[] {
  return query.apply(store.list());
}
