import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredRewardEstimate } from "./tiered-reward-estimate.js";

/** Keeps tiered reward estimates by code. */
export interface TieredRewardEstimateStore {
  find(code: string): TieredRewardEstimate | undefined;
  save(item: TieredRewardEstimate): void;
  remove(code: string): boolean;
  list(): TieredRewardEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredRewardEstimateStore implements TieredRewardEstimateStore {
  items: Map<string, TieredRewardEstimate>;
  order: string[];

  constructor(items: Map<string, TieredRewardEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredRewardEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredRewardEstimate): void {
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

  list(): TieredRewardEstimate[] {
    const out: TieredRewardEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredRewardEstimateStore(): TieredRewardEstimateStore {
  return new MemoryTieredRewardEstimateStore(new Map<string, TieredRewardEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredRewardEstimateStore implements TieredRewardEstimateStore {
  inner: TieredRewardEstimateStore;
  cache: cache.TtlCache<TieredRewardEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredRewardEstimateStore,
    cacheValue: cache.TtlCache<TieredRewardEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredRewardEstimate | undefined {
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

  save(item: TieredRewardEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredRewardEstimate[] {
    return this.inner.list();
  }
}

export function newCachedTieredRewardEstimateStore(inner: TieredRewardEstimateStore, ttl: number, clockValue: clock.Clock): TieredRewardEstimateStore {
  return new CachedTieredRewardEstimateStore(inner, cache.newTtlCache<TieredRewardEstimate>(64, ttl, clockValue), 0, 0);
}

/** Selects tiered reward estimates. Empty fields match all. */
export class TieredRewardEstimateQuery {
  channel: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minStartsAt: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredRewardEstimate): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredRewardEstimate[]): TieredRewardEstimate[] {
    const matched = collections.filter(items, (candidate: TieredRewardEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredRewardEstimates(store: TieredRewardEstimateStore, query: TieredRewardEstimateQuery): TieredRewardEstimate[] {
  return query.apply(store.list());
}
