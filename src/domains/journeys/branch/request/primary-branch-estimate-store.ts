import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryBranchEstimate } from "./primary-branch-estimate.js";

/** Keeps primary branch estimates by code. */
export interface PrimaryBranchEstimateStore {
  find(code: string): PrimaryBranchEstimate | undefined;
  save(item: PrimaryBranchEstimate): void;
  remove(code: string): boolean;
  list(): PrimaryBranchEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryBranchEstimateStore implements PrimaryBranchEstimateStore {
  items: Map<string, PrimaryBranchEstimate>;
  order: string[];

  constructor(items: Map<string, PrimaryBranchEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryBranchEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryBranchEstimate): void {
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

  list(): PrimaryBranchEstimate[] {
    const out: PrimaryBranchEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryBranchEstimateStore(): PrimaryBranchEstimateStore {
  return new MemoryPrimaryBranchEstimateStore(new Map<string, PrimaryBranchEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryBranchEstimateStore implements PrimaryBranchEstimateStore {
  inner: PrimaryBranchEstimateStore;
  cache: cache.TtlCache<PrimaryBranchEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryBranchEstimateStore,
    cacheValue: cache.TtlCache<PrimaryBranchEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryBranchEstimate | undefined {
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

  save(item: PrimaryBranchEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryBranchEstimate[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryBranchEstimateStore(inner: PrimaryBranchEstimateStore, ttl: number, clockValue: clock.Clock): PrimaryBranchEstimateStore {
  return new CachedPrimaryBranchEstimateStore(
    inner,
    cache.newTtlCache<PrimaryBranchEstimate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary branch estimates. Empty fields match all. */
export class PrimaryBranchEstimateQuery {
  locale: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMargin: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryBranchEstimate): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryBranchEstimate[]): PrimaryBranchEstimate[] {
    const matched = collections.filter(items, (candidate: PrimaryBranchEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryBranchEstimates(store: PrimaryBranchEstimateStore, query: PrimaryBranchEstimateQuery): PrimaryBranchEstimate[] {
  return query.apply(store.list());
}
