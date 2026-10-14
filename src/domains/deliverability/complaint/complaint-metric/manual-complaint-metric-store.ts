import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualComplaintMetric } from "./manual-complaint-metric.js";

/** Keeps manual complaint metrics by code. */
export interface ManualComplaintMetricStore {
  find(code: string): ManualComplaintMetric | undefined;
  save(item: ManualComplaintMetric): void;
  remove(code: string): boolean;
  list(): ManualComplaintMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualComplaintMetricStore implements ManualComplaintMetricStore {
  items: Map<string, ManualComplaintMetric>;
  order: string[];

  constructor(items: Map<string, ManualComplaintMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualComplaintMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualComplaintMetric): void {
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

  list(): ManualComplaintMetric[] {
    const out: ManualComplaintMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualComplaintMetricStore(): ManualComplaintMetricStore {
  return new MemoryManualComplaintMetricStore(new Map<string, ManualComplaintMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualComplaintMetricStore implements ManualComplaintMetricStore {
  inner: ManualComplaintMetricStore;
  cache: cache.TtlCache<ManualComplaintMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualComplaintMetricStore,
    cacheValue: cache.TtlCache<ManualComplaintMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualComplaintMetric | undefined {
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

  save(item: ManualComplaintMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualComplaintMetric[] {
    return this.inner.list();
  }
}

export function newCachedManualComplaintMetricStore(inner: ManualComplaintMetricStore, ttl: number, clockValue: clock.Clock): ManualComplaintMetricStore {
  return new CachedManualComplaintMetricStore(
    inner,
    cache.newTtlCache<ManualComplaintMetric>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual complaint metrics. Empty fields match all. */
export class ManualComplaintMetricQuery {
  category: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minPriority: number, statuses: string[], limit: number) {
    this.category = category;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualComplaintMetric): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualComplaintMetric[]): ManualComplaintMetric[] {
    const matched = collections.filter(items, (candidate: ManualComplaintMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualComplaintMetrics(store: ManualComplaintMetricStore, query: ManualComplaintMetricQuery): ManualComplaintMetric[] {
  return query.apply(store.list());
}
