import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionVariance } from "./redemption-variance.js";

/** Keeps redemption variances by code. */
export interface RedemptionVarianceStore {
  find(code: string): RedemptionVariance | undefined;
  save(item: RedemptionVariance): void;
  remove(code: string): boolean;
  list(): RedemptionVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionVarianceStore implements RedemptionVarianceStore {
  items: Map<string, RedemptionVariance>;
  order: string[];

  constructor(items: Map<string, RedemptionVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionVariance): void {
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

  list(): RedemptionVariance[] {
    const out: RedemptionVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionVarianceStore(): RedemptionVarianceStore {
  return new MemoryRedemptionVarianceStore(new Map<string, RedemptionVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionVarianceStore implements RedemptionVarianceStore {
  inner: RedemptionVarianceStore;
  cache: cache.TtlCache<RedemptionVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionVarianceStore,
    cacheValue: cache.TtlCache<RedemptionVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionVariance | undefined {
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

  save(item: RedemptionVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionVariance[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionVarianceStore(inner: RedemptionVarianceStore, ttl: number, clockValue: clock.Clock): RedemptionVarianceStore {
  return new CachedRedemptionVarianceStore(inner, cache.newTtlCache<RedemptionVariance>(64, ttl, clockValue), 0, 0);
}

/** Selects redemption variances. Empty fields match all. */
export class RedemptionVarianceQuery {
  name: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minEndsAt: number, statuses: string[], limit: number) {
    this.name = name;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionVariance[]): RedemptionVariance[] {
    const matched = collections.filter(items, (candidate: RedemptionVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionVariances(store: RedemptionVarianceStore, query: RedemptionVarianceQuery): RedemptionVariance[] {
  return query.apply(store.list());
}
