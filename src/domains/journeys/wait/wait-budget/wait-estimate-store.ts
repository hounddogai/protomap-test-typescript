import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WaitEstimate } from "./wait-estimate.js";

/** Keeps wait estimates by code. */
export interface WaitEstimateStore {
  find(code: string): WaitEstimate | undefined;
  save(item: WaitEstimate): void;
  remove(code: string): boolean;
  list(): WaitEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWaitEstimateStore implements WaitEstimateStore {
  items: Map<string, WaitEstimate>;
  order: string[];

  constructor(items: Map<string, WaitEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WaitEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WaitEstimate): void {
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

  list(): WaitEstimate[] {
    const out: WaitEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWaitEstimateStore(): WaitEstimateStore {
  return new MemoryWaitEstimateStore(new Map<string, WaitEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWaitEstimateStore implements WaitEstimateStore {
  inner: WaitEstimateStore;
  cache: cache.TtlCache<WaitEstimate>;
  hits: number;
  misses: number;

  constructor(inner: WaitEstimateStore, cacheValue: cache.TtlCache<WaitEstimate>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WaitEstimate | undefined {
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

  save(item: WaitEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WaitEstimate[] {
    return this.inner.list();
  }
}

export function newCachedWaitEstimateStore(inner: WaitEstimateStore, ttl: number, clockValue: clock.Clock): WaitEstimateStore {
  return new CachedWaitEstimateStore(inner, cache.newTtlCache<WaitEstimate>(512, ttl, clockValue), 0, 0);
}

/** Selects wait estimates. Empty fields match all. */
export class WaitEstimateQuery {
  segment: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBudget: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WaitEstimate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WaitEstimate[]): WaitEstimate[] {
    const matched = collections.filter(items, (candidate: WaitEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWaitEstimates(store: WaitEstimateStore, query: WaitEstimateQuery): WaitEstimate[] {
  return query.apply(store.list());
}
