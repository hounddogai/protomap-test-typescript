import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardMetric } from "./reward-metric.js";

/** Keeps reward metrics by code. */
export interface RewardMetricStore {
  find(code: string): RewardMetric | undefined;
  save(item: RewardMetric): void;
  remove(code: string): boolean;
  list(): RewardMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardMetricStore implements RewardMetricStore {
  items: Map<string, RewardMetric>;
  order: string[];

  constructor(items: Map<string, RewardMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardMetric): void {
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

  list(): RewardMetric[] {
    const out: RewardMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardMetricStore(): RewardMetricStore {
  return new MemoryRewardMetricStore(new Map<string, RewardMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardMetricStore implements RewardMetricStore {
  inner: RewardMetricStore;
  cache: cache.TtlCache<RewardMetric>;
  hits: number;
  misses: number;

  constructor(inner: RewardMetricStore, cacheValue: cache.TtlCache<RewardMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardMetric | undefined {
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

  save(item: RewardMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardMetric[] {
    return this.inner.list();
  }
}

export function newCachedRewardMetricStore(inner: RewardMetricStore, ttl: number, clockValue: clock.Clock): RewardMetricStore {
  return new CachedRewardMetricStore(inner, cache.newTtlCache<RewardMetric>(256, ttl, clockValue), 0, 0);
}

/** Selects reward metrics. Empty fields match all. */
export class RewardMetricQuery {
  country: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardMetric): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardMetric[]): RewardMetric[] {
    const matched = collections.filter(items, (candidate: RewardMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardMetrics(store: RewardMetricStore, query: RewardMetricQuery): RewardMetric[] {
  return query.apply(store.list());
}
