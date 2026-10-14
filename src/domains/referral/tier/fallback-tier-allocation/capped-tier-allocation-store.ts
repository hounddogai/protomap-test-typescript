import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedTierAllocation } from "./capped-tier-allocation.js";

/** Keeps capped tier allocations by code. */
export interface CappedTierAllocationStore {
  find(code: string): CappedTierAllocation | undefined;
  save(item: CappedTierAllocation): void;
  remove(code: string): boolean;
  list(): CappedTierAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedTierAllocationStore implements CappedTierAllocationStore {
  items: Map<string, CappedTierAllocation>;
  order: string[];

  constructor(items: Map<string, CappedTierAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedTierAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedTierAllocation): void {
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

  list(): CappedTierAllocation[] {
    const out: CappedTierAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedTierAllocationStore(): CappedTierAllocationStore {
  return new MemoryCappedTierAllocationStore(new Map<string, CappedTierAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedTierAllocationStore implements CappedTierAllocationStore {
  inner: CappedTierAllocationStore;
  cache: cache.TtlCache<CappedTierAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedTierAllocationStore,
    cacheValue: cache.TtlCache<CappedTierAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedTierAllocation | undefined {
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

  save(item: CappedTierAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedTierAllocation[] {
    return this.inner.list();
  }
}

export function newCachedCappedTierAllocationStore(inner: CappedTierAllocationStore, ttl: number, clockValue: clock.Clock): CappedTierAllocationStore {
  return new CachedCappedTierAllocationStore(inner, cache.newTtlCache<CappedTierAllocation>(64, ttl, clockValue), 0, 0);
}

/** Selects capped tier allocations. Empty fields match all. */
export class CappedTierAllocationQuery {
  locale: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedTierAllocation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedTierAllocation[]): CappedTierAllocation[] {
    const matched = collections.filter(items, (candidate: CappedTierAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedTierAllocations(store: CappedTierAllocationStore, query: CappedTierAllocationQuery): CappedTierAllocation[] {
  return query.apply(store.list());
}
