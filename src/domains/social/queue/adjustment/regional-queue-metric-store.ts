import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalQueueMetric } from "./regional-queue-metric.js";

/** Keeps regional queue metrics by code. */
export interface RegionalQueueMetricStore {
  find(code: string): RegionalQueueMetric | undefined;
  save(item: RegionalQueueMetric): void;
  remove(code: string): boolean;
  list(): RegionalQueueMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalQueueMetricStore implements RegionalQueueMetricStore {
  items: Map<string, RegionalQueueMetric>;
  order: string[];

  constructor(items: Map<string, RegionalQueueMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalQueueMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalQueueMetric): void {
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

  list(): RegionalQueueMetric[] {
    const out: RegionalQueueMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalQueueMetricStore(): RegionalQueueMetricStore {
  return new MemoryRegionalQueueMetricStore(new Map<string, RegionalQueueMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalQueueMetricStore implements RegionalQueueMetricStore {
  inner: RegionalQueueMetricStore;
  cache: cache.TtlCache<RegionalQueueMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalQueueMetricStore,
    cacheValue: cache.TtlCache<RegionalQueueMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalQueueMetric | undefined {
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

  save(item: RegionalQueueMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalQueueMetric[] {
    return this.inner.list();
  }
}

export function newCachedRegionalQueueMetricStore(inner: RegionalQueueMetricStore, ttl: number, clockValue: clock.Clock): RegionalQueueMetricStore {
  return new CachedRegionalQueueMetricStore(inner, cache.newTtlCache<RegionalQueueMetric>(64, ttl, clockValue), 0, 0);
}

/** Selects regional queue metrics. Empty fields match all. */
export class RegionalQueueMetricQuery {
  title: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minEndsAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalQueueMetric): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalQueueMetric[]): RegionalQueueMetric[] {
    const matched = collections.filter(items, (candidate: RegionalQueueMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalQueueMetrics(store: RegionalQueueMetricStore, query: RegionalQueueMetricQuery): RegionalQueueMetric[] {
  return query.apply(store.list());
}
