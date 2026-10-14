import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WarmupVariance } from "./warmup-variance.js";

/** Keeps warmup variances by code. */
export interface WarmupVarianceStore {
  find(code: string): WarmupVariance | undefined;
  save(item: WarmupVariance): void;
  remove(code: string): boolean;
  list(): WarmupVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWarmupVarianceStore implements WarmupVarianceStore {
  items: Map<string, WarmupVariance>;
  order: string[];

  constructor(items: Map<string, WarmupVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WarmupVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WarmupVariance): void {
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

  list(): WarmupVariance[] {
    const out: WarmupVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWarmupVarianceStore(): WarmupVarianceStore {
  return new MemoryWarmupVarianceStore(new Map<string, WarmupVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWarmupVarianceStore implements WarmupVarianceStore {
  inner: WarmupVarianceStore;
  cache: cache.TtlCache<WarmupVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: WarmupVarianceStore,
    cacheValue: cache.TtlCache<WarmupVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WarmupVariance | undefined {
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

  save(item: WarmupVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WarmupVariance[] {
    return this.inner.list();
  }
}

export function newCachedWarmupVarianceStore(inner: WarmupVarianceStore, ttl: number, clockValue: clock.Clock): WarmupVarianceStore {
  return new CachedWarmupVarianceStore(inner, cache.newTtlCache<WarmupVariance>(1024, ttl, clockValue), 0, 0);
}

/** Selects warmup variances. Empty fields match all. */
export class WarmupVarianceQuery {
  category: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minWeight: number, statuses: string[], limit: number) {
    this.category = category;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WarmupVariance): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WarmupVariance[]): WarmupVariance[] {
    const matched = collections.filter(items, (candidate: WarmupVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWarmupVariances(store: WarmupVarianceStore, query: WarmupVarianceQuery): WarmupVariance[] {
  return query.apply(store.list());
}
