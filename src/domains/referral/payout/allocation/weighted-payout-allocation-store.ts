import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPayoutAllocation } from "./weighted-payout-allocation.js";

/** Keeps weighted payout allocations by code. */
export interface WeightedPayoutAllocationStore {
  find(code: string): WeightedPayoutAllocation | undefined;
  save(item: WeightedPayoutAllocation): void;
  remove(code: string): boolean;
  list(): WeightedPayoutAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPayoutAllocationStore implements WeightedPayoutAllocationStore {
  items: Map<string, WeightedPayoutAllocation>;
  order: string[];

  constructor(items: Map<string, WeightedPayoutAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPayoutAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPayoutAllocation): void {
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

  list(): WeightedPayoutAllocation[] {
    const out: WeightedPayoutAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPayoutAllocationStore(): WeightedPayoutAllocationStore {
  return new MemoryWeightedPayoutAllocationStore(new Map<string, WeightedPayoutAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPayoutAllocationStore implements WeightedPayoutAllocationStore {
  inner: WeightedPayoutAllocationStore;
  cache: cache.TtlCache<WeightedPayoutAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPayoutAllocationStore,
    cacheValue: cache.TtlCache<WeightedPayoutAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPayoutAllocation | undefined {
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

  save(item: WeightedPayoutAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPayoutAllocation[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPayoutAllocationStore(inner: WeightedPayoutAllocationStore, ttl: number, clockValue: clock.Clock): WeightedPayoutAllocationStore {
  return new CachedWeightedPayoutAllocationStore(
    inner,
    cache.newTtlCache<WeightedPayoutAllocation>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted payout allocations. Empty fields match all. */
export class WeightedPayoutAllocationQuery {
  source: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBid: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPayoutAllocation): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPayoutAllocation[]): WeightedPayoutAllocation[] {
    const matched = collections.filter(items, (candidate: WeightedPayoutAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPayoutAllocations(store: WeightedPayoutAllocationStore, query: WeightedPayoutAllocationQuery): WeightedPayoutAllocation[] {
  return query.apply(store.list());
}
