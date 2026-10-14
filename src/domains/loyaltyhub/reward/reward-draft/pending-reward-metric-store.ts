import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingRewardMetric } from "./pending-reward-metric.js";

/** Keeps pending reward metrics by code. */
export interface PendingRewardMetricStore {
  find(code: string): PendingRewardMetric | undefined;
  save(item: PendingRewardMetric): void;
  remove(code: string): boolean;
  list(): PendingRewardMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingRewardMetricStore implements PendingRewardMetricStore {
  items: Map<string, PendingRewardMetric>;
  order: string[];

  constructor(items: Map<string, PendingRewardMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingRewardMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingRewardMetric): void {
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

  list(): PendingRewardMetric[] {
    const out: PendingRewardMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingRewardMetricStore(): PendingRewardMetricStore {
  return new MemoryPendingRewardMetricStore(new Map<string, PendingRewardMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingRewardMetricStore implements PendingRewardMetricStore {
  inner: PendingRewardMetricStore;
  cache: cache.TtlCache<PendingRewardMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingRewardMetricStore,
    cacheValue: cache.TtlCache<PendingRewardMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingRewardMetric | undefined {
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

  save(item: PendingRewardMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingRewardMetric[] {
    return this.inner.list();
  }
}

export function newCachedPendingRewardMetricStore(inner: PendingRewardMetricStore, ttl: number, clockValue: clock.Clock): PendingRewardMetricStore {
  return new CachedPendingRewardMetricStore(inner, cache.newTtlCache<PendingRewardMetric>(64, ttl, clockValue), 0, 0);
}

/** Selects pending reward metrics. Empty fields match all. */
export class PendingRewardMetricQuery {
  region: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minRatio: number, statuses: string[], limit: number) {
    this.region = region;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingRewardMetric): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingRewardMetric[]): PendingRewardMetric[] {
    const matched = collections.filter(items, (candidate: PendingRewardMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingRewardMetrics(store: PendingRewardMetricStore, query: PendingRewardMetricQuery): PendingRewardMetric[] {
  return query.apply(store.list());
}
