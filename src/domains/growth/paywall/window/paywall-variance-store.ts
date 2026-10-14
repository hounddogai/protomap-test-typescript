import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallVariance } from "./paywall-variance.js";

/** Keeps paywall variances by code. */
export interface PaywallVarianceStore {
  find(code: string): PaywallVariance | undefined;
  save(item: PaywallVariance): void;
  remove(code: string): boolean;
  list(): PaywallVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallVarianceStore implements PaywallVarianceStore {
  items: Map<string, PaywallVariance>;
  order: string[];

  constructor(items: Map<string, PaywallVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallVariance): void {
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

  list(): PaywallVariance[] {
    const out: PaywallVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallVarianceStore(): PaywallVarianceStore {
  return new MemoryPaywallVarianceStore(new Map<string, PaywallVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallVarianceStore implements PaywallVarianceStore {
  inner: PaywallVarianceStore;
  cache: cache.TtlCache<PaywallVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: PaywallVarianceStore,
    cacheValue: cache.TtlCache<PaywallVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallVariance | undefined {
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

  save(item: PaywallVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallVariance[] {
    return this.inner.list();
  }
}

export function newCachedPaywallVarianceStore(inner: PaywallVarianceStore, ttl: number, clockValue: clock.Clock): PaywallVarianceStore {
  return new CachedPaywallVarianceStore(inner, cache.newTtlCache<PaywallVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects paywall variances. Empty fields match all. */
export class PaywallVarianceQuery {
  locale: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minConversionRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallVariance): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallVariance[]): PaywallVariance[] {
    const matched = collections.filter(items, (candidate: PaywallVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallVariances(store: PaywallVarianceStore, query: PaywallVarianceQuery): PaywallVariance[] {
  return query.apply(store.list());
}
