import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierEstimate } from "./tier-estimate.js";

/** Keeps tier estimates by code. */
export interface TierEstimateStore {
  find(code: string): TierEstimate | undefined;
  save(item: TierEstimate): void;
  remove(code: string): boolean;
  list(): TierEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierEstimateStore implements TierEstimateStore {
  items: Map<string, TierEstimate>;
  order: string[];

  constructor(items: Map<string, TierEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierEstimate): void {
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

  list(): TierEstimate[] {
    const out: TierEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierEstimateStore(): TierEstimateStore {
  return new MemoryTierEstimateStore(new Map<string, TierEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierEstimateStore implements TierEstimateStore {
  inner: TierEstimateStore;
  cache: cache.TtlCache<TierEstimate>;
  hits: number;
  misses: number;

  constructor(inner: TierEstimateStore, cacheValue: cache.TtlCache<TierEstimate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierEstimate | undefined {
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

  save(item: TierEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierEstimate[] {
    return this.inner.list();
  }
}

export function newCachedTierEstimateStore(inner: TierEstimateStore, ttl: number, clockValue: clock.Clock): TierEstimateStore {
  return new CachedTierEstimateStore(inner, cache.newTtlCache<TierEstimate>(64, ttl, clockValue), 0, 0);
}

/** Selects tier estimates. Empty fields match all. */
export class TierEstimateQuery {
  segment: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRatio: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierEstimate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierEstimate[]): TierEstimate[] {
    const matched = collections.filter(items, (candidate: TierEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierEstimates(store: TierEstimateStore, query: TierEstimateQuery): TierEstimate[] {
  return query.apply(store.list());
}
