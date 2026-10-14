import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StreakMetric } from "./streak-metric.js";

/** Keeps streak metrics by code. */
export interface StreakMetricStore {
  find(code: string): StreakMetric | undefined;
  save(item: StreakMetric): void;
  remove(code: string): boolean;
  list(): StreakMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStreakMetricStore implements StreakMetricStore {
  items: Map<string, StreakMetric>;
  order: string[];

  constructor(items: Map<string, StreakMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StreakMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StreakMetric): void {
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

  list(): StreakMetric[] {
    const out: StreakMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStreakMetricStore(): StreakMetricStore {
  return new MemoryStreakMetricStore(new Map<string, StreakMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStreakMetricStore implements StreakMetricStore {
  inner: StreakMetricStore;
  cache: cache.TtlCache<StreakMetric>;
  hits: number;
  misses: number;

  constructor(inner: StreakMetricStore, cacheValue: cache.TtlCache<StreakMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StreakMetric | undefined {
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

  save(item: StreakMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StreakMetric[] {
    return this.inner.list();
  }
}

export function newCachedStreakMetricStore(inner: StreakMetricStore, ttl: number, clockValue: clock.Clock): StreakMetricStore {
  return new CachedStreakMetricStore(inner, cache.newTtlCache<StreakMetric>(128, ttl, clockValue), 0, 0);
}

/** Selects streak metrics. Empty fields match all. */
export class StreakMetricQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StreakMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StreakMetric[]): StreakMetric[] {
    const matched = collections.filter(items, (candidate: StreakMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStreakMetrics(store: StreakMetricStore, query: StreakMetricQuery): StreakMetric[] {
  return query.apply(store.list());
}
