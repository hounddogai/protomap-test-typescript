import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalDoubleOptInMetric } from "./regional-double-opt-in-metric.js";

/** Keeps regional double opt in metrics by code. */
export interface RegionalDoubleOptInMetricStore {
  find(code: string): RegionalDoubleOptInMetric | undefined;
  save(item: RegionalDoubleOptInMetric): void;
  remove(code: string): boolean;
  list(): RegionalDoubleOptInMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalDoubleOptInMetricStore implements RegionalDoubleOptInMetricStore {
  items: Map<string, RegionalDoubleOptInMetric>;
  order: string[];

  constructor(items: Map<string, RegionalDoubleOptInMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalDoubleOptInMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalDoubleOptInMetric): void {
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

  list(): RegionalDoubleOptInMetric[] {
    const out: RegionalDoubleOptInMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalDoubleOptInMetricStore(): RegionalDoubleOptInMetricStore {
  return new MemoryRegionalDoubleOptInMetricStore(new Map<string, RegionalDoubleOptInMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalDoubleOptInMetricStore implements RegionalDoubleOptInMetricStore {
  inner: RegionalDoubleOptInMetricStore;
  cache: cache.TtlCache<RegionalDoubleOptInMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalDoubleOptInMetricStore,
    cacheValue: cache.TtlCache<RegionalDoubleOptInMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalDoubleOptInMetric | undefined {
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

  save(item: RegionalDoubleOptInMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalDoubleOptInMetric[] {
    return this.inner.list();
  }
}

export function newCachedRegionalDoubleOptInMetricStore(inner: RegionalDoubleOptInMetricStore, ttl: number, clockValue: clock.Clock): RegionalDoubleOptInMetricStore {
  return new CachedRegionalDoubleOptInMetricStore(
    inner,
    cache.newTtlCache<RegionalDoubleOptInMetric>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional double opt in metrics. Empty fields match all. */
export class RegionalDoubleOptInMetricQuery {
  segment: string;
  minWindowDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minWindowDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minWindowDays = minWindowDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalDoubleOptInMetric): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.windowDays < this.minWindowDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalDoubleOptInMetric[]): RegionalDoubleOptInMetric[] {
    const matched = collections.filter(items, (candidate: RegionalDoubleOptInMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalDoubleOptInMetrics(store: RegionalDoubleOptInMetricStore, query: RegionalDoubleOptInMetricQuery): RegionalDoubleOptInMetric[] {
  return query.apply(store.list());
}
