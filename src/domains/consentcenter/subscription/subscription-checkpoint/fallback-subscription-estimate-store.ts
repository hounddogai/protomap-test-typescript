import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackSubscriptionEstimate } from "./fallback-subscription-estimate.js";

/** Keeps fallback subscription estimates by code. */
export interface FallbackSubscriptionEstimateStore {
  find(code: string): FallbackSubscriptionEstimate | undefined;
  save(item: FallbackSubscriptionEstimate): void;
  remove(code: string): boolean;
  list(): FallbackSubscriptionEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackSubscriptionEstimateStore implements FallbackSubscriptionEstimateStore {
  items: Map<string, FallbackSubscriptionEstimate>;
  order: string[];

  constructor(items: Map<string, FallbackSubscriptionEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackSubscriptionEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackSubscriptionEstimate): void {
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

  list(): FallbackSubscriptionEstimate[] {
    const out: FallbackSubscriptionEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackSubscriptionEstimateStore(): FallbackSubscriptionEstimateStore {
  return new MemoryFallbackSubscriptionEstimateStore(new Map<string, FallbackSubscriptionEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackSubscriptionEstimateStore implements FallbackSubscriptionEstimateStore {
  inner: FallbackSubscriptionEstimateStore;
  cache: cache.TtlCache<FallbackSubscriptionEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackSubscriptionEstimateStore,
    cacheValue: cache.TtlCache<FallbackSubscriptionEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackSubscriptionEstimate | undefined {
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

  save(item: FallbackSubscriptionEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackSubscriptionEstimate[] {
    return this.inner.list();
  }
}

export function newCachedFallbackSubscriptionEstimateStore(inner: FallbackSubscriptionEstimateStore, ttl: number, clockValue: clock.Clock): FallbackSubscriptionEstimateStore {
  return new CachedFallbackSubscriptionEstimateStore(
    inner,
    cache.newTtlCache<FallbackSubscriptionEstimate>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback subscription estimates. Empty fields match all. */
export class FallbackSubscriptionEstimateQuery {
  category: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minQuantity: number, statuses: string[], limit: number) {
    this.category = category;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackSubscriptionEstimate): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackSubscriptionEstimate[]): FallbackSubscriptionEstimate[] {
    const matched = collections.filter(items, (candidate: FallbackSubscriptionEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackSubscriptionEstimates(store: FallbackSubscriptionEstimateStore, query: FallbackSubscriptionEstimateQuery): FallbackSubscriptionEstimate[] {
  return query.apply(store.list());
}
