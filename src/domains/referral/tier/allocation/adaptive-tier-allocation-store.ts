import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveTierAllocation } from "./adaptive-tier-allocation.js";

/** Keeps adaptive tier allocations by code. */
export interface AdaptiveTierAllocationStore {
  find(code: string): AdaptiveTierAllocation | undefined;
  save(item: AdaptiveTierAllocation): void;
  remove(code: string): boolean;
  list(): AdaptiveTierAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveTierAllocationStore implements AdaptiveTierAllocationStore {
  items: Map<string, AdaptiveTierAllocation>;
  order: string[];

  constructor(items: Map<string, AdaptiveTierAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveTierAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveTierAllocation): void {
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

  list(): AdaptiveTierAllocation[] {
    const out: AdaptiveTierAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveTierAllocationStore(): AdaptiveTierAllocationStore {
  return new MemoryAdaptiveTierAllocationStore(new Map<string, AdaptiveTierAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveTierAllocationStore implements AdaptiveTierAllocationStore {
  inner: AdaptiveTierAllocationStore;
  cache: cache.TtlCache<AdaptiveTierAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveTierAllocationStore,
    cacheValue: cache.TtlCache<AdaptiveTierAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveTierAllocation | undefined {
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

  save(item: AdaptiveTierAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveTierAllocation[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveTierAllocationStore(inner: AdaptiveTierAllocationStore, ttl: number, clockValue: clock.Clock): AdaptiveTierAllocationStore {
  return new CachedAdaptiveTierAllocationStore(
    inner,
    cache.newTtlCache<AdaptiveTierAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive tier allocations. Empty fields match all. */
export class AdaptiveTierAllocationQuery {
  name: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minCeiling: number, statuses: string[], limit: number) {
    this.name = name;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveTierAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveTierAllocation[]): AdaptiveTierAllocation[] {
    const matched = collections.filter(items, (candidate: AdaptiveTierAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveTierAllocations(store: AdaptiveTierAllocationStore, query: AdaptiveTierAllocationQuery): AdaptiveTierAllocation[] {
  return query.apply(store.list());
}
