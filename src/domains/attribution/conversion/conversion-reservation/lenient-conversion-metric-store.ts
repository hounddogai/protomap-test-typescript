import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LenientConversionMetric } from "./lenient-conversion-metric.js";

/** Keeps lenient conversion metrics by code. */
export interface LenientConversionMetricStore {
  find(code: string): LenientConversionMetric | undefined;
  save(item: LenientConversionMetric): void;
  remove(code: string): boolean;
  list(): LenientConversionMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLenientConversionMetricStore implements LenientConversionMetricStore {
  items: Map<string, LenientConversionMetric>;
  order: string[];

  constructor(items: Map<string, LenientConversionMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LenientConversionMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LenientConversionMetric): void {
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

  list(): LenientConversionMetric[] {
    const out: LenientConversionMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLenientConversionMetricStore(): LenientConversionMetricStore {
  return new MemoryLenientConversionMetricStore(new Map<string, LenientConversionMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLenientConversionMetricStore implements LenientConversionMetricStore {
  inner: LenientConversionMetricStore;
  cache: cache.TtlCache<LenientConversionMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: LenientConversionMetricStore,
    cacheValue: cache.TtlCache<LenientConversionMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LenientConversionMetric | undefined {
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

  save(item: LenientConversionMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LenientConversionMetric[] {
    return this.inner.list();
  }
}

export function newCachedLenientConversionMetricStore(inner: LenientConversionMetricStore, ttl: number, clockValue: clock.Clock): LenientConversionMetricStore {
  return new CachedLenientConversionMetricStore(
    inner,
    cache.newTtlCache<LenientConversionMetric>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects lenient conversion metrics. Empty fields match all. */
export class LenientConversionMetricQuery {
  channel: string;
  minWeight: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minWeight: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minWeight = minWeight;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LenientConversionMetric): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.weight < this.minWeight) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LenientConversionMetric[]): LenientConversionMetric[] {
    const matched = collections.filter(items, (candidate: LenientConversionMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLenientConversionMetrics(store: LenientConversionMetricStore, query: LenientConversionMetricQuery): LenientConversionMetric[] {
  return query.apply(store.list());
}
