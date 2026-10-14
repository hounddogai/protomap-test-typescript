import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackRewardRuleMetric } from "./fallback-reward-rule-metric.js";

/** Keeps fallback reward rule metrics by code. */
export interface FallbackRewardRuleMetricStore {
  find(code: string): FallbackRewardRuleMetric | undefined;
  save(item: FallbackRewardRuleMetric): void;
  remove(code: string): boolean;
  list(): FallbackRewardRuleMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackRewardRuleMetricStore implements FallbackRewardRuleMetricStore {
  items: Map<string, FallbackRewardRuleMetric>;
  order: string[];

  constructor(items: Map<string, FallbackRewardRuleMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackRewardRuleMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackRewardRuleMetric): void {
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

  list(): FallbackRewardRuleMetric[] {
    const out: FallbackRewardRuleMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackRewardRuleMetricStore(): FallbackRewardRuleMetricStore {
  return new MemoryFallbackRewardRuleMetricStore(new Map<string, FallbackRewardRuleMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackRewardRuleMetricStore implements FallbackRewardRuleMetricStore {
  inner: FallbackRewardRuleMetricStore;
  cache: cache.TtlCache<FallbackRewardRuleMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackRewardRuleMetricStore,
    cacheValue: cache.TtlCache<FallbackRewardRuleMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackRewardRuleMetric | undefined {
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

  save(item: FallbackRewardRuleMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackRewardRuleMetric[] {
    return this.inner.list();
  }
}

export function newCachedFallbackRewardRuleMetricStore(inner: FallbackRewardRuleMetricStore, ttl: number, clockValue: clock.Clock): FallbackRewardRuleMetricStore {
  return new CachedFallbackRewardRuleMetricStore(
    inner,
    cache.newTtlCache<FallbackRewardRuleMetric>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback reward rule metrics. Empty fields match all. */
export class FallbackRewardRuleMetricQuery {
  unit: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minThreshold: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackRewardRuleMetric): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackRewardRuleMetric[]): FallbackRewardRuleMetric[] {
    const matched = collections.filter(items, (candidate: FallbackRewardRuleMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackRewardRuleMetrics(store: FallbackRewardRuleMetricStore, query: FallbackRewardRuleMetricQuery): FallbackRewardRuleMetric[] {
  return query.apply(store.list());
}
