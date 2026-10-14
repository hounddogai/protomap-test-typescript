import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyPaywallMetric } from "./legacy-paywall-metric.js";

/** Keeps legacy paywall metrics by code. */
export interface LegacyPaywallMetricStore {
  find(code: string): LegacyPaywallMetric | undefined;
  save(item: LegacyPaywallMetric): void;
  remove(code: string): boolean;
  list(): LegacyPaywallMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyPaywallMetricStore implements LegacyPaywallMetricStore {
  items: Map<string, LegacyPaywallMetric>;
  order: string[];

  constructor(items: Map<string, LegacyPaywallMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyPaywallMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyPaywallMetric): void {
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

  list(): LegacyPaywallMetric[] {
    const out: LegacyPaywallMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyPaywallMetricStore(): LegacyPaywallMetricStore {
  return new MemoryLegacyPaywallMetricStore(new Map<string, LegacyPaywallMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyPaywallMetricStore implements LegacyPaywallMetricStore {
  inner: LegacyPaywallMetricStore;
  cache: cache.TtlCache<LegacyPaywallMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyPaywallMetricStore,
    cacheValue: cache.TtlCache<LegacyPaywallMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyPaywallMetric | undefined {
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

  save(item: LegacyPaywallMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyPaywallMetric[] {
    return this.inner.list();
  }
}

export function newCachedLegacyPaywallMetricStore(inner: LegacyPaywallMetricStore, ttl: number, clockValue: clock.Clock): LegacyPaywallMetricStore {
  return new CachedLegacyPaywallMetricStore(inner, cache.newTtlCache<LegacyPaywallMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects legacy paywall metrics. Empty fields match all. */
export class LegacyPaywallMetricQuery {
  title: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minOpenRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LegacyPaywallMetric): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyPaywallMetric[]): LegacyPaywallMetric[] {
    const matched = collections.filter(items, (candidate: LegacyPaywallMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyPaywallMetrics(store: LegacyPaywallMetricStore, query: LegacyPaywallMetricQuery): LegacyPaywallMetric[] {
  return query.apply(store.list());
}
