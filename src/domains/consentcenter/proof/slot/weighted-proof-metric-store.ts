import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedProofMetric } from "./weighted-proof-metric.js";

/** Keeps weighted proof metrics by code. */
export interface WeightedProofMetricStore {
  find(code: string): WeightedProofMetric | undefined;
  save(item: WeightedProofMetric): void;
  remove(code: string): boolean;
  list(): WeightedProofMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedProofMetricStore implements WeightedProofMetricStore {
  items: Map<string, WeightedProofMetric>;
  order: string[];

  constructor(items: Map<string, WeightedProofMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedProofMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedProofMetric): void {
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

  list(): WeightedProofMetric[] {
    const out: WeightedProofMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedProofMetricStore(): WeightedProofMetricStore {
  return new MemoryWeightedProofMetricStore(new Map<string, WeightedProofMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedProofMetricStore implements WeightedProofMetricStore {
  inner: WeightedProofMetricStore;
  cache: cache.TtlCache<WeightedProofMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedProofMetricStore,
    cacheValue: cache.TtlCache<WeightedProofMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedProofMetric | undefined {
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

  save(item: WeightedProofMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedProofMetric[] {
    return this.inner.list();
  }
}

export function newCachedWeightedProofMetricStore(inner: WeightedProofMetricStore, ttl: number, clockValue: clock.Clock): WeightedProofMetricStore {
  return new CachedWeightedProofMetricStore(inner, cache.newTtlCache<WeightedProofMetric>(256, ttl, clockValue), 0, 0);
}

/** Selects weighted proof metrics. Empty fields match all. */
export class WeightedProofMetricQuery {
  channel: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minBatchSize: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedProofMetric): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedProofMetric[]): WeightedProofMetric[] {
    const matched = collections.filter(items, (candidate: WeightedProofMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedProofMetrics(store: WeightedProofMetricStore, query: WeightedProofMetricQuery): WeightedProofMetric[] {
  return query.apply(store.list());
}
