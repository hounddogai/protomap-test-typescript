import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredBounceAllocation } from "./tiered-bounce-allocation.js";

/** Keeps tiered bounce allocations by code. */
export interface TieredBounceAllocationStore {
  find(code: string): TieredBounceAllocation | undefined;
  save(item: TieredBounceAllocation): void;
  remove(code: string): boolean;
  list(): TieredBounceAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredBounceAllocationStore implements TieredBounceAllocationStore {
  items: Map<string, TieredBounceAllocation>;
  order: string[];

  constructor(items: Map<string, TieredBounceAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredBounceAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredBounceAllocation): void {
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

  list(): TieredBounceAllocation[] {
    const out: TieredBounceAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredBounceAllocationStore(): TieredBounceAllocationStore {
  return new MemoryTieredBounceAllocationStore(new Map<string, TieredBounceAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredBounceAllocationStore implements TieredBounceAllocationStore {
  inner: TieredBounceAllocationStore;
  cache: cache.TtlCache<TieredBounceAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredBounceAllocationStore,
    cacheValue: cache.TtlCache<TieredBounceAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredBounceAllocation | undefined {
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

  save(item: TieredBounceAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredBounceAllocation[] {
    return this.inner.list();
  }
}

export function newCachedTieredBounceAllocationStore(inner: TieredBounceAllocationStore, ttl: number, clockValue: clock.Clock): TieredBounceAllocationStore {
  return new CachedTieredBounceAllocationStore(
    inner,
    cache.newTtlCache<TieredBounceAllocation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered bounce allocations. Empty fields match all. */
export class TieredBounceAllocationQuery {
  name: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRetries: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredBounceAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredBounceAllocation[]): TieredBounceAllocation[] {
    const matched = collections.filter(items, (candidate: TieredBounceAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredBounceAllocations(store: TieredBounceAllocationStore, query: TieredBounceAllocationQuery): TieredBounceAllocation[] {
  return query.apply(store.list());
}
