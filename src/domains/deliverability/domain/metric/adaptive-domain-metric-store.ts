import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveDomainMetric } from "./adaptive-domain-metric.js";

/** Keeps adaptive domain metrics by code. */
export interface AdaptiveDomainMetricStore {
  find(code: string): AdaptiveDomainMetric | undefined;
  save(item: AdaptiveDomainMetric): void;
  remove(code: string): boolean;
  list(): AdaptiveDomainMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveDomainMetricStore implements AdaptiveDomainMetricStore {
  items: Map<string, AdaptiveDomainMetric>;
  order: string[];

  constructor(items: Map<string, AdaptiveDomainMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveDomainMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveDomainMetric): void {
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

  list(): AdaptiveDomainMetric[] {
    const out: AdaptiveDomainMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveDomainMetricStore(): AdaptiveDomainMetricStore {
  return new MemoryAdaptiveDomainMetricStore(new Map<string, AdaptiveDomainMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveDomainMetricStore implements AdaptiveDomainMetricStore {
  inner: AdaptiveDomainMetricStore;
  cache: cache.TtlCache<AdaptiveDomainMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveDomainMetricStore,
    cacheValue: cache.TtlCache<AdaptiveDomainMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveDomainMetric | undefined {
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

  save(item: AdaptiveDomainMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveDomainMetric[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveDomainMetricStore(inner: AdaptiveDomainMetricStore, ttl: number, clockValue: clock.Clock): AdaptiveDomainMetricStore {
  return new CachedAdaptiveDomainMetricStore(
    inner,
    cache.newTtlCache<AdaptiveDomainMetric>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive domain metrics. Empty fields match all. */
export class AdaptiveDomainMetricQuery {
  utmSource: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minMargin: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveDomainMetric): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveDomainMetric[]): AdaptiveDomainMetric[] {
    const matched = collections.filter(items, (candidate: AdaptiveDomainMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveDomainMetrics(store: AdaptiveDomainMetricStore, query: AdaptiveDomainMetricQuery): AdaptiveDomainMetric[] {
  return query.apply(store.list());
}
