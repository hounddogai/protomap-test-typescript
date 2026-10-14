import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryRedemptionVariance } from "./primary-redemption-variance.js";

/** Keeps primary redemption variances by code. */
export interface PrimaryRedemptionVarianceStore {
  find(code: string): PrimaryRedemptionVariance | undefined;
  save(item: PrimaryRedemptionVariance): void;
  remove(code: string): boolean;
  list(): PrimaryRedemptionVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryRedemptionVarianceStore implements PrimaryRedemptionVarianceStore {
  items: Map<string, PrimaryRedemptionVariance>;
  order: string[];

  constructor(items: Map<string, PrimaryRedemptionVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryRedemptionVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryRedemptionVariance): void {
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

  list(): PrimaryRedemptionVariance[] {
    const out: PrimaryRedemptionVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryRedemptionVarianceStore(): PrimaryRedemptionVarianceStore {
  return new MemoryPrimaryRedemptionVarianceStore(new Map<string, PrimaryRedemptionVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryRedemptionVarianceStore implements PrimaryRedemptionVarianceStore {
  inner: PrimaryRedemptionVarianceStore;
  cache: cache.TtlCache<PrimaryRedemptionVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryRedemptionVarianceStore,
    cacheValue: cache.TtlCache<PrimaryRedemptionVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryRedemptionVariance | undefined {
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

  save(item: PrimaryRedemptionVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryRedemptionVariance[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryRedemptionVarianceStore(inner: PrimaryRedemptionVarianceStore, ttl: number, clockValue: clock.Clock): PrimaryRedemptionVarianceStore {
  return new CachedPrimaryRedemptionVarianceStore(
    inner,
    cache.newTtlCache<PrimaryRedemptionVariance>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary redemption variances. Empty fields match all. */
export class PrimaryRedemptionVarianceQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryRedemptionVariance): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryRedemptionVariance[]): PrimaryRedemptionVariance[] {
    const matched = collections.filter(items, (candidate: PrimaryRedemptionVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryRedemptionVariances(store: PrimaryRedemptionVarianceStore, query: PrimaryRedemptionVarianceQuery): PrimaryRedemptionVariance[] {
  return query.apply(store.list());
}
