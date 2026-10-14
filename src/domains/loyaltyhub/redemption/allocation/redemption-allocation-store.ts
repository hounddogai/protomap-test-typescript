import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionAllocation } from "./redemption-allocation.js";

/** Keeps redemption allocations by code. */
export interface RedemptionAllocationStore {
  find(code: string): RedemptionAllocation | undefined;
  save(item: RedemptionAllocation): void;
  remove(code: string): boolean;
  list(): RedemptionAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionAllocationStore implements RedemptionAllocationStore {
  items: Map<string, RedemptionAllocation>;
  order: string[];

  constructor(items: Map<string, RedemptionAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionAllocation): void {
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

  list(): RedemptionAllocation[] {
    const out: RedemptionAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionAllocationStore(): RedemptionAllocationStore {
  return new MemoryRedemptionAllocationStore(new Map<string, RedemptionAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionAllocationStore implements RedemptionAllocationStore {
  inner: RedemptionAllocationStore;
  cache: cache.TtlCache<RedemptionAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionAllocationStore,
    cacheValue: cache.TtlCache<RedemptionAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionAllocation | undefined {
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

  save(item: RedemptionAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionAllocation[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionAllocationStore(inner: RedemptionAllocationStore, ttl: number, clockValue: clock.Clock): RedemptionAllocationStore {
  return new CachedRedemptionAllocationStore(
    inner,
    cache.newTtlCache<RedemptionAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects redemption allocations. Empty fields match all. */
export class RedemptionAllocationQuery {
  category: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRatio: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionAllocation): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionAllocation[]): RedemptionAllocation[] {
    const matched = collections.filter(items, (candidate: RedemptionAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionAllocations(store: RedemptionAllocationStore, query: RedemptionAllocationQuery): RedemptionAllocation[] {
  return query.apply(store.list());
}
