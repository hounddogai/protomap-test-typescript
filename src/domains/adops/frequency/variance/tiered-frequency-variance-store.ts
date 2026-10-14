import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredFrequencyVariance } from "./tiered-frequency-variance.js";

/** Keeps tiered frequency variances by code. */
export interface TieredFrequencyVarianceStore {
  find(code: string): TieredFrequencyVariance | undefined;
  save(item: TieredFrequencyVariance): void;
  remove(code: string): boolean;
  list(): TieredFrequencyVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredFrequencyVarianceStore implements TieredFrequencyVarianceStore {
  items: Map<string, TieredFrequencyVariance>;
  order: string[];

  constructor(items: Map<string, TieredFrequencyVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredFrequencyVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredFrequencyVariance): void {
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

  list(): TieredFrequencyVariance[] {
    const out: TieredFrequencyVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredFrequencyVarianceStore(): TieredFrequencyVarianceStore {
  return new MemoryTieredFrequencyVarianceStore(new Map<string, TieredFrequencyVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredFrequencyVarianceStore implements TieredFrequencyVarianceStore {
  inner: TieredFrequencyVarianceStore;
  cache: cache.TtlCache<TieredFrequencyVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredFrequencyVarianceStore,
    cacheValue: cache.TtlCache<TieredFrequencyVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredFrequencyVariance | undefined {
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

  save(item: TieredFrequencyVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredFrequencyVariance[] {
    return this.inner.list();
  }
}

export function newCachedTieredFrequencyVarianceStore(inner: TieredFrequencyVarianceStore, ttl: number, clockValue: clock.Clock): TieredFrequencyVarianceStore {
  return new CachedTieredFrequencyVarianceStore(
    inner,
    cache.newTtlCache<TieredFrequencyVariance>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered frequency variances. Empty fields match all. */
export class TieredFrequencyVarianceQuery {
  utmSource: string;
  minDiscount: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minDiscount: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minDiscount = minDiscount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredFrequencyVariance): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.discount < this.minDiscount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredFrequencyVariance[]): TieredFrequencyVariance[] {
    const matched = collections.filter(items, (candidate: TieredFrequencyVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredFrequencyVariances(store: TieredFrequencyVarianceStore, query: TieredFrequencyVarianceQuery): TieredFrequencyVariance[] {
  return query.apply(store.list());
}
