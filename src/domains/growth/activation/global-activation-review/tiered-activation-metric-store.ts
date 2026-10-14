import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredActivationMetric } from "./tiered-activation-metric.js";

/** Keeps tiered activation metrics by code. */
export interface TieredActivationMetricStore {
  find(code: string): TieredActivationMetric | undefined;
  save(item: TieredActivationMetric): void;
  remove(code: string): boolean;
  list(): TieredActivationMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredActivationMetricStore implements TieredActivationMetricStore {
  items: Map<string, TieredActivationMetric>;
  order: string[];

  constructor(items: Map<string, TieredActivationMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredActivationMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredActivationMetric): void {
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

  list(): TieredActivationMetric[] {
    const out: TieredActivationMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredActivationMetricStore(): TieredActivationMetricStore {
  return new MemoryTieredActivationMetricStore(new Map<string, TieredActivationMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredActivationMetricStore implements TieredActivationMetricStore {
  inner: TieredActivationMetricStore;
  cache: cache.TtlCache<TieredActivationMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredActivationMetricStore,
    cacheValue: cache.TtlCache<TieredActivationMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredActivationMetric | undefined {
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

  save(item: TieredActivationMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredActivationMetric[] {
    return this.inner.list();
  }
}

export function newCachedTieredActivationMetricStore(inner: TieredActivationMetricStore, ttl: number, clockValue: clock.Clock): TieredActivationMetricStore {
  return new CachedTieredActivationMetricStore(
    inner,
    cache.newTtlCache<TieredActivationMetric>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered activation metrics. Empty fields match all. */
export class TieredActivationMetricQuery {
  label: string;
  minAttempts: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minAttempts: number, statuses: string[], limit: number) {
    this.label = label;
    this.minAttempts = minAttempts;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredActivationMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.attempts < this.minAttempts) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredActivationMetric[]): TieredActivationMetric[] {
    const matched = collections.filter(items, (candidate: TieredActivationMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredActivationMetrics(store: TieredActivationMetricStore, query: TieredActivationMetricQuery): TieredActivationMetric[] {
  return query.apply(store.list());
}
