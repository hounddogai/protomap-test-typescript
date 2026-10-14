import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredRewardMetric } from "./tiered-reward-metric.js";

/** Keeps tiered reward metrics by code. */
export interface TieredRewardMetricStore {
  find(code: string): TieredRewardMetric | undefined;
  save(item: TieredRewardMetric): void;
  remove(code: string): boolean;
  list(): TieredRewardMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredRewardMetricStore implements TieredRewardMetricStore {
  items: Map<string, TieredRewardMetric>;
  order: string[];

  constructor(items: Map<string, TieredRewardMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredRewardMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredRewardMetric): void {
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

  list(): TieredRewardMetric[] {
    const out: TieredRewardMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredRewardMetricStore(): TieredRewardMetricStore {
  return new MemoryTieredRewardMetricStore(new Map<string, TieredRewardMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredRewardMetricStore implements TieredRewardMetricStore {
  inner: TieredRewardMetricStore;
  cache: cache.TtlCache<TieredRewardMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredRewardMetricStore,
    cacheValue: cache.TtlCache<TieredRewardMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredRewardMetric | undefined {
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

  save(item: TieredRewardMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredRewardMetric[] {
    return this.inner.list();
  }
}

export function newCachedTieredRewardMetricStore(inner: TieredRewardMetricStore, ttl: number, clockValue: clock.Clock): TieredRewardMetricStore {
  return new CachedTieredRewardMetricStore(inner, cache.newTtlCache<TieredRewardMetric>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered reward metrics. Empty fields match all. */
export class TieredRewardMetricQuery {
  label: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minThreshold: number, statuses: string[], limit: number) {
    this.label = label;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredRewardMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredRewardMetric[]): TieredRewardMetric[] {
    const matched = collections.filter(items, (candidate: TieredRewardMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredRewardMetrics(store: TieredRewardMetricStore, query: TieredRewardMetricQuery): TieredRewardMetric[] {
  return query.apply(store.list());
}
