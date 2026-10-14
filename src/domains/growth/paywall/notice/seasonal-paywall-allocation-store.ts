import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalPaywallAllocation } from "./seasonal-paywall-allocation.js";

/** Keeps seasonal paywall allocations by code. */
export interface SeasonalPaywallAllocationStore {
  find(code: string): SeasonalPaywallAllocation | undefined;
  save(item: SeasonalPaywallAllocation): void;
  remove(code: string): boolean;
  list(): SeasonalPaywallAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalPaywallAllocationStore implements SeasonalPaywallAllocationStore {
  items: Map<string, SeasonalPaywallAllocation>;
  order: string[];

  constructor(items: Map<string, SeasonalPaywallAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalPaywallAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalPaywallAllocation): void {
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

  list(): SeasonalPaywallAllocation[] {
    const out: SeasonalPaywallAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalPaywallAllocationStore(): SeasonalPaywallAllocationStore {
  return new MemorySeasonalPaywallAllocationStore(new Map<string, SeasonalPaywallAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalPaywallAllocationStore implements SeasonalPaywallAllocationStore {
  inner: SeasonalPaywallAllocationStore;
  cache: cache.TtlCache<SeasonalPaywallAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalPaywallAllocationStore,
    cacheValue: cache.TtlCache<SeasonalPaywallAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalPaywallAllocation | undefined {
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

  save(item: SeasonalPaywallAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalPaywallAllocation[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalPaywallAllocationStore(inner: SeasonalPaywallAllocationStore, ttl: number, clockValue: clock.Clock): SeasonalPaywallAllocationStore {
  return new CachedSeasonalPaywallAllocationStore(
    inner,
    cache.newTtlCache<SeasonalPaywallAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal paywall allocations. Empty fields match all. */
export class SeasonalPaywallAllocationQuery {
  category: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCost: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalPaywallAllocation): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalPaywallAllocation[]): SeasonalPaywallAllocation[] {
    const matched = collections.filter(items, (candidate: SeasonalPaywallAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalPaywallAllocations(store: SeasonalPaywallAllocationStore, query: SeasonalPaywallAllocationQuery): SeasonalPaywallAllocation[] {
  return query.apply(store.list());
}
