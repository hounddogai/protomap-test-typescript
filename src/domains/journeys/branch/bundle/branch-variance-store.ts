import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BranchVariance } from "./branch-variance.js";

/** Keeps branch variances by code. */
export interface BranchVarianceStore {
  find(code: string): BranchVariance | undefined;
  save(item: BranchVariance): void;
  remove(code: string): boolean;
  list(): BranchVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBranchVarianceStore implements BranchVarianceStore {
  items: Map<string, BranchVariance>;
  order: string[];

  constructor(items: Map<string, BranchVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BranchVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BranchVariance): void {
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

  list(): BranchVariance[] {
    const out: BranchVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBranchVarianceStore(): BranchVarianceStore {
  return new MemoryBranchVarianceStore(new Map<string, BranchVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBranchVarianceStore implements BranchVarianceStore {
  inner: BranchVarianceStore;
  cache: cache.TtlCache<BranchVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: BranchVarianceStore,
    cacheValue: cache.TtlCache<BranchVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BranchVariance | undefined {
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

  save(item: BranchVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BranchVariance[] {
    return this.inner.list();
  }
}

export function newCachedBranchVarianceStore(inner: BranchVarianceStore, ttl: number, clockValue: clock.Clock): BranchVarianceStore {
  return new CachedBranchVarianceStore(inner, cache.newTtlCache<BranchVariance>(256, ttl, clockValue), 0, 0);
}

/** Selects branch variances. Empty fields match all. */
export class BranchVarianceQuery {
  label: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BranchVariance): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BranchVariance[]): BranchVariance[] {
    const matched = collections.filter(items, (candidate: BranchVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBranchVariances(store: BranchVarianceStore, query: BranchVarianceQuery): BranchVariance[] {
  return query.apply(store.list());
}
