import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardAllocation } from "./reward-allocation.js";

/** Keeps reward allocations by code. */
export interface RewardAllocationStore {
  find(code: string): RewardAllocation | undefined;
  save(item: RewardAllocation): void;
  remove(code: string): boolean;
  list(): RewardAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardAllocationStore implements RewardAllocationStore {
  items: Map<string, RewardAllocation>;
  order: string[];

  constructor(items: Map<string, RewardAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardAllocation): void {
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

  list(): RewardAllocation[] {
    const out: RewardAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardAllocationStore(): RewardAllocationStore {
  return new MemoryRewardAllocationStore(new Map<string, RewardAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardAllocationStore implements RewardAllocationStore {
  inner: RewardAllocationStore;
  cache: cache.TtlCache<RewardAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardAllocationStore,
    cacheValue: cache.TtlCache<RewardAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardAllocation | undefined {
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

  save(item: RewardAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardAllocation[] {
    return this.inner.list();
  }
}

export function newCachedRewardAllocationStore(inner: RewardAllocationStore, ttl: number, clockValue: clock.Clock): RewardAllocationStore {
  return new CachedRewardAllocationStore(inner, cache.newTtlCache<RewardAllocation>(256, ttl, clockValue), 0, 0);
}

/** Selects reward allocations. Empty fields match all. */
export class RewardAllocationQuery {
  country: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minDiscount: number, statuses: string[], limit: number) {
    this.country = country;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardAllocation): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardAllocation[]): RewardAllocation[] {
    const matched = collections.filter(items, (candidate: RewardAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardAllocations(store: RewardAllocationStore, query: RewardAllocationQuery): RewardAllocation[] {
  return query.apply(store.list());
}
