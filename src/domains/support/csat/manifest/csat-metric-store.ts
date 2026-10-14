import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CsatMetric } from "./csat-metric.js";

/** Keeps csat metrics by code. */
export interface CsatMetricStore {
  find(code: string): CsatMetric | undefined;
  save(item: CsatMetric): void;
  remove(code: string): boolean;
  list(): CsatMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCsatMetricStore implements CsatMetricStore {
  items: Map<string, CsatMetric>;
  order: string[];

  constructor(items: Map<string, CsatMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CsatMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CsatMetric): void {
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

  list(): CsatMetric[] {
    const out: CsatMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCsatMetricStore(): CsatMetricStore {
  return new MemoryCsatMetricStore(new Map<string, CsatMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCsatMetricStore implements CsatMetricStore {
  inner: CsatMetricStore;
  cache: cache.TtlCache<CsatMetric>;
  hits: number;
  misses: number;

  constructor(inner: CsatMetricStore, cacheValue: cache.TtlCache<CsatMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CsatMetric | undefined {
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

  save(item: CsatMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CsatMetric[] {
    return this.inner.list();
  }
}

export function newCachedCsatMetricStore(inner: CsatMetricStore, ttl: number, clockValue: clock.Clock): CsatMetricStore {
  return new CachedCsatMetricStore(inner, cache.newTtlCache<CsatMetric>(128, ttl, clockValue), 0, 0);
}

/** Selects csat metrics. Empty fields match all. */
export class CsatMetricQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CsatMetric): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CsatMetric[]): CsatMetric[] {
    const matched = collections.filter(items, (candidate: CsatMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCsatMetrics(store: CsatMetricStore, query: CsatMetricQuery): CsatMetric[] {
  return query.apply(store.list());
}
