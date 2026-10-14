import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredActivationEstimate } from "./tiered-activation-estimate.js";

/** Keeps tiered activation estimates by code. */
export interface TieredActivationEstimateStore {
  find(code: string): TieredActivationEstimate | undefined;
  save(item: TieredActivationEstimate): void;
  remove(code: string): boolean;
  list(): TieredActivationEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredActivationEstimateStore implements TieredActivationEstimateStore {
  items: Map<string, TieredActivationEstimate>;
  order: string[];

  constructor(items: Map<string, TieredActivationEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredActivationEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredActivationEstimate): void {
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

  list(): TieredActivationEstimate[] {
    const out: TieredActivationEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredActivationEstimateStore(): TieredActivationEstimateStore {
  return new MemoryTieredActivationEstimateStore(new Map<string, TieredActivationEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredActivationEstimateStore implements TieredActivationEstimateStore {
  inner: TieredActivationEstimateStore;
  cache: cache.TtlCache<TieredActivationEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredActivationEstimateStore,
    cacheValue: cache.TtlCache<TieredActivationEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredActivationEstimate | undefined {
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

  save(item: TieredActivationEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredActivationEstimate[] {
    return this.inner.list();
  }
}

export function newCachedTieredActivationEstimateStore(inner: TieredActivationEstimateStore, ttl: number, clockValue: clock.Clock): TieredActivationEstimateStore {
  return new CachedTieredActivationEstimateStore(
    inner,
    cache.newTtlCache<TieredActivationEstimate>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered activation estimates. Empty fields match all. */
export class TieredActivationEstimateQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredActivationEstimate): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredActivationEstimate[]): TieredActivationEstimate[] {
    const matched = collections.filter(items, (candidate: TieredActivationEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredActivationEstimates(store: TieredActivationEstimateStore, query: TieredActivationEstimateQuery): TieredActivationEstimate[] {
  return query.apply(store.list());
}
