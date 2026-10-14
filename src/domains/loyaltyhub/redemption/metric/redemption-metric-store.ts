import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RedemptionMetric } from "./redemption-metric.js";

/** Keeps redemption metrics by code. */
export interface RedemptionMetricStore {
  find(code: string): RedemptionMetric | undefined;
  save(item: RedemptionMetric): void;
  remove(code: string): boolean;
  list(): RedemptionMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRedemptionMetricStore implements RedemptionMetricStore {
  items: Map<string, RedemptionMetric>;
  order: string[];

  constructor(items: Map<string, RedemptionMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RedemptionMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RedemptionMetric): void {
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

  list(): RedemptionMetric[] {
    const out: RedemptionMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRedemptionMetricStore(): RedemptionMetricStore {
  return new MemoryRedemptionMetricStore(new Map<string, RedemptionMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRedemptionMetricStore implements RedemptionMetricStore {
  inner: RedemptionMetricStore;
  cache: cache.TtlCache<RedemptionMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: RedemptionMetricStore,
    cacheValue: cache.TtlCache<RedemptionMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RedemptionMetric | undefined {
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

  save(item: RedemptionMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RedemptionMetric[] {
    return this.inner.list();
  }
}

export function newCachedRedemptionMetricStore(inner: RedemptionMetricStore, ttl: number, clockValue: clock.Clock): RedemptionMetricStore {
  return new CachedRedemptionMetricStore(inner, cache.newTtlCache<RedemptionMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects redemption metrics. Empty fields match all. */
export class RedemptionMetricQuery {
  label: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMinimum: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RedemptionMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RedemptionMetric[]): RedemptionMetric[] {
    const matched = collections.filter(items, (candidate: RedemptionMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRedemptionMetrics(store: RedemptionMetricStore, query: RedemptionMetricQuery): RedemptionMetric[] {
  return query.apply(store.list());
}
