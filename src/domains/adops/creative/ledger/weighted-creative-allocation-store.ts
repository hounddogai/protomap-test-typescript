import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedCreativeAllocation } from "./weighted-creative-allocation.js";

/** Keeps weighted creative allocations by code. */
export interface WeightedCreativeAllocationStore {
  find(code: string): WeightedCreativeAllocation | undefined;
  save(item: WeightedCreativeAllocation): void;
  remove(code: string): boolean;
  list(): WeightedCreativeAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedCreativeAllocationStore implements WeightedCreativeAllocationStore {
  items: Map<string, WeightedCreativeAllocation>;
  order: string[];

  constructor(items: Map<string, WeightedCreativeAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedCreativeAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedCreativeAllocation): void {
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

  list(): WeightedCreativeAllocation[] {
    const out: WeightedCreativeAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedCreativeAllocationStore(): WeightedCreativeAllocationStore {
  return new MemoryWeightedCreativeAllocationStore(new Map<string, WeightedCreativeAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedCreativeAllocationStore implements WeightedCreativeAllocationStore {
  inner: WeightedCreativeAllocationStore;
  cache: cache.TtlCache<WeightedCreativeAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedCreativeAllocationStore,
    cacheValue: cache.TtlCache<WeightedCreativeAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedCreativeAllocation | undefined {
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

  save(item: WeightedCreativeAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedCreativeAllocation[] {
    return this.inner.list();
  }
}

export function newCachedWeightedCreativeAllocationStore(inner: WeightedCreativeAllocationStore, ttl: number, clockValue: clock.Clock): WeightedCreativeAllocationStore {
  return new CachedWeightedCreativeAllocationStore(
    inner,
    cache.newTtlCache<WeightedCreativeAllocation>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted creative allocations. Empty fields match all. */
export class WeightedCreativeAllocationQuery {
  locale: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minClicks: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedCreativeAllocation): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedCreativeAllocation[]): WeightedCreativeAllocation[] {
    const matched = collections.filter(items, (candidate: WeightedCreativeAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedCreativeAllocations(store: WeightedCreativeAllocationStore, query: WeightedCreativeAllocationQuery): WeightedCreativeAllocation[] {
  return query.apply(store.list());
}
