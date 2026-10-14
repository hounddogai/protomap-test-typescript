import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackQueueVariance } from "./fallback-queue-variance.js";

/** Keeps fallback queue variances by code. */
export interface FallbackQueueVarianceStore {
  find(code: string): FallbackQueueVariance | undefined;
  save(item: FallbackQueueVariance): void;
  remove(code: string): boolean;
  list(): FallbackQueueVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackQueueVarianceStore implements FallbackQueueVarianceStore {
  items: Map<string, FallbackQueueVariance>;
  order: string[];

  constructor(items: Map<string, FallbackQueueVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackQueueVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackQueueVariance): void {
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

  list(): FallbackQueueVariance[] {
    const out: FallbackQueueVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackQueueVarianceStore(): FallbackQueueVarianceStore {
  return new MemoryFallbackQueueVarianceStore(new Map<string, FallbackQueueVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackQueueVarianceStore implements FallbackQueueVarianceStore {
  inner: FallbackQueueVarianceStore;
  cache: cache.TtlCache<FallbackQueueVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackQueueVarianceStore,
    cacheValue: cache.TtlCache<FallbackQueueVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackQueueVariance | undefined {
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

  save(item: FallbackQueueVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackQueueVariance[] {
    return this.inner.list();
  }
}

export function newCachedFallbackQueueVarianceStore(inner: FallbackQueueVarianceStore, ttl: number, clockValue: clock.Clock): FallbackQueueVarianceStore {
  return new CachedFallbackQueueVarianceStore(
    inner,
    cache.newTtlCache<FallbackQueueVariance>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback queue variances. Empty fields match all. */
export class FallbackQueueVarianceQuery {
  locale: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMargin: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackQueueVariance): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackQueueVariance[]): FallbackQueueVariance[] {
    const matched = collections.filter(items, (candidate: FallbackQueueVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackQueueVariances(store: FallbackQueueVarianceStore, query: FallbackQueueVarianceQuery): FallbackQueueVariance[] {
  return query.apply(store.list());
}
