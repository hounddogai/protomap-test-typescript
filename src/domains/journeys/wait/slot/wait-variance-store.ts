import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitVariance } from "./wait-variance.js";

/** Keeps wait variances by code. */
export interface WaitVarianceStore {
  find(code: string): WaitVariance | undefined;
  save(item: WaitVariance): void;
  remove(code: string): boolean;
  list(): WaitVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitVarianceStore implements WaitVarianceStore {
  items: Map<string, WaitVariance>;
  order: string[];

  constructor(items: Map<string, WaitVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitVariance): void {
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

  list(): WaitVariance[] {
    const out: WaitVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitVarianceStore(): WaitVarianceStore {
  return new MemoryWaitVarianceStore(new Map<string, WaitVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitVarianceStore implements WaitVarianceStore {
  inner: WaitVarianceStore;
  cache: cache.TtlCache<WaitVariance>;
  hits: number;
  misses: number;

  constructor(inner: WaitVarianceStore, cacheValue: cache.TtlCache<WaitVariance>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitVariance | undefined {
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

  save(item: WaitVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitVariance[] {
    return this.inner.list();
  }
}

export function newCachedWaitVarianceStore(inner: WaitVarianceStore, ttl: number, clockValue: clock.Clock): WaitVarianceStore {
  return new CachedWaitVarianceStore(inner, cache.newTtlCache<WaitVariance>(1024, ttl, clockValue), 0, 0);
}

/** Selects wait variances. Empty fields match all. */
export class WaitVarianceQuery {
  title: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minConversionRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitVariance): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitVariance[]): WaitVariance[] {
    const matched = collections.filter(items, (candidate: WaitVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitVariances(store: WaitVarianceStore, query: WaitVarianceQuery): WaitVariance[] {
  return query.apply(store.list());
}
