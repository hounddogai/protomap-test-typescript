import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingFrequencyAllocation } from "./rolling-frequency-allocation.js";

/** Keeps rolling frequency allocations by code. */
export interface RollingFrequencyAllocationStore {
  find(code: string): RollingFrequencyAllocation | undefined;
  save(item: RollingFrequencyAllocation): void;
  remove(code: string): boolean;
  list(): RollingFrequencyAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingFrequencyAllocationStore implements RollingFrequencyAllocationStore {
  items: Map<string, RollingFrequencyAllocation>;
  order: string[];

  constructor(items: Map<string, RollingFrequencyAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingFrequencyAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingFrequencyAllocation): void {
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

  list(): RollingFrequencyAllocation[] {
    const out: RollingFrequencyAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingFrequencyAllocationStore(): RollingFrequencyAllocationStore {
  return new MemoryRollingFrequencyAllocationStore(new Map<string, RollingFrequencyAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingFrequencyAllocationStore implements RollingFrequencyAllocationStore {
  inner: RollingFrequencyAllocationStore;
  cache: cache.TtlCache<RollingFrequencyAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingFrequencyAllocationStore,
    cacheValue: cache.TtlCache<RollingFrequencyAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingFrequencyAllocation | undefined {
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

  save(item: RollingFrequencyAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingFrequencyAllocation[] {
    return this.inner.list();
  }
}

export function newCachedRollingFrequencyAllocationStore(inner: RollingFrequencyAllocationStore, ttl: number, clockValue: clock.Clock): RollingFrequencyAllocationStore {
  return new CachedRollingFrequencyAllocationStore(
    inner,
    cache.newTtlCache<RollingFrequencyAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling frequency allocations. Empty fields match all. */
export class RollingFrequencyAllocationQuery {
  name: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBid: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingFrequencyAllocation): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingFrequencyAllocation[]): RollingFrequencyAllocation[] {
    const matched = collections.filter(items, (candidate: RollingFrequencyAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingFrequencyAllocations(store: RollingFrequencyAllocationStore, query: RollingFrequencyAllocationQuery): RollingFrequencyAllocation[] {
  return query.apply(store.list());
}
