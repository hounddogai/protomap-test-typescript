import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { AdaptiveComplaintMetric } from "./adaptive-complaint-metric.js";

/** Keeps adaptive complaint metrics by code. */
export interface AdaptiveComplaintMetricStore {
  find(code: string): AdaptiveComplaintMetric | undefined;
  save(item: AdaptiveComplaintMetric): void;
  remove(code: string): boolean;
  list(): AdaptiveComplaintMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryAdaptiveComplaintMetricStore implements AdaptiveComplaintMetricStore {
  items: Map<string, AdaptiveComplaintMetric>;
  order: string[];

  constructor(items: Map<string, AdaptiveComplaintMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): AdaptiveComplaintMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: AdaptiveComplaintMetric): void {
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

  list(): AdaptiveComplaintMetric[] {
    const out: AdaptiveComplaintMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryAdaptiveComplaintMetricStore(): AdaptiveComplaintMetricStore {
  return new MemoryAdaptiveComplaintMetricStore(new Map<string, AdaptiveComplaintMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedAdaptiveComplaintMetricStore implements AdaptiveComplaintMetricStore {
  inner: AdaptiveComplaintMetricStore;
  cache: cache.TtlCache<AdaptiveComplaintMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: AdaptiveComplaintMetricStore,
    cacheValue: cache.TtlCache<AdaptiveComplaintMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): AdaptiveComplaintMetric | undefined {
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

  save(item: AdaptiveComplaintMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): AdaptiveComplaintMetric[] {
    return this.inner.list();
  }
}

export function newCachedAdaptiveComplaintMetricStore(inner: AdaptiveComplaintMetricStore, ttl: number, clockValue: clock.Clock): AdaptiveComplaintMetricStore {
  return new CachedAdaptiveComplaintMetricStore(
    inner,
    cache.newTtlCache<AdaptiveComplaintMetric>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects adaptive complaint metrics. Empty fields match all. */
export class AdaptiveComplaintMetricQuery {
  locale: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minThreshold: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: AdaptiveComplaintMetric): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: AdaptiveComplaintMetric[]): AdaptiveComplaintMetric[] {
    const matched = collections.filter(items, (candidate: AdaptiveComplaintMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findAdaptiveComplaintMetrics(store: AdaptiveComplaintMetricStore, query: AdaptiveComplaintMetricQuery): AdaptiveComplaintMetric[] {
  return query.apply(store.list());
}
