import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SubscriptionVariance } from "./subscription-variance.js";

/** Keeps subscription variances by code. */
export interface SubscriptionVarianceStore {
  find(code: string): SubscriptionVariance | undefined;
  save(item: SubscriptionVariance): void;
  remove(code: string): boolean;
  list(): SubscriptionVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySubscriptionVarianceStore implements SubscriptionVarianceStore {
  items: Map<string, SubscriptionVariance>;
  order: string[];

  constructor(items: Map<string, SubscriptionVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SubscriptionVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SubscriptionVariance): void {
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

  list(): SubscriptionVariance[] {
    const out: SubscriptionVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySubscriptionVarianceStore(): SubscriptionVarianceStore {
  return new MemorySubscriptionVarianceStore(new Map<string, SubscriptionVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSubscriptionVarianceStore implements SubscriptionVarianceStore {
  inner: SubscriptionVarianceStore;
  cache: cache.TtlCache<SubscriptionVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: SubscriptionVarianceStore,
    cacheValue: cache.TtlCache<SubscriptionVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SubscriptionVariance | undefined {
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

  save(item: SubscriptionVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SubscriptionVariance[] {
    return this.inner.list();
  }
}

export function newCachedSubscriptionVarianceStore(inner: SubscriptionVarianceStore, ttl: number, clockValue: clock.Clock): SubscriptionVarianceStore {
  return new CachedSubscriptionVarianceStore(
    inner,
    cache.newTtlCache<SubscriptionVariance>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects subscription variances. Empty fields match all. */
export class SubscriptionVarianceQuery {
  source: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minMinimum: number, statuses: string[], limit: number) {
    this.source = source;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SubscriptionVariance): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SubscriptionVariance[]): SubscriptionVariance[] {
    const matched = collections.filter(items, (candidate: SubscriptionVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSubscriptionVariances(store: SubscriptionVarianceStore, query: SubscriptionVarianceQuery): SubscriptionVariance[] {
  return query.apply(store.list());
}
