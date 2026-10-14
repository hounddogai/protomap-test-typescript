import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedNudgeMetric } from "./weighted-nudge-metric.js";

/** Keeps weighted nudge metrics by code. */
export interface WeightedNudgeMetricStore {
  find(code: string): WeightedNudgeMetric | undefined;
  save(item: WeightedNudgeMetric): void;
  remove(code: string): boolean;
  list(): WeightedNudgeMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedNudgeMetricStore implements WeightedNudgeMetricStore {
  items: Map<string, WeightedNudgeMetric>;
  order: string[];

  constructor(items: Map<string, WeightedNudgeMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedNudgeMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedNudgeMetric): void {
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

  list(): WeightedNudgeMetric[] {
    const out: WeightedNudgeMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedNudgeMetricStore(): WeightedNudgeMetricStore {
  return new MemoryWeightedNudgeMetricStore(new Map<string, WeightedNudgeMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedNudgeMetricStore implements WeightedNudgeMetricStore {
  inner: WeightedNudgeMetricStore;
  cache: cache.TtlCache<WeightedNudgeMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedNudgeMetricStore,
    cacheValue: cache.TtlCache<WeightedNudgeMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedNudgeMetric | undefined {
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

  save(item: WeightedNudgeMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedNudgeMetric[] {
    return this.inner.list();
  }
}

export function newCachedWeightedNudgeMetricStore(inner: WeightedNudgeMetricStore, ttl: number, clockValue: clock.Clock): WeightedNudgeMetricStore {
  return new CachedWeightedNudgeMetricStore(inner, cache.newTtlCache<WeightedNudgeMetric>(1024, ttl, clockValue), 0, 0);
}

/** Selects weighted nudge metrics. Empty fields match all. */
export class WeightedNudgeMetricQuery {
  channel: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minOpenRate: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedNudgeMetric): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedNudgeMetric[]): WeightedNudgeMetric[] {
    const matched = collections.filter(items, (candidate: WeightedNudgeMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedNudgeMetrics(store: WeightedNudgeMetricStore, query: WeightedNudgeMetricQuery): WeightedNudgeMetric[] {
  return query.apply(store.list());
}
