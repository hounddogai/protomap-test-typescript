import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitMetric } from "./wait-metric.js";

/** Keeps wait metrics by code. */
export interface WaitMetricStore {
  find(code: string): WaitMetric | undefined;
  save(item: WaitMetric): void;
  remove(code: string): boolean;
  list(): WaitMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitMetricStore implements WaitMetricStore {
  items: Map<string, WaitMetric>;
  order: string[];

  constructor(items: Map<string, WaitMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitMetric): void {
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

  list(): WaitMetric[] {
    const out: WaitMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitMetricStore(): WaitMetricStore {
  return new MemoryWaitMetricStore(new Map<string, WaitMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitMetricStore implements WaitMetricStore {
  inner: WaitMetricStore;
  cache: cache.TtlCache<WaitMetric>;
  hits: number;
  misses: number;

  constructor(inner: WaitMetricStore, cacheValue: cache.TtlCache<WaitMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitMetric | undefined {
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

  save(item: WaitMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitMetric[] {
    return this.inner.list();
  }
}

export function newCachedWaitMetricStore(inner: WaitMetricStore, ttl: number, clockValue: clock.Clock): WaitMetricStore {
  return new CachedWaitMetricStore(inner, cache.newTtlCache<WaitMetric>(512, ttl, clockValue), 0, 0);
}

/** Selects wait metrics. Empty fields match all. */
export class WaitMetricQuery {
  locale: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minClicks: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitMetric): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitMetric[]): WaitMetric[] {
    const matched = collections.filter(items, (candidate: WaitMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitMetrics(store: WaitMetricStore, query: WaitMetricQuery): WaitMetric[] {
  return query.apply(store.list());
}
