import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PaywallMetric } from "./paywall-metric.js";

/** Keeps paywall metrics by code. */
export interface PaywallMetricStore {
  find(code: string): PaywallMetric | undefined;
  save(item: PaywallMetric): void;
  remove(code: string): boolean;
  list(): PaywallMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPaywallMetricStore implements PaywallMetricStore {
  items: Map<string, PaywallMetric>;
  order: string[];

  constructor(items: Map<string, PaywallMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PaywallMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PaywallMetric): void {
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

  list(): PaywallMetric[] {
    const out: PaywallMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPaywallMetricStore(): PaywallMetricStore {
  return new MemoryPaywallMetricStore(new Map<string, PaywallMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPaywallMetricStore implements PaywallMetricStore {
  inner: PaywallMetricStore;
  cache: cache.TtlCache<PaywallMetric>;
  hits: number;
  misses: number;

  constructor(inner: PaywallMetricStore, cacheValue: cache.TtlCache<PaywallMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PaywallMetric | undefined {
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

  save(item: PaywallMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PaywallMetric[] {
    return this.inner.list();
  }
}

export function newCachedPaywallMetricStore(inner: PaywallMetricStore, ttl: number, clockValue: clock.Clock): PaywallMetricStore {
  return new CachedPaywallMetricStore(inner, cache.newTtlCache<PaywallMetric>(1024, ttl, clockValue), 0, 0);
}

/** Selects paywall metrics. Empty fields match all. */
export class PaywallMetricQuery {
  channel: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minConversionRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PaywallMetric): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PaywallMetric[]): PaywallMetric[] {
    const matched = collections.filter(items, (candidate: PaywallMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPaywallMetrics(store: PaywallMetricStore, query: PaywallMetricQuery): PaywallMetric[] {
  return query.apply(store.list());
}
