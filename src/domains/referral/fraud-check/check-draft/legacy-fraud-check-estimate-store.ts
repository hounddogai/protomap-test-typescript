import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LegacyFraudCheckEstimate } from "./legacy-fraud-check-estimate.js";

/** Keeps legacy fraud check estimates by code. */
export interface LegacyFraudCheckEstimateStore {
  find(code: string): LegacyFraudCheckEstimate | undefined;
  save(item: LegacyFraudCheckEstimate): void;
  remove(code: string): boolean;
  list(): LegacyFraudCheckEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLegacyFraudCheckEstimateStore implements LegacyFraudCheckEstimateStore {
  items: Map<string, LegacyFraudCheckEstimate>;
  order: string[];

  constructor(items: Map<string, LegacyFraudCheckEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LegacyFraudCheckEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LegacyFraudCheckEstimate): void {
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

  list(): LegacyFraudCheckEstimate[] {
    const out: LegacyFraudCheckEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLegacyFraudCheckEstimateStore(): LegacyFraudCheckEstimateStore {
  return new MemoryLegacyFraudCheckEstimateStore(new Map<string, LegacyFraudCheckEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLegacyFraudCheckEstimateStore implements LegacyFraudCheckEstimateStore {
  inner: LegacyFraudCheckEstimateStore;
  cache: cache.TtlCache<LegacyFraudCheckEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: LegacyFraudCheckEstimateStore,
    cacheValue: cache.TtlCache<LegacyFraudCheckEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LegacyFraudCheckEstimate | undefined {
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

  save(item: LegacyFraudCheckEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LegacyFraudCheckEstimate[] {
    return this.inner.list();
  }
}

export function newCachedLegacyFraudCheckEstimateStore(inner: LegacyFraudCheckEstimateStore, ttl: number, clockValue: clock.Clock): LegacyFraudCheckEstimateStore {
  return new CachedLegacyFraudCheckEstimateStore(
    inner,
    cache.newTtlCache<LegacyFraudCheckEstimate>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects legacy fraud check estimates. Empty fields match all. */
export class LegacyFraudCheckEstimateQuery {
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

  matches(item: LegacyFraudCheckEstimate): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LegacyFraudCheckEstimate[]): LegacyFraudCheckEstimate[] {
    const matched = collections.filter(items, (candidate: LegacyFraudCheckEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLegacyFraudCheckEstimates(store: LegacyFraudCheckEstimateStore, query: LegacyFraudCheckEstimateQuery): LegacyFraudCheckEstimate[] {
  return query.apply(store.list());
}
