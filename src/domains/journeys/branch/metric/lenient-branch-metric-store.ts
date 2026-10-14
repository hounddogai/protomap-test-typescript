import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientBranchMetric } from "./lenient-branch-metric.js";

/** Keeps lenient branch metrics by code. */
export interface LenientBranchMetricStore {
  find(code: string): LenientBranchMetric | undefined;
  save(item: LenientBranchMetric): void;
  remove(code: string): boolean;
  list(): LenientBranchMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientBranchMetricStore implements LenientBranchMetricStore {
  items: Map<string, LenientBranchMetric>;
  order: string[];

  constructor(items: Map<string, LenientBranchMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientBranchMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientBranchMetric): void {
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

  list(): LenientBranchMetric[] {
    const out: LenientBranchMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientBranchMetricStore(): LenientBranchMetricStore {
  return new MemoryLenientBranchMetricStore(new Map<string, LenientBranchMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientBranchMetricStore implements LenientBranchMetricStore {
  inner: LenientBranchMetricStore;
  cache: cache.TtlCache<LenientBranchMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientBranchMetricStore,
    cacheValue: cache.TtlCache<LenientBranchMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientBranchMetric | undefined {
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

  save(item: LenientBranchMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientBranchMetric[] {
    return this.inner.list();
  }
}

export function newCachedLenientBranchMetricStore(inner: LenientBranchMetricStore, ttl: number, clockValue: clock.Clock): LenientBranchMetricStore {
  return new CachedLenientBranchMetricStore(inner, cache.newTtlCache<LenientBranchMetric>(64, ttl, clockValue), 0, 0);
}

/** Selects lenient branch metrics. Empty fields match all. */
export class LenientBranchMetricQuery {
  title: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCost: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientBranchMetric): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientBranchMetric[]): LenientBranchMetric[] {
    const matched = collections.filter(items, (candidate: LenientBranchMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientBranchMetrics(store: LenientBranchMetricStore, query: LenientBranchMetricQuery): LenientBranchMetric[] {
  return query.apply(store.list());
}
