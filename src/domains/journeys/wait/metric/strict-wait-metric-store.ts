import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictWaitMetric } from "./strict-wait-metric.js";

/** Keeps strict wait metrics by code. */
export interface StrictWaitMetricStore {
  find(code: string): StrictWaitMetric | undefined;
  save(item: StrictWaitMetric): void;
  remove(code: string): boolean;
  list(): StrictWaitMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictWaitMetricStore implements StrictWaitMetricStore {
  items: Map<string, StrictWaitMetric>;
  order: string[];

  constructor(items: Map<string, StrictWaitMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictWaitMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictWaitMetric): void {
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

  list(): StrictWaitMetric[] {
    const out: StrictWaitMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictWaitMetricStore(): StrictWaitMetricStore {
  return new MemoryStrictWaitMetricStore(new Map<string, StrictWaitMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictWaitMetricStore implements StrictWaitMetricStore {
  inner: StrictWaitMetricStore;
  cache: cache.TtlCache<StrictWaitMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictWaitMetricStore,
    cacheValue: cache.TtlCache<StrictWaitMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictWaitMetric | undefined {
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

  save(item: StrictWaitMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictWaitMetric[] {
    return this.inner.list();
  }
}

export function newCachedStrictWaitMetricStore(inner: StrictWaitMetricStore, ttl: number, clockValue: clock.Clock): StrictWaitMetricStore {
  return new CachedStrictWaitMetricStore(inner, cache.newTtlCache<StrictWaitMetric>(256, ttl, clockValue), 0, 0);
}

/** Selects strict wait metrics. Empty fields match all. */
export class StrictWaitMetricQuery {
  segment: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minPriority: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictWaitMetric): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictWaitMetric[]): StrictWaitMetric[] {
    const matched = collections.filter(items, (candidate: StrictWaitMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictWaitMetrics(store: StrictWaitMetricStore, query: StrictWaitMetricQuery): StrictWaitMetric[] {
  return query.apply(store.list());
}
