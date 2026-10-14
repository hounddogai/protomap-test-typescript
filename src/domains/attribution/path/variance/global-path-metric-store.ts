import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalPathMetric } from "./global-path-metric.js";

/** Keeps global path metrics by code. */
export interface GlobalPathMetricStore {
  find(code: string): GlobalPathMetric | undefined;
  save(item: GlobalPathMetric): void;
  remove(code: string): boolean;
  list(): GlobalPathMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalPathMetricStore implements GlobalPathMetricStore {
  items: Map<string, GlobalPathMetric>;
  order: string[];

  constructor(items: Map<string, GlobalPathMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalPathMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalPathMetric): void {
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

  list(): GlobalPathMetric[] {
    const out: GlobalPathMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalPathMetricStore(): GlobalPathMetricStore {
  return new MemoryGlobalPathMetricStore(new Map<string, GlobalPathMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalPathMetricStore implements GlobalPathMetricStore {
  inner: GlobalPathMetricStore;
  cache: cache.TtlCache<GlobalPathMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalPathMetricStore,
    cacheValue: cache.TtlCache<GlobalPathMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalPathMetric | undefined {
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

  save(item: GlobalPathMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalPathMetric[] {
    return this.inner.list();
  }
}

export function newCachedGlobalPathMetricStore(inner: GlobalPathMetricStore, ttl: number, clockValue: clock.Clock): GlobalPathMetricStore {
  return new CachedGlobalPathMetricStore(inner, cache.newTtlCache<GlobalPathMetric>(64, ttl, clockValue), 0, 0);
}

/** Selects global path metrics. Empty fields match all. */
export class GlobalPathMetricQuery {
  source: string;
  minDurationMinutes: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minDurationMinutes: number, statuses: string[], limit: number) {
    this.source = source;
    this.minDurationMinutes = minDurationMinutes;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalPathMetric): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.durationMinutes < this.minDurationMinutes) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalPathMetric[]): GlobalPathMetric[] {
    const matched = collections.filter(items, (candidate: GlobalPathMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalPathMetrics(store: GlobalPathMetricStore, query: GlobalPathMetricQuery): GlobalPathMetric[] {
  return query.apply(store.list());
}
