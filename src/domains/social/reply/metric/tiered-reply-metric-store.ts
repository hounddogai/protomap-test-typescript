import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredReplyMetric } from "./tiered-reply-metric.js";

/** Keeps tiered reply metrics by code. */
export interface TieredReplyMetricStore {
  find(code: string): TieredReplyMetric | undefined;
  save(item: TieredReplyMetric): void;
  remove(code: string): boolean;
  list(): TieredReplyMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredReplyMetricStore implements TieredReplyMetricStore {
  items: Map<string, TieredReplyMetric>;
  order: string[];

  constructor(items: Map<string, TieredReplyMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredReplyMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredReplyMetric): void {
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

  list(): TieredReplyMetric[] {
    const out: TieredReplyMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredReplyMetricStore(): TieredReplyMetricStore {
  return new MemoryTieredReplyMetricStore(new Map<string, TieredReplyMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredReplyMetricStore implements TieredReplyMetricStore {
  inner: TieredReplyMetricStore;
  cache: cache.TtlCache<TieredReplyMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredReplyMetricStore,
    cacheValue: cache.TtlCache<TieredReplyMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredReplyMetric | undefined {
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

  save(item: TieredReplyMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredReplyMetric[] {
    return this.inner.list();
  }
}

export function newCachedTieredReplyMetricStore(inner: TieredReplyMetricStore, ttl: number, clockValue: clock.Clock): TieredReplyMetricStore {
  return new CachedTieredReplyMetricStore(inner, cache.newTtlCache<TieredReplyMetric>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered reply metrics. Empty fields match all. */
export class TieredReplyMetricQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredReplyMetric): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredReplyMetric[]): TieredReplyMetric[] {
    const matched = collections.filter(items, (candidate: TieredReplyMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredReplyMetrics(store: TieredReplyMetricStore, query: TieredReplyMetricQuery): TieredReplyMetric[] {
  return query.apply(store.list());
}
