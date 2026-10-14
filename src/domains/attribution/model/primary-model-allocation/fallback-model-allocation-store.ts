import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackModelAllocation } from "./fallback-model-allocation.js";

/** Keeps fallback model allocations by code. */
export interface FallbackModelAllocationStore {
  find(code: string): FallbackModelAllocation | undefined;
  save(item: FallbackModelAllocation): void;
  remove(code: string): boolean;
  list(): FallbackModelAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackModelAllocationStore implements FallbackModelAllocationStore {
  items: Map<string, FallbackModelAllocation>;
  order: string[];

  constructor(items: Map<string, FallbackModelAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackModelAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackModelAllocation): void {
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

  list(): FallbackModelAllocation[] {
    const out: FallbackModelAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackModelAllocationStore(): FallbackModelAllocationStore {
  return new MemoryFallbackModelAllocationStore(new Map<string, FallbackModelAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackModelAllocationStore implements FallbackModelAllocationStore {
  inner: FallbackModelAllocationStore;
  cache: cache.TtlCache<FallbackModelAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackModelAllocationStore,
    cacheValue: cache.TtlCache<FallbackModelAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackModelAllocation | undefined {
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

  save(item: FallbackModelAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackModelAllocation[] {
    return this.inner.list();
  }
}

export function newCachedFallbackModelAllocationStore(inner: FallbackModelAllocationStore, ttl: number, clockValue: clock.Clock): FallbackModelAllocationStore {
  return new CachedFallbackModelAllocationStore(
    inner,
    cache.newTtlCache<FallbackModelAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback model allocations. Empty fields match all. */
export class FallbackModelAllocationQuery {
  region: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCost: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackModelAllocation): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackModelAllocation[]): FallbackModelAllocation[] {
    const matched = collections.filter(items, (candidate: FallbackModelAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackModelAllocations(store: FallbackModelAllocationStore, query: FallbackModelAllocationQuery): FallbackModelAllocation[] {
  return query.apply(store.list());
}
