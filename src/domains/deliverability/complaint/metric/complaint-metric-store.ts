import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ComplaintMetric } from "./complaint-metric.js";

/** Keeps complaint metrics by code. */
export interface ComplaintMetricStore {
  find(code: string): ComplaintMetric | undefined;
  save(item: ComplaintMetric): void;
  remove(code: string): boolean;
  list(): ComplaintMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryComplaintMetricStore implements ComplaintMetricStore {
  items: Map<string, ComplaintMetric>;
  order: string[];

  constructor(items: Map<string, ComplaintMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ComplaintMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ComplaintMetric): void {
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

  list(): ComplaintMetric[] {
    const out: ComplaintMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryComplaintMetricStore(): ComplaintMetricStore {
  return new MemoryComplaintMetricStore(new Map<string, ComplaintMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedComplaintMetricStore implements ComplaintMetricStore {
  inner: ComplaintMetricStore;
  cache: cache.TtlCache<ComplaintMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: ComplaintMetricStore,
    cacheValue: cache.TtlCache<ComplaintMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ComplaintMetric | undefined {
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

  save(item: ComplaintMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ComplaintMetric[] {
    return this.inner.list();
  }
}

export function newCachedComplaintMetricStore(inner: ComplaintMetricStore, ttl: number, clockValue: clock.Clock): ComplaintMetricStore {
  return new CachedComplaintMetricStore(inner, cache.newTtlCache<ComplaintMetric>(1024, ttl, clockValue), 0, 0);
}

/** Selects complaint metrics. Empty fields match all. */
export class ComplaintMetricQuery {
  unit: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minRate: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ComplaintMetric): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ComplaintMetric[]): ComplaintMetric[] {
    const matched = collections.filter(items, (candidate: ComplaintMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findComplaintMetrics(store: ComplaintMetricStore, query: ComplaintMetricQuery): ComplaintMetric[] {
  return query.apply(store.list());
}
