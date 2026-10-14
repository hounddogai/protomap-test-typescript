import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedTierVariance } from "./capped-tier-variance.js";

/** Keeps capped tier variances by code. */
export interface CappedTierVarianceStore {
  find(code: string): CappedTierVariance | undefined;
  save(item: CappedTierVariance): void;
  remove(code: string): boolean;
  list(): CappedTierVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedTierVarianceStore implements CappedTierVarianceStore {
  items: Map<string, CappedTierVariance>;
  order: string[];

  constructor(items: Map<string, CappedTierVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedTierVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedTierVariance): void {
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

  list(): CappedTierVariance[] {
    const out: CappedTierVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedTierVarianceStore(): CappedTierVarianceStore {
  return new MemoryCappedTierVarianceStore(new Map<string, CappedTierVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedTierVarianceStore implements CappedTierVarianceStore {
  inner: CappedTierVarianceStore;
  cache: cache.TtlCache<CappedTierVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedTierVarianceStore,
    cacheValue: cache.TtlCache<CappedTierVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedTierVariance | undefined {
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

  save(item: CappedTierVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedTierVariance[] {
    return this.inner.list();
  }
}

export function newCachedCappedTierVarianceStore(inner: CappedTierVarianceStore, ttl: number, clockValue: clock.Clock): CappedTierVarianceStore {
  return new CachedCappedTierVarianceStore(inner, cache.newTtlCache<CappedTierVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects capped tier variances. Empty fields match all. */
export class CappedTierVarianceQuery {
  unit: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minCapacity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedTierVariance): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedTierVariance[]): CappedTierVariance[] {
    const matched = collections.filter(items, (candidate: CappedTierVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedTierVariances(store: CappedTierVarianceStore, query: CappedTierVarianceQuery): CappedTierVariance[] {
  return query.apply(store.list());
}
