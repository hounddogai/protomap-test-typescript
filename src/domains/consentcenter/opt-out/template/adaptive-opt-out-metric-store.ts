import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveOptOutMetric } from "./adaptive-opt-out-metric.js";

/** Keeps adaptive opt out metrics by code. */
export interface AdaptiveOptOutMetricStore {
  find(code: string): AdaptiveOptOutMetric | undefined;
  save(item: AdaptiveOptOutMetric): void;
  remove(code: string): boolean;
  list(): AdaptiveOptOutMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveOptOutMetricStore implements AdaptiveOptOutMetricStore {
  items: Map<string, AdaptiveOptOutMetric>;
  order: string[];

  constructor(items: Map<string, AdaptiveOptOutMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveOptOutMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveOptOutMetric): void {
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

  list(): AdaptiveOptOutMetric[] {
    const out: AdaptiveOptOutMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveOptOutMetricStore(): AdaptiveOptOutMetricStore {
  return new MemoryAdaptiveOptOutMetricStore(new Map<string, AdaptiveOptOutMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveOptOutMetricStore implements AdaptiveOptOutMetricStore {
  inner: AdaptiveOptOutMetricStore;
  cache: cache.TtlCache<AdaptiveOptOutMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveOptOutMetricStore,
    cacheValue: cache.TtlCache<AdaptiveOptOutMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveOptOutMetric | undefined {
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

  save(item: AdaptiveOptOutMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveOptOutMetric[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveOptOutMetricStore(inner: AdaptiveOptOutMetricStore, ttl: number, clockValue: clock.Clock): AdaptiveOptOutMetricStore {
  return new CachedAdaptiveOptOutMetricStore(
    inner,
    cache.newTtlCache<AdaptiveOptOutMetric>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive opt out metrics. Empty fields match all. */
export class AdaptiveOptOutMetricQuery {
  name: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minConversionRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveOptOutMetric): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveOptOutMetric[]): AdaptiveOptOutMetric[] {
    const matched = collections.filter(items, (candidate: AdaptiveOptOutMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveOptOutMetrics(store: AdaptiveOptOutMetricStore, query: AdaptiveOptOutMetricQuery): AdaptiveOptOutMetric[] {
  return query.apply(store.list());
}
