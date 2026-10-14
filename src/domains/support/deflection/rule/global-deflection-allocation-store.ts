import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalDeflectionAllocation } from "./global-deflection-allocation.js";

/** Keeps global deflection allocations by code. */
export interface GlobalDeflectionAllocationStore {
  find(code: string): GlobalDeflectionAllocation | undefined;
  save(item: GlobalDeflectionAllocation): void;
  remove(code: string): boolean;
  list(): GlobalDeflectionAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalDeflectionAllocationStore implements GlobalDeflectionAllocationStore {
  items: Map<string, GlobalDeflectionAllocation>;
  order: string[];

  constructor(items: Map<string, GlobalDeflectionAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalDeflectionAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalDeflectionAllocation): void {
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

  list(): GlobalDeflectionAllocation[] {
    const out: GlobalDeflectionAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalDeflectionAllocationStore(): GlobalDeflectionAllocationStore {
  return new MemoryGlobalDeflectionAllocationStore(new Map<string, GlobalDeflectionAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalDeflectionAllocationStore implements GlobalDeflectionAllocationStore {
  inner: GlobalDeflectionAllocationStore;
  cache: cache.TtlCache<GlobalDeflectionAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalDeflectionAllocationStore,
    cacheValue: cache.TtlCache<GlobalDeflectionAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalDeflectionAllocation | undefined {
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

  save(item: GlobalDeflectionAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalDeflectionAllocation[] {
    return this.inner.list();
  }
}

export function newCachedGlobalDeflectionAllocationStore(inner: GlobalDeflectionAllocationStore, ttl: number, clockValue: clock.Clock): GlobalDeflectionAllocationStore {
  return new CachedGlobalDeflectionAllocationStore(
    inner,
    cache.newTtlCache<GlobalDeflectionAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global deflection allocations. Empty fields match all. */
export class GlobalDeflectionAllocationQuery {
  country: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRetries: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalDeflectionAllocation): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalDeflectionAllocation[]): GlobalDeflectionAllocation[] {
    const matched = collections.filter(items, (candidate: GlobalDeflectionAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalDeflectionAllocations(store: GlobalDeflectionAllocationStore, query: GlobalDeflectionAllocationQuery): GlobalDeflectionAllocation[] {
  return query.apply(store.list());
}
