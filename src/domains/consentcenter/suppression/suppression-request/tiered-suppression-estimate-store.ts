import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredSuppressionEstimate } from "./tiered-suppression-estimate.js";

/** Keeps tiered suppression estimates by code. */
export interface TieredSuppressionEstimateStore {
  find(code: string): TieredSuppressionEstimate | undefined;
  save(item: TieredSuppressionEstimate): void;
  remove(code: string): boolean;
  list(): TieredSuppressionEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredSuppressionEstimateStore implements TieredSuppressionEstimateStore {
  items: Map<string, TieredSuppressionEstimate>;
  order: string[];

  constructor(items: Map<string, TieredSuppressionEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredSuppressionEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredSuppressionEstimate): void {
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

  list(): TieredSuppressionEstimate[] {
    const out: TieredSuppressionEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredSuppressionEstimateStore(): TieredSuppressionEstimateStore {
  return new MemoryTieredSuppressionEstimateStore(new Map<string, TieredSuppressionEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredSuppressionEstimateStore implements TieredSuppressionEstimateStore {
  inner: TieredSuppressionEstimateStore;
  cache: cache.TtlCache<TieredSuppressionEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredSuppressionEstimateStore,
    cacheValue: cache.TtlCache<TieredSuppressionEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredSuppressionEstimate | undefined {
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

  save(item: TieredSuppressionEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredSuppressionEstimate[] {
    return this.inner.list();
  }
}

export function newCachedTieredSuppressionEstimateStore(inner: TieredSuppressionEstimateStore, ttl: number, clockValue: clock.Clock): TieredSuppressionEstimateStore {
  return new CachedTieredSuppressionEstimateStore(
    inner,
    cache.newTtlCache<TieredSuppressionEstimate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered suppression estimates. Empty fields match all. */
export class TieredSuppressionEstimateQuery {
  country: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCapacity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredSuppressionEstimate): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredSuppressionEstimate[]): TieredSuppressionEstimate[] {
    const matched = collections.filter(items, (candidate: TieredSuppressionEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredSuppressionEstimates(store: TieredSuppressionEstimateStore, query: TieredSuppressionEstimateQuery): TieredSuppressionEstimate[] {
  return query.apply(store.list());
}
