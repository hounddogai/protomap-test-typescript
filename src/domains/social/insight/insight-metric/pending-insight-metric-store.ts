import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingInsightMetric } from "./pending-insight-metric.js";

/** Keeps pending insight metrics by code. */
export interface PendingInsightMetricStore {
  find(code: string): PendingInsightMetric | undefined;
  save(item: PendingInsightMetric): void;
  remove(code: string): boolean;
  list(): PendingInsightMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingInsightMetricStore implements PendingInsightMetricStore {
  items: Map<string, PendingInsightMetric>;
  order: string[];

  constructor(items: Map<string, PendingInsightMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingInsightMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingInsightMetric): void {
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

  list(): PendingInsightMetric[] {
    const out: PendingInsightMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingInsightMetricStore(): PendingInsightMetricStore {
  return new MemoryPendingInsightMetricStore(new Map<string, PendingInsightMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingInsightMetricStore implements PendingInsightMetricStore {
  inner: PendingInsightMetricStore;
  cache: cache.TtlCache<PendingInsightMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingInsightMetricStore,
    cacheValue: cache.TtlCache<PendingInsightMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingInsightMetric | undefined {
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

  save(item: PendingInsightMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingInsightMetric[] {
    return this.inner.list();
  }
}

export function newCachedPendingInsightMetricStore(inner: PendingInsightMetricStore, ttl: number, clockValue: clock.Clock): PendingInsightMetricStore {
  return new CachedPendingInsightMetricStore(
    inner,
    cache.newTtlCache<PendingInsightMetric>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending insight metrics. Empty fields match all. */
export class PendingInsightMetricQuery {
  name: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minMaximum: number, statuses: string[], limit: number) {
    this.name = name;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingInsightMetric): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingInsightMetric[]): PendingInsightMetric[] {
    const matched = collections.filter(items, (candidate: PendingInsightMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingInsightMetrics(store: PendingInsightMetricStore, query: PendingInsightMetricQuery): PendingInsightMetric[] {
  return query.apply(store.list());
}
