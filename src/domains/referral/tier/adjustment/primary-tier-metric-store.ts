import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryTierMetric } from "./primary-tier-metric.js";

/** Keeps primary tier metrics by code. */
export interface PrimaryTierMetricStore {
  find(code: string): PrimaryTierMetric | undefined;
  save(item: PrimaryTierMetric): void;
  remove(code: string): boolean;
  list(): PrimaryTierMetric[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryTierMetricStore implements PrimaryTierMetricStore {
  items: Map<string, PrimaryTierMetric>;
  order: string[];

  constructor(items: Map<string, PrimaryTierMetric>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryTierMetric | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryTierMetric): void {
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

  list(): PrimaryTierMetric[] {
    const out: PrimaryTierMetric[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryTierMetricStore(): PrimaryTierMetricStore {
  return new MemoryPrimaryTierMetricStore(new Map<string, PrimaryTierMetric>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryTierMetricStore implements PrimaryTierMetricStore {
  inner: PrimaryTierMetricStore;
  cache: cache.TtlCache<PrimaryTierMetric>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryTierMetricStore,
    cacheValue: cache.TtlCache<PrimaryTierMetric>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryTierMetric | undefined {
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

  save(item: PrimaryTierMetric): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryTierMetric[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryTierMetricStore(inner: PrimaryTierMetricStore, ttl: number, clockValue: clock.Clock): PrimaryTierMetricStore {
  return new CachedPrimaryTierMetricStore(inner, cache.newTtlCache<PrimaryTierMetric>(1024, ttl, clockValue), 0, 0);
}

/** Selects primary tier metrics. Empty fields match all. */
export class PrimaryTierMetricQuery {
  name: string;
  minPriority: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minPriority: number, statuses: string[], limit: number) {
    this.name = name;
    this.minPriority = minPriority;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryTierMetric): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.priority < this.minPriority) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryTierMetric[]): PrimaryTierMetric[] {
    const matched = collections.filter(items, (candidate: PrimaryTierMetric): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryTierMetrics(store: PrimaryTierMetricStore, query: PrimaryTierMetricQuery): PrimaryTierMetric[] {
  return query.apply(store.list());
}
