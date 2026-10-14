import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedCsatMetric } from "./capped-csat-metric.js";

/** Keeps capped csat metrics by code. */
export interface CappedCsatMetricStore {
  find(code: string): CappedCsatMetric | undefined;
  save(item: CappedCsatMetric): void;
  remove(code: string): boolean;
  list(): CappedCsatMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedCsatMetricStore implements CappedCsatMetricStore {
  items: Map<string, CappedCsatMetric>;
  order: string[];

  constructor(items: Map<string, CappedCsatMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedCsatMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedCsatMetric): void {
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

  list(): CappedCsatMetric[] {
    const out: CappedCsatMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedCsatMetricStore(): CappedCsatMetricStore {
  return new MemoryCappedCsatMetricStore(new Map<string, CappedCsatMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedCsatMetricStore implements CappedCsatMetricStore {
  inner: CappedCsatMetricStore;
  cache: cache.TtlCache<CappedCsatMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedCsatMetricStore,
    cacheValue: cache.TtlCache<CappedCsatMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedCsatMetric | undefined {
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

  save(item: CappedCsatMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedCsatMetric[] {
    return this.inner.list();
  }
}

export function newCachedCappedCsatMetricStore(inner: CappedCsatMetricStore, ttl: number, clockValue: clock.Clock): CappedCsatMetricStore {
  return new CachedCappedCsatMetricStore(inner, cache.newTtlCache<CappedCsatMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects capped csat metrics. Empty fields match all. */
export class CappedCsatMetricQuery {
  name: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minAmount: number, statuses: string[], limit: number) {
    this.name = name;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedCsatMetric): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedCsatMetric[]): CappedCsatMetric[] {
    const matched = collections.filter(items, (candidate: CappedCsatMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedCsatMetrics(store: CappedCsatMetricStore, query: CappedCsatMetricQuery): CappedCsatMetric[] {
  return query.apply(store.list());
}
