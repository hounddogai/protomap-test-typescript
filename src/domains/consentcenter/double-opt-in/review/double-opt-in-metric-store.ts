import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInMetric } from "./double-opt-in-metric.js";

/** Keeps double opt in metrics by code. */
export interface DoubleOptInMetricStore {
  find(code: string): DoubleOptInMetric | undefined;
  save(item: DoubleOptInMetric): void;
  remove(code: string): boolean;
  list(): DoubleOptInMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInMetricStore implements DoubleOptInMetricStore {
  items: Map<string, DoubleOptInMetric>;
  order: string[];

  constructor(items: Map<string, DoubleOptInMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInMetric): void {
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

  list(): DoubleOptInMetric[] {
    const out: DoubleOptInMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInMetricStore(): DoubleOptInMetricStore {
  return new MemoryDoubleOptInMetricStore(new Map<string, DoubleOptInMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInMetricStore implements DoubleOptInMetricStore {
  inner: DoubleOptInMetricStore;
  cache: cache.TtlCache<DoubleOptInMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInMetricStore,
    cacheValue: cache.TtlCache<DoubleOptInMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInMetric | undefined {
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

  save(item: DoubleOptInMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInMetric[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInMetricStore(inner: DoubleOptInMetricStore, ttl: number, clockValue: clock.Clock): DoubleOptInMetricStore {
  return new CachedDoubleOptInMetricStore(inner, cache.newTtlCache<DoubleOptInMetric>(1024, ttl, clockValue), 0, 0);
}

/** Selects double opt in metrics. Empty fields match all. */
export class DoubleOptInMetricQuery {
  region: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCeiling: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInMetric): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInMetric[]): DoubleOptInMetric[] {
    const matched = collections.filter(items, (candidate: DoubleOptInMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInMetrics(store: DoubleOptInMetricStore, query: DoubleOptInMetricQuery): DoubleOptInMetric[] {
  return query.apply(store.list());
}
