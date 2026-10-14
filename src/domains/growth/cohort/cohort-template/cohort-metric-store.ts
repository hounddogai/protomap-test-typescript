import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortMetric } from "./cohort-metric.js";

/** Keeps cohort metrics by code. */
export interface CohortMetricStore {
  find(code: string): CohortMetric | undefined;
  save(item: CohortMetric): void;
  remove(code: string): boolean;
  list(): CohortMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortMetricStore implements CohortMetricStore {
  items: Map<string, CohortMetric>;
  order: string[];

  constructor(items: Map<string, CohortMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortMetric): void {
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

  list(): CohortMetric[] {
    const out: CohortMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortMetricStore(): CohortMetricStore {
  return new MemoryCohortMetricStore(new Map<string, CohortMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortMetricStore implements CohortMetricStore {
  inner: CohortMetricStore;
  cache: cache.TtlCache<CohortMetric>;
  hits: number;
  misses: number;

  constructor(inner: CohortMetricStore, cacheValue: cache.TtlCache<CohortMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortMetric | undefined {
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

  save(item: CohortMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortMetric[] {
    return this.inner.list();
  }
}

export function newCachedCohortMetricStore(inner: CohortMetricStore, ttl: number, clockValue: clock.Clock): CohortMetricStore {
  return new CachedCohortMetricStore(inner, cache.newTtlCache<CohortMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects cohort metrics. Empty fields match all. */
export class CohortMetricQuery {
  segment: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minAttempts: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortMetric): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortMetric[]): CohortMetric[] {
    const matched = collections.filter(items, (candidate: CohortMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortMetrics(store: CohortMetricStore, query: CohortMetricQuery): CohortMetric[] {
  return query.apply(store.list());
}
