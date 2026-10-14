import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchMetric } from "./branch-metric.js";

/** Keeps branch metrics by code. */
export interface BranchMetricStore {
  find(code: string): BranchMetric | undefined;
  save(item: BranchMetric): void;
  remove(code: string): boolean;
  list(): BranchMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchMetricStore implements BranchMetricStore {
  items: Map<string, BranchMetric>;
  order: string[];

  constructor(items: Map<string, BranchMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchMetric): void {
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

  list(): BranchMetric[] {
    const out: BranchMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchMetricStore(): BranchMetricStore {
  return new MemoryBranchMetricStore(new Map<string, BranchMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchMetricStore implements BranchMetricStore {
  inner: BranchMetricStore;
  cache: cache.TtlCache<BranchMetric>;
  hits: number;
  misses: number;

  constructor(inner: BranchMetricStore, cacheValue: cache.TtlCache<BranchMetric>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchMetric | undefined {
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

  save(item: BranchMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchMetric[] {
    return this.inner.list();
  }
}

export function newCachedBranchMetricStore(inner: BranchMetricStore, ttl: number, clockValue: clock.Clock): BranchMetricStore {
  return new CachedBranchMetricStore(inner, cache.newTtlCache<BranchMetric>(128, ttl, clockValue), 0, 0);
}

/** Selects branch metrics. Empty fields match all. */
export class BranchMetricQuery {
  channel: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minMargin: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchMetric): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchMetric[]): BranchMetric[] {
    const matched = collections.filter(items, (candidate: BranchMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchMetrics(store: BranchMetricStore, query: BranchMetricQuery): BranchMetric[] {
  return query.apply(store.list());
}
