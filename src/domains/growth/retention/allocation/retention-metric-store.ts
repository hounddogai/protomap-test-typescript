import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RetentionMetric } from "./retention-metric.js";

/** Keeps retention metrics by code. */
export interface RetentionMetricStore {
  find(code: string): RetentionMetric | undefined;
  save(item: RetentionMetric): void;
  remove(code: string): boolean;
  list(): RetentionMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRetentionMetricStore implements RetentionMetricStore {
  items: Map<string, RetentionMetric>;
  order: string[];

  constructor(items: Map<string, RetentionMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RetentionMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RetentionMetric): void {
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

  list(): RetentionMetric[] {
    const out: RetentionMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRetentionMetricStore(): RetentionMetricStore {
  return new MemoryRetentionMetricStore(new Map<string, RetentionMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRetentionMetricStore implements RetentionMetricStore {
  inner: RetentionMetricStore;
  cache: cache.TtlCache<RetentionMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: RetentionMetricStore,
    cacheValue: cache.TtlCache<RetentionMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RetentionMetric | undefined {
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

  save(item: RetentionMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RetentionMetric[] {
    return this.inner.list();
  }
}

export function newCachedRetentionMetricStore(inner: RetentionMetricStore, ttl: number, clockValue: clock.Clock): RetentionMetricStore {
  return new CachedRetentionMetricStore(inner, cache.newTtlCache<RetentionMetric>(128, ttl, clockValue), 0, 0);
}

/** Selects retention metrics. Empty fields match all. */
export class RetentionMetricQuery {
  name: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minRevision: number, statuses: string[], limit: number) {
    this.name = name;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RetentionMetric): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RetentionMetric[]): RetentionMetric[] {
    const matched = collections.filter(items, (candidate: RetentionMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRetentionMetrics(store: RetentionMetricStore, query: RetentionMetricQuery): RetentionMetric[] {
  return query.apply(store.list());
}
