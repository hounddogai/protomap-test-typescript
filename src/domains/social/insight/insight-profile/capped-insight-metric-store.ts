import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedInsightMetric } from "./capped-insight-metric.js";

/** Keeps capped insight metrics by code. */
export interface CappedInsightMetricStore {
  find(code: string): CappedInsightMetric | undefined;
  save(item: CappedInsightMetric): void;
  remove(code: string): boolean;
  list(): CappedInsightMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedInsightMetricStore implements CappedInsightMetricStore {
  items: Map<string, CappedInsightMetric>;
  order: string[];

  constructor(items: Map<string, CappedInsightMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedInsightMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedInsightMetric): void {
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

  list(): CappedInsightMetric[] {
    const out: CappedInsightMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedInsightMetricStore(): CappedInsightMetricStore {
  return new MemoryCappedInsightMetricStore(new Map<string, CappedInsightMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedInsightMetricStore implements CappedInsightMetricStore {
  inner: CappedInsightMetricStore;
  cache: cache.TtlCache<CappedInsightMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedInsightMetricStore,
    cacheValue: cache.TtlCache<CappedInsightMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedInsightMetric | undefined {
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

  save(item: CappedInsightMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedInsightMetric[] {
    return this.inner.list();
  }
}

export function newCachedCappedInsightMetricStore(inner: CappedInsightMetricStore, ttl: number, clockValue: clock.Clock): CappedInsightMetricStore {
  return new CachedCappedInsightMetricStore(inner, cache.newTtlCache<CappedInsightMetric>(1024, ttl, clockValue), 0, 0);
}

/** Selects capped insight metrics. Empty fields match all. */
export class CappedInsightMetricQuery {
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

  matches(item: CappedInsightMetric): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedInsightMetric[]): CappedInsightMetric[] {
    const matched = collections.filter(items, (candidate: CappedInsightMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedInsightMetrics(store: CappedInsightMetricStore, query: CappedInsightMetricQuery): CappedInsightMetric[] {
  return query.apply(store.list());
}
