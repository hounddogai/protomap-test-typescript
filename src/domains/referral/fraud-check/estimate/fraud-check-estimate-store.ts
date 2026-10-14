import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FraudCheckEstimate } from "./fraud-check-estimate.js";

/** Keeps fraud check estimates by code. */
export interface FraudCheckEstimateStore {
  find(code: string): FraudCheckEstimate | undefined;
  save(item: FraudCheckEstimate): void;
  remove(code: string): boolean;
  list(): FraudCheckEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFraudCheckEstimateStore implements FraudCheckEstimateStore {
  items: Map<string, FraudCheckEstimate>;
  order: string[];

  constructor(items: Map<string, FraudCheckEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FraudCheckEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FraudCheckEstimate): void {
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

  list(): FraudCheckEstimate[] {
    const out: FraudCheckEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFraudCheckEstimateStore(): FraudCheckEstimateStore {
  return new MemoryFraudCheckEstimateStore(new Map<string, FraudCheckEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFraudCheckEstimateStore implements FraudCheckEstimateStore {
  inner: FraudCheckEstimateStore;
  cache: cache.TtlCache<FraudCheckEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: FraudCheckEstimateStore,
    cacheValue: cache.TtlCache<FraudCheckEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FraudCheckEstimate | undefined {
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

  save(item: FraudCheckEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FraudCheckEstimate[] {
    return this.inner.list();
  }
}

export function newCachedFraudCheckEstimateStore(inner: FraudCheckEstimateStore, ttl: number, clockValue: clock.Clock): FraudCheckEstimateStore {
  return new CachedFraudCheckEstimateStore(inner, cache.newTtlCache<FraudCheckEstimate>(512, ttl, clockValue), 0, 0);
}

/** Selects fraud check estimates. Empty fields match all. */
export class FraudCheckEstimateQuery {
  country: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minLimit: number, statuses: string[], limit: number) {
    this.country = country;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FraudCheckEstimate): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FraudCheckEstimate[]): FraudCheckEstimate[] {
    const matched = collections.filter(items, (candidate: FraudCheckEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFraudCheckEstimates(store: FraudCheckEstimateStore, query: FraudCheckEstimateQuery): FraudCheckEstimate[] {
  return query.apply(store.list());
}
