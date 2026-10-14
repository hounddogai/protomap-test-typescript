import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ManualRewardRuleMetric } from "./manual-reward-rule-metric.js";

/** Keeps manual reward rule metrics by code. */
export interface ManualRewardRuleMetricStore {
  find(code: string): ManualRewardRuleMetric | undefined;
  save(item: ManualRewardRuleMetric): void;
  remove(code: string): boolean;
  list(): ManualRewardRuleMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryManualRewardRuleMetricStore implements ManualRewardRuleMetricStore {
  items: Map<string, ManualRewardRuleMetric>;
  order: string[];

  constructor(items: Map<string, ManualRewardRuleMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ManualRewardRuleMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ManualRewardRuleMetric): void {
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

  list(): ManualRewardRuleMetric[] {
    const out: ManualRewardRuleMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryManualRewardRuleMetricStore(): ManualRewardRuleMetricStore {
  return new MemoryManualRewardRuleMetricStore(new Map<string, ManualRewardRuleMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedManualRewardRuleMetricStore implements ManualRewardRuleMetricStore {
  inner: ManualRewardRuleMetricStore;
  cache: cache.TtlCache<ManualRewardRuleMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: ManualRewardRuleMetricStore,
    cacheValue: cache.TtlCache<ManualRewardRuleMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ManualRewardRuleMetric | undefined {
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

  save(item: ManualRewardRuleMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ManualRewardRuleMetric[] {
    return this.inner.list();
  }
}

export function newCachedManualRewardRuleMetricStore(inner: ManualRewardRuleMetricStore, ttl: number, clockValue: clock.Clock): ManualRewardRuleMetricStore {
  return new CachedManualRewardRuleMetricStore(
    inner,
    cache.newTtlCache<ManualRewardRuleMetric>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects manual reward rule metrics. Empty fields match all. */
export class ManualRewardRuleMetricQuery {
  category: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minBudget: number, statuses: string[], limit: number) {
    this.category = category;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ManualRewardRuleMetric): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ManualRewardRuleMetric[]): ManualRewardRuleMetric[] {
    const matched = collections.filter(items, (candidate: ManualRewardRuleMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findManualRewardRuleMetrics(store: ManualRewardRuleMetricStore, query: ManualRewardRuleMetricQuery): ManualRewardRuleMetric[] {
  return query.apply(store.list());
}
