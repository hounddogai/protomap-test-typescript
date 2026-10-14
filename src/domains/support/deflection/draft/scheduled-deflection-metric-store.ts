import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledDeflectionMetric } from "./scheduled-deflection-metric.js";

/** Keeps scheduled deflection metrics by code. */
export interface ScheduledDeflectionMetricStore {
  find(code: string): ScheduledDeflectionMetric | undefined;
  save(item: ScheduledDeflectionMetric): void;
  remove(code: string): boolean;
  list(): ScheduledDeflectionMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledDeflectionMetricStore implements ScheduledDeflectionMetricStore {
  items: Map<string, ScheduledDeflectionMetric>;
  order: string[];

  constructor(items: Map<string, ScheduledDeflectionMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledDeflectionMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledDeflectionMetric): void {
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

  list(): ScheduledDeflectionMetric[] {
    const out: ScheduledDeflectionMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledDeflectionMetricStore(): ScheduledDeflectionMetricStore {
  return new MemoryScheduledDeflectionMetricStore(new Map<string, ScheduledDeflectionMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledDeflectionMetricStore implements ScheduledDeflectionMetricStore {
  inner: ScheduledDeflectionMetricStore;
  cache: cache.TtlCache<ScheduledDeflectionMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledDeflectionMetricStore,
    cacheValue: cache.TtlCache<ScheduledDeflectionMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledDeflectionMetric | undefined {
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

  save(item: ScheduledDeflectionMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledDeflectionMetric[] {
    return this.inner.list();
  }
}

export function newCachedScheduledDeflectionMetricStore(inner: ScheduledDeflectionMetricStore, ttl: number, clockValue: clock.Clock): ScheduledDeflectionMetricStore {
  return new CachedScheduledDeflectionMetricStore(
    inner,
    cache.newTtlCache<ScheduledDeflectionMetric>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled deflection metrics. Empty fields match all. */
export class ScheduledDeflectionMetricQuery {
  label: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minEndsAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledDeflectionMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledDeflectionMetric[]): ScheduledDeflectionMetric[] {
    const matched = collections.filter(items, (candidate: ScheduledDeflectionMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledDeflectionMetrics(store: ScheduledDeflectionMetricStore, query: ScheduledDeflectionMetricQuery): ScheduledDeflectionMetric[] {
  return query.apply(store.list());
}
