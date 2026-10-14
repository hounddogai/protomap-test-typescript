import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingSuppressionEstimate } from "./pending-suppression-estimate.js";

/** Keeps pending suppression estimates by code. */
export interface PendingSuppressionEstimateStore {
  find(code: string): PendingSuppressionEstimate | undefined;
  save(item: PendingSuppressionEstimate): void;
  remove(code: string): boolean;
  list(): PendingSuppressionEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingSuppressionEstimateStore implements PendingSuppressionEstimateStore {
  items: Map<string, PendingSuppressionEstimate>;
  order: string[];

  constructor(items: Map<string, PendingSuppressionEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingSuppressionEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingSuppressionEstimate): void {
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

  list(): PendingSuppressionEstimate[] {
    const out: PendingSuppressionEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingSuppressionEstimateStore(): PendingSuppressionEstimateStore {
  return new MemoryPendingSuppressionEstimateStore(new Map<string, PendingSuppressionEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingSuppressionEstimateStore implements PendingSuppressionEstimateStore {
  inner: PendingSuppressionEstimateStore;
  cache: cache.TtlCache<PendingSuppressionEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingSuppressionEstimateStore,
    cacheValue: cache.TtlCache<PendingSuppressionEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingSuppressionEstimate | undefined {
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

  save(item: PendingSuppressionEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingSuppressionEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPendingSuppressionEstimateStore(inner: PendingSuppressionEstimateStore, ttl: number, clockValue: clock.Clock): PendingSuppressionEstimateStore {
  return new CachedPendingSuppressionEstimateStore(
    inner,
    cache.newTtlCache<PendingSuppressionEstimate>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending suppression estimates. Empty fields match all. */
export class PendingSuppressionEstimateQuery {
  name: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBudget: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingSuppressionEstimate): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingSuppressionEstimate[]): PendingSuppressionEstimate[] {
    const matched = collections.filter(items, (candidate: PendingSuppressionEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingSuppressionEstimates(store: PendingSuppressionEstimateStore, query: PendingSuppressionEstimateQuery): PendingSuppressionEstimate[] {
  return query.apply(store.list());
}
