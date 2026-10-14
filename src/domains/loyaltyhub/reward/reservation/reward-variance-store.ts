import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardVariance } from "./reward-variance.js";

/** Keeps reward variances by code. */
export interface RewardVarianceStore {
  find(code: string): RewardVariance | undefined;
  save(item: RewardVariance): void;
  remove(code: string): boolean;
  list(): RewardVariance[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardVarianceStore implements RewardVarianceStore {
  items: Map<string, RewardVariance>;
  order: string[];

  constructor(items: Map<string, RewardVariance>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardVariance | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardVariance): void {
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

  list(): RewardVariance[] {
    const out: RewardVariance[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardVarianceStore(): RewardVarianceStore {
  return new MemoryRewardVarianceStore(new Map<string, RewardVariance>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardVarianceStore implements RewardVarianceStore {
  inner: RewardVarianceStore;
  cache: cache.TtlCache<RewardVariance>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardVarianceStore,
    cacheValue: cache.TtlCache<RewardVariance>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardVariance | undefined {
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

  save(item: RewardVariance): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardVariance[] {
    return this.inner.list();
  }
}

export function newCachedRewardVarianceStore(inner: RewardVarianceStore, ttl: number, clockValue: clock.Clock): RewardVarianceStore {
  return new CachedRewardVarianceStore(inner, cache.newTtlCache<RewardVariance>(256, ttl, clockValue), 0, 0);
}

/** Selects reward variances. Empty fields match all. */
export class RewardVarianceQuery {
  source: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minQuantity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardVariance): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardVariance[]): RewardVariance[] {
    const matched = collections.filter(items, (candidate: RewardVariance): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardVariances(store: RewardVarianceStore, query: RewardVarianceQuery): RewardVariance[] {
  return query.apply(store.list());
}
