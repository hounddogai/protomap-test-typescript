import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientActivationMetric } from "./lenient-activation-metric.js";

/** Keeps lenient activation metrics by code. */
export interface LenientActivationMetricStore {
  find(code: string): LenientActivationMetric | undefined;
  save(item: LenientActivationMetric): void;
  remove(code: string): boolean;
  list(): LenientActivationMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientActivationMetricStore implements LenientActivationMetricStore {
  items: Map<string, LenientActivationMetric>;
  order: string[];

  constructor(items: Map<string, LenientActivationMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientActivationMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientActivationMetric): void {
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

  list(): LenientActivationMetric[] {
    const out: LenientActivationMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientActivationMetricStore(): LenientActivationMetricStore {
  return new MemoryLenientActivationMetricStore(new Map<string, LenientActivationMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientActivationMetricStore implements LenientActivationMetricStore {
  inner: LenientActivationMetricStore;
  cache: cache.TtlCache<LenientActivationMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientActivationMetricStore,
    cacheValue: cache.TtlCache<LenientActivationMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientActivationMetric | undefined {
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

  save(item: LenientActivationMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientActivationMetric[] {
    return this.inner.list();
  }
}

export function newCachedLenientActivationMetricStore(inner: LenientActivationMetricStore, ttl: number, clockValue: clock.Clock): LenientActivationMetricStore {
  return new CachedLenientActivationMetricStore(
    inner,
    cache.newTtlCache<LenientActivationMetric>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient activation metrics. Empty fields match all. */
export class LenientActivationMetricQuery {
  source: string;
  minRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minRate = minRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientActivationMetric): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.rate < this.minRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientActivationMetric[]): LenientActivationMetric[] {
    const matched = collections.filter(items, (candidate: LenientActivationMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientActivationMetrics(store: LenientActivationMetricStore, query: LenientActivationMetricQuery): LenientActivationMetric[] {
  return query.apply(store.list());
}
