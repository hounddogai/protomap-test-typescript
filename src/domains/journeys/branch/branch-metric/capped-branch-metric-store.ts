import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CappedBranchMetric } from "./capped-branch-metric.js";

/** Keeps capped branch metrics by code. */
export interface CappedBranchMetricStore {
  find(code: string): CappedBranchMetric | undefined;
  save(item: CappedBranchMetric): void;
  remove(code: string): boolean;
  list(): CappedBranchMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCappedBranchMetricStore implements CappedBranchMetricStore {
  items: Map<string, CappedBranchMetric>;
  order: string[];

  constructor(items: Map<string, CappedBranchMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CappedBranchMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CappedBranchMetric): void {
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

  list(): CappedBranchMetric[] {
    const out: CappedBranchMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCappedBranchMetricStore(): CappedBranchMetricStore {
  return new MemoryCappedBranchMetricStore(new Map<string, CappedBranchMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCappedBranchMetricStore implements CappedBranchMetricStore {
  inner: CappedBranchMetricStore;
  cache: cache.TtlCache<CappedBranchMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: CappedBranchMetricStore,
    cacheValue: cache.TtlCache<CappedBranchMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CappedBranchMetric | undefined {
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

  save(item: CappedBranchMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CappedBranchMetric[] {
    return this.inner.list();
  }
}

export function newCachedCappedBranchMetricStore(inner: CappedBranchMetricStore, ttl: number, clockValue: clock.Clock): CappedBranchMetricStore {
  return new CachedCappedBranchMetricStore(inner, cache.newTtlCache<CappedBranchMetric>(64, ttl, clockValue), 0, 0);
}

/** Selects capped branch metrics. Empty fields match all. */
export class CappedBranchMetricQuery {
  region: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minBudget: number, statuses: string[], limit: number) {
    this.region = region;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CappedBranchMetric): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CappedBranchMetric[]): CappedBranchMetric[] {
    const matched = collections.filter(items, (candidate: CappedBranchMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCappedBranchMetrics(store: CappedBranchMetricStore, query: CappedBranchMetricQuery): CappedBranchMetric[] {
  return query.apply(store.list());
}
