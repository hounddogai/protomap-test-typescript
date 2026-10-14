import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultConversionMetric } from "./default-conversion-metric.js";

/** Keeps default conversion metrics by code. */
export interface DefaultConversionMetricStore {
  find(code: string): DefaultConversionMetric | undefined;
  save(item: DefaultConversionMetric): void;
  remove(code: string): boolean;
  list(): DefaultConversionMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultConversionMetricStore implements DefaultConversionMetricStore {
  items: Map<string, DefaultConversionMetric>;
  order: string[];

  constructor(items: Map<string, DefaultConversionMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultConversionMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultConversionMetric): void {
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

  list(): DefaultConversionMetric[] {
    const out: DefaultConversionMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultConversionMetricStore(): DefaultConversionMetricStore {
  return new MemoryDefaultConversionMetricStore(new Map<string, DefaultConversionMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultConversionMetricStore implements DefaultConversionMetricStore {
  inner: DefaultConversionMetricStore;
  cache: cache.TtlCache<DefaultConversionMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultConversionMetricStore,
    cacheValue: cache.TtlCache<DefaultConversionMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultConversionMetric | undefined {
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

  save(item: DefaultConversionMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultConversionMetric[] {
    return this.inner.list();
  }
}

export function newCachedDefaultConversionMetricStore(inner: DefaultConversionMetricStore, ttl: number, clockValue: clock.Clock): DefaultConversionMetricStore {
  return new CachedDefaultConversionMetricStore(
    inner,
    cache.newTtlCache<DefaultConversionMetric>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects default conversion metrics. Empty fields match all. */
export class DefaultConversionMetricQuery {
  label: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minLimit: number, statuses: string[], limit: number) {
    this.label = label;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultConversionMetric): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultConversionMetric[]): DefaultConversionMetric[] {
    const matched = collections.filter(items, (candidate: DefaultConversionMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultConversionMetrics(store: DefaultConversionMetricStore, query: DefaultConversionMetricQuery): DefaultConversionMetric[] {
  return query.apply(store.list());
}
