import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BounceThreshold } from "./bounce-threshold.js";

/** Keeps bounce thresholds by code. */
export interface BounceThresholdStore {
  find(code: string): BounceThreshold | undefined;
  save(item: BounceThreshold): void;
  remove(code: string): boolean;
  list(): BounceThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBounceThresholdStore implements BounceThresholdStore {
  items: Map<string, BounceThreshold>;
  order: string[];

  constructor(items: Map<string, BounceThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BounceThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BounceThreshold): void {
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

  list(): BounceThreshold[] {
    const out: BounceThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBounceThresholdStore(): BounceThresholdStore {
  return new MemoryBounceThresholdStore(new Map<string, BounceThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBounceThresholdStore implements BounceThresholdStore {
  inner: BounceThresholdStore;
  cache: cache.TtlCache<BounceThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: BounceThresholdStore,
    cacheValue: cache.TtlCache<BounceThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BounceThreshold | undefined {
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

  save(item: BounceThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BounceThreshold[] {
    return this.inner.list();
  }
}

export function newCachedBounceThresholdStore(inner: BounceThresholdStore, ttl: number, clockValue: clock.Clock): BounceThresholdStore {
  return new CachedBounceThresholdStore(inner, cache.newTtlCache<BounceThreshold>(1024, ttl, clockValue), 0, 0);
}

/** Selects bounce thresholds. Empty fields match all. */
export class BounceThresholdQuery {
  category: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minCost: number, statuses: string[], limit: number) {
    this.category = category;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BounceThreshold): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BounceThreshold[]): BounceThreshold[] {
    const matched = collections.filter(items, (candidate: BounceThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBounceThresholds(store: BounceThresholdStore, query: BounceThresholdQuery): BounceThreshold[] {
  return query.apply(store.list());
}
