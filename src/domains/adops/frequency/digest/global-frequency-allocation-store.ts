import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalFrequencyAllocation } from "./global-frequency-allocation.js";

/** Keeps global frequency allocations by code. */
export interface GlobalFrequencyAllocationStore {
  find(code: string): GlobalFrequencyAllocation | undefined;
  save(item: GlobalFrequencyAllocation): void;
  remove(code: string): boolean;
  list(): GlobalFrequencyAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalFrequencyAllocationStore implements GlobalFrequencyAllocationStore {
  items: Map<string, GlobalFrequencyAllocation>;
  order: string[];

  constructor(items: Map<string, GlobalFrequencyAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalFrequencyAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalFrequencyAllocation): void {
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

  list(): GlobalFrequencyAllocation[] {
    const out: GlobalFrequencyAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalFrequencyAllocationStore(): GlobalFrequencyAllocationStore {
  return new MemoryGlobalFrequencyAllocationStore(new Map<string, GlobalFrequencyAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalFrequencyAllocationStore implements GlobalFrequencyAllocationStore {
  inner: GlobalFrequencyAllocationStore;
  cache: cache.TtlCache<GlobalFrequencyAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalFrequencyAllocationStore,
    cacheValue: cache.TtlCache<GlobalFrequencyAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalFrequencyAllocation | undefined {
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

  save(item: GlobalFrequencyAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalFrequencyAllocation[] {
    return this.inner.list();
  }
}

export function newCachedGlobalFrequencyAllocationStore(inner: GlobalFrequencyAllocationStore, ttl: number, clockValue: clock.Clock): GlobalFrequencyAllocationStore {
  return new CachedGlobalFrequencyAllocationStore(
    inner,
    cache.newTtlCache<GlobalFrequencyAllocation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global frequency allocations. Empty fields match all. */
export class GlobalFrequencyAllocationQuery {
  source: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalFrequencyAllocation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalFrequencyAllocation[]): GlobalFrequencyAllocation[] {
    const matched = collections.filter(items, (candidate: GlobalFrequencyAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalFrequencyAllocations(store: GlobalFrequencyAllocationStore, query: GlobalFrequencyAllocationQuery): GlobalFrequencyAllocation[] {
  return query.apply(store.list());
}
