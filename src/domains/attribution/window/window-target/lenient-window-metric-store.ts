import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientWindowMetric } from "./lenient-window-metric.js";

/** Keeps lenient window metrics by code. */
export interface LenientWindowMetricStore {
  find(code: string): LenientWindowMetric | undefined;
  save(item: LenientWindowMetric): void;
  remove(code: string): boolean;
  list(): LenientWindowMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientWindowMetricStore implements LenientWindowMetricStore {
  items: Map<string, LenientWindowMetric>;
  order: string[];

  constructor(items: Map<string, LenientWindowMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientWindowMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientWindowMetric): void {
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

  list(): LenientWindowMetric[] {
    const out: LenientWindowMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientWindowMetricStore(): LenientWindowMetricStore {
  return new MemoryLenientWindowMetricStore(new Map<string, LenientWindowMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientWindowMetricStore implements LenientWindowMetricStore {
  inner: LenientWindowMetricStore;
  cache: cache.TtlCache<LenientWindowMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientWindowMetricStore,
    cacheValue: cache.TtlCache<LenientWindowMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientWindowMetric | undefined {
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

  save(item: LenientWindowMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientWindowMetric[] {
    return this.inner.list();
  }
}

export function newCachedLenientWindowMetricStore(inner: LenientWindowMetricStore, ttl: number, clockValue: clock.Clock): LenientWindowMetricStore {
  return new CachedLenientWindowMetricStore(inner, cache.newTtlCache<LenientWindowMetric>(256, ttl, clockValue), 0, 0);
}

/** Selects lenient window metrics. Empty fields match all. */
export class LenientWindowMetricQuery {
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

  matches(item: LenientWindowMetric): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientWindowMetric[]): LenientWindowMetric[] {
    const matched = collections.filter(items, (candidate: LenientWindowMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientWindowMetrics(store: LenientWindowMetricStore, query: LenientWindowMetricQuery): LenientWindowMetric[] {
  return query.apply(store.list());
}
