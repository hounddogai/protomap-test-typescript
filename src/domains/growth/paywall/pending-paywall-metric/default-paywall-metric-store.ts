import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultPaywallMetric } from "./default-paywall-metric.js";

/** Keeps default paywall metrics by code. */
export interface DefaultPaywallMetricStore {
  find(code: string): DefaultPaywallMetric | undefined;
  save(item: DefaultPaywallMetric): void;
  remove(code: string): boolean;
  list(): DefaultPaywallMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultPaywallMetricStore implements DefaultPaywallMetricStore {
  items: Map<string, DefaultPaywallMetric>;
  order: string[];

  constructor(items: Map<string, DefaultPaywallMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultPaywallMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultPaywallMetric): void {
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

  list(): DefaultPaywallMetric[] {
    const out: DefaultPaywallMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultPaywallMetricStore(): DefaultPaywallMetricStore {
  return new MemoryDefaultPaywallMetricStore(new Map<string, DefaultPaywallMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultPaywallMetricStore implements DefaultPaywallMetricStore {
  inner: DefaultPaywallMetricStore;
  cache: cache.TtlCache<DefaultPaywallMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultPaywallMetricStore,
    cacheValue: cache.TtlCache<DefaultPaywallMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultPaywallMetric | undefined {
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

  save(item: DefaultPaywallMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultPaywallMetric[] {
    return this.inner.list();
  }
}

export function newCachedDefaultPaywallMetricStore(inner: DefaultPaywallMetricStore, ttl: number, clockValue: clock.Clock): DefaultPaywallMetricStore {
  return new CachedDefaultPaywallMetricStore(
    inner,
    cache.newTtlCache<DefaultPaywallMetric>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default paywall metrics. Empty fields match all. */
export class DefaultPaywallMetricQuery {
  country: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minRevision: number, statuses: string[], limit: number) {
    this.country = country;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultPaywallMetric): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultPaywallMetric[]): DefaultPaywallMetric[] {
    const matched = collections.filter(items, (candidate: DefaultPaywallMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultPaywallMetrics(store: DefaultPaywallMetricStore, query: DefaultPaywallMetricQuery): DefaultPaywallMetric[] {
  return query.apply(store.list());
}
