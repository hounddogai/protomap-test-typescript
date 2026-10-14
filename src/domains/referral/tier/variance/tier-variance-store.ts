import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierVariance } from "./tier-variance.js";

/** Keeps tier variances by code. */
export interface TierVarianceStore {
  find(code: string): TierVariance | undefined;
  save(item: TierVariance): void;
  remove(code: string): boolean;
  list(): TierVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierVarianceStore implements TierVarianceStore {
  items: Map<string, TierVariance>;
  order: string[];

  constructor(items: Map<string, TierVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierVariance): void {
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

  list(): TierVariance[] {
    const out: TierVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierVarianceStore(): TierVarianceStore {
  return new MemoryTierVarianceStore(new Map<string, TierVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierVarianceStore implements TierVarianceStore {
  inner: TierVarianceStore;
  cache: cache.TtlCache<TierVariance>;
  hits: number;
  misses: number;

  constructor(inner: TierVarianceStore, cacheValue: cache.TtlCache<TierVariance>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierVariance | undefined {
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

  save(item: TierVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierVariance[] {
    return this.inner.list();
  }
}

export function newCachedTierVarianceStore(inner: TierVarianceStore, ttl: number, clockValue: clock.Clock): TierVarianceStore {
  return new CachedTierVarianceStore(inner, cache.newTtlCache<TierVariance>(256, ttl, clockValue), 0, 0);
}

/** Selects tier variances. Empty fields match all. */
export class TierVarianceQuery {
  locale: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierVariance): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierVariance[]): TierVariance[] {
    const matched = collections.filter(items, (candidate: TierVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierVariances(store: TierVarianceStore, query: TierVarianceQuery): TierVariance[] {
  return query.apply(store.list());
}
