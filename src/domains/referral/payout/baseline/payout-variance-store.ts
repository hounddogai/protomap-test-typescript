import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PayoutVariance } from "./payout-variance.js";

/** Keeps payout variances by code. */
export interface PayoutVarianceStore {
  find(code: string): PayoutVariance | undefined;
  save(item: PayoutVariance): void;
  remove(code: string): boolean;
  list(): PayoutVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPayoutVarianceStore implements PayoutVarianceStore {
  items: Map<string, PayoutVariance>;
  order: string[];

  constructor(items: Map<string, PayoutVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PayoutVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PayoutVariance): void {
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

  list(): PayoutVariance[] {
    const out: PayoutVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPayoutVarianceStore(): PayoutVarianceStore {
  return new MemoryPayoutVarianceStore(new Map<string, PayoutVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPayoutVarianceStore implements PayoutVarianceStore {
  inner: PayoutVarianceStore;
  cache: cache.TtlCache<PayoutVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: PayoutVarianceStore,
    cacheValue: cache.TtlCache<PayoutVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PayoutVariance | undefined {
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

  save(item: PayoutVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PayoutVariance[] {
    return this.inner.list();
  }
}

export function newCachedPayoutVarianceStore(inner: PayoutVarianceStore, ttl: number, clockValue: clock.Clock): PayoutVarianceStore {
  return new CachedPayoutVarianceStore(inner, cache.newTtlCache<PayoutVariance>(128, ttl, clockValue), 0, 0);
}

/** Selects payout variances. Empty fields match all. */
export class PayoutVarianceQuery {
  title: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PayoutVariance): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PayoutVariance[]): PayoutVariance[] {
    const matched = collections.filter(items, (candidate: PayoutVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPayoutVariances(store: PayoutVarianceStore, query: PayoutVarianceQuery): PayoutVariance[] {
  return query.apply(store.list());
}
