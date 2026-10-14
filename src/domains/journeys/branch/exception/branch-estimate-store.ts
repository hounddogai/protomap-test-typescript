import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchEstimate } from "./branch-estimate.js";

/** Keeps branch estimates by code. */
export interface BranchEstimateStore {
  find(code: string): BranchEstimate | undefined;
  save(item: BranchEstimate): void;
  remove(code: string): boolean;
  list(): BranchEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchEstimateStore implements BranchEstimateStore {
  items: Map<string, BranchEstimate>;
  order: string[];

  constructor(items: Map<string, BranchEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchEstimate): void {
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

  list(): BranchEstimate[] {
    const out: BranchEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchEstimateStore(): BranchEstimateStore {
  return new MemoryBranchEstimateStore(new Map<string, BranchEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchEstimateStore implements BranchEstimateStore {
  inner: BranchEstimateStore;
  cache: cache.TtlCache<BranchEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchEstimateStore,
    cacheValue: cache.TtlCache<BranchEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchEstimate | undefined {
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

  save(item: BranchEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchEstimate[] {
    return this.inner.list();
  }
}

export function newCachedBranchEstimateStore(inner: BranchEstimateStore, ttl: number, clockValue: clock.Clock): BranchEstimateStore {
  return new CachedBranchEstimateStore(inner, cache.newTtlCache<BranchEstimate>(256, ttl, clockValue), 0, 0);
}

/** Selects branch estimates. Empty fields match all. */
export class BranchEstimateQuery {
  title: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minRatio: number, statuses: string[], limit: number) {
    this.title = title;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchEstimate): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchEstimate[]): BranchEstimate[] {
    const matched = collections.filter(items, (candidate: BranchEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchEstimates(store: BranchEstimateStore, query: BranchEstimateQuery): BranchEstimate[] {
  return query.apply(store.list());
}
