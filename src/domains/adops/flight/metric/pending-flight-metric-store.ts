import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingFlightMetric } from "./pending-flight-metric.js";

/** Keeps pending flight metrics by code. */
export interface PendingFlightMetricStore {
  find(code: string): PendingFlightMetric | undefined;
  save(item: PendingFlightMetric): void;
  remove(code: string): boolean;
  list(): PendingFlightMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingFlightMetricStore implements PendingFlightMetricStore {
  items: Map<string, PendingFlightMetric>;
  order: string[];

  constructor(items: Map<string, PendingFlightMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingFlightMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingFlightMetric): void {
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

  list(): PendingFlightMetric[] {
    const out: PendingFlightMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingFlightMetricStore(): PendingFlightMetricStore {
  return new MemoryPendingFlightMetricStore(new Map<string, PendingFlightMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingFlightMetricStore implements PendingFlightMetricStore {
  inner: PendingFlightMetricStore;
  cache: cache.TtlCache<PendingFlightMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingFlightMetricStore,
    cacheValue: cache.TtlCache<PendingFlightMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingFlightMetric | undefined {
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

  save(item: PendingFlightMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingFlightMetric[] {
    return this.inner.list();
  }
}

export function newCachedPendingFlightMetricStore(inner: PendingFlightMetricStore, ttl: number, clockValue: clock.Clock): PendingFlightMetricStore {
  return new CachedPendingFlightMetricStore(inner, cache.newTtlCache<PendingFlightMetric>(128, ttl, clockValue), 0, 0);
}

/** Selects pending flight metrics. Empty fields match all. */
export class PendingFlightMetricQuery {
  locale: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minPriority: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingFlightMetric): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingFlightMetric[]): PendingFlightMetric[] {
    const matched = collections.filter(items, (candidate: PendingFlightMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingFlightMetrics(store: PendingFlightMetricStore, query: PendingFlightMetricQuery): PendingFlightMetric[] {
  return query.apply(store.list());
}
