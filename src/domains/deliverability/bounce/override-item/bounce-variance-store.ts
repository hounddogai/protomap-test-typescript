import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceVariance } from "./bounce-variance.js";

/** Keeps bounce variances by code. */
export interface BounceVarianceStore {
  find(code: string): BounceVariance | undefined;
  save(item: BounceVariance): void;
  remove(code: string): boolean;
  list(): BounceVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceVarianceStore implements BounceVarianceStore {
  items: Map<string, BounceVariance>;
  order: string[];

  constructor(items: Map<string, BounceVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceVariance): void {
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

  list(): BounceVariance[] {
    const out: BounceVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceVarianceStore(): BounceVarianceStore {
  return new MemoryBounceVarianceStore(new Map<string, BounceVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceVarianceStore implements BounceVarianceStore {
  inner: BounceVarianceStore;
  cache: cache.TtlCache<BounceVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: BounceVarianceStore,
    cacheValue: cache.TtlCache<BounceVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceVariance | undefined {
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

  save(item: BounceVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceVariance[] {
    return this.inner.list();
  }
}

export function newCachedBounceVarianceStore(inner: BounceVarianceStore, ttl: number, clockValue: clock.Clock): BounceVarianceStore {
  return new CachedBounceVarianceStore(inner, cache.newTtlCache<BounceVariance>(512, ttl, clockValue), 0, 0);
}

/** Selects bounce variances. Empty fields match all. */
export class BounceVarianceQuery {
  name: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minClicks: number, statuses: string[], limit: number) {
    this.name = name;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceVariance): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceVariance[]): BounceVariance[] {
    const matched = collections.filter(items, (candidate: BounceVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceVariances(store: BounceVarianceStore, query: BounceVarianceQuery): BounceVariance[] {
  return query.apply(store.list());
}
