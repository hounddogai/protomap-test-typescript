import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackSenderMetric } from "./fallback-sender-metric.js";

/** Keeps fallback sender metrics by code. */
export interface FallbackSenderMetricStore {
  find(code: string): FallbackSenderMetric | undefined;
  save(item: FallbackSenderMetric): void;
  remove(code: string): boolean;
  list(): FallbackSenderMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackSenderMetricStore implements FallbackSenderMetricStore {
  items: Map<string, FallbackSenderMetric>;
  order: string[];

  constructor(items: Map<string, FallbackSenderMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackSenderMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackSenderMetric): void {
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

  list(): FallbackSenderMetric[] {
    const out: FallbackSenderMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackSenderMetricStore(): FallbackSenderMetricStore {
  return new MemoryFallbackSenderMetricStore(new Map<string, FallbackSenderMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackSenderMetricStore implements FallbackSenderMetricStore {
  inner: FallbackSenderMetricStore;
  cache: cache.TtlCache<FallbackSenderMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackSenderMetricStore,
    cacheValue: cache.TtlCache<FallbackSenderMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackSenderMetric | undefined {
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

  save(item: FallbackSenderMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackSenderMetric[] {
    return this.inner.list();
  }
}

export function newCachedFallbackSenderMetricStore(inner: FallbackSenderMetricStore, ttl: number, clockValue: clock.Clock): FallbackSenderMetricStore {
  return new CachedFallbackSenderMetricStore(
    inner,
    cache.newTtlCache<FallbackSenderMetric>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback sender metrics. Empty fields match all. */
export class FallbackSenderMetricQuery {
  label: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minClicks: number, statuses: string[], limit: number) {
    this.label = label;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackSenderMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackSenderMetric[]): FallbackSenderMetric[] {
    const matched = collections.filter(items, (candidate: FallbackSenderMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackSenderMetrics(store: FallbackSenderMetricStore, query: FallbackSenderMetricQuery): FallbackSenderMetric[] {
  return query.apply(store.list());
}
