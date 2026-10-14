import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardRuleMetric } from "./reward-rule-metric.js";

/** Keeps reward rule metrics by code. */
export interface RewardRuleMetricStore {
  find(code: string): RewardRuleMetric | undefined;
  save(item: RewardRuleMetric): void;
  remove(code: string): boolean;
  list(): RewardRuleMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardRuleMetricStore implements RewardRuleMetricStore {
  items: Map<string, RewardRuleMetric>;
  order: string[];

  constructor(items: Map<string, RewardRuleMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardRuleMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardRuleMetric): void {
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

  list(): RewardRuleMetric[] {
    const out: RewardRuleMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardRuleMetricStore(): RewardRuleMetricStore {
  return new MemoryRewardRuleMetricStore(new Map<string, RewardRuleMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardRuleMetricStore implements RewardRuleMetricStore {
  inner: RewardRuleMetricStore;
  cache: cache.TtlCache<RewardRuleMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardRuleMetricStore,
    cacheValue: cache.TtlCache<RewardRuleMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardRuleMetric | undefined {
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

  save(item: RewardRuleMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardRuleMetric[] {
    return this.inner.list();
  }
}

export function newCachedRewardRuleMetricStore(inner: RewardRuleMetricStore, ttl: number, clockValue: clock.Clock): RewardRuleMetricStore {
  return new CachedRewardRuleMetricStore(inner, cache.newTtlCache<RewardRuleMetric>(1024, ttl, clockValue), 0, 0);
}

/** Selects reward rule metrics. Empty fields match all. */
export class RewardRuleMetricQuery {
  segment: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardRuleMetric): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardRuleMetric[]): RewardRuleMetric[] {
    const matched = collections.filter(items, (candidate: RewardRuleMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardRuleMetrics(store: RewardRuleMetricStore, query: RewardRuleMetricQuery): RewardRuleMetric[] {
  return query.apply(store.list());
}
