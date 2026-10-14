import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredModelVariance } from "./tiered-model-variance.js";

/** Keeps tiered model variances by code. */
export interface TieredModelVarianceStore {
  find(code: string): TieredModelVariance | undefined;
  save(item: TieredModelVariance): void;
  remove(code: string): boolean;
  list(): TieredModelVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredModelVarianceStore implements TieredModelVarianceStore {
  items: Map<string, TieredModelVariance>;
  order: string[];

  constructor(items: Map<string, TieredModelVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredModelVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredModelVariance): void {
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

  list(): TieredModelVariance[] {
    const out: TieredModelVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredModelVarianceStore(): TieredModelVarianceStore {
  return new MemoryTieredModelVarianceStore(new Map<string, TieredModelVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredModelVarianceStore implements TieredModelVarianceStore {
  inner: TieredModelVarianceStore;
  cache: cache.TtlCache<TieredModelVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredModelVarianceStore,
    cacheValue: cache.TtlCache<TieredModelVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredModelVariance | undefined {
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

  save(item: TieredModelVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredModelVariance[] {
    return this.inner.list();
  }
}

export function newCachedTieredModelVarianceStore(inner: TieredModelVarianceStore, ttl: number, clockValue: clock.Clock): TieredModelVarianceStore {
  return new CachedTieredModelVarianceStore(inner, cache.newTtlCache<TieredModelVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects tiered model variances. Empty fields match all. */
export class TieredModelVarianceQuery {
  title: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCeiling: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredModelVariance): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredModelVariance[]): TieredModelVariance[] {
    const matched = collections.filter(items, (candidate: TieredModelVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredModelVariances(store: TieredModelVarianceStore, query: TieredModelVarianceQuery): TieredModelVariance[] {
  return query.apply(store.list());
}
