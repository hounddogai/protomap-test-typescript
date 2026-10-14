import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardEstimate } from "./reward-estimate.js";

/** Keeps reward estimates by code. */
export interface RewardEstimateStore {
  find(code: string): RewardEstimate | undefined;
  save(item: RewardEstimate): void;
  remove(code: string): boolean;
  list(): RewardEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardEstimateStore implements RewardEstimateStore {
  items: Map<string, RewardEstimate>;
  order: string[];

  constructor(items: Map<string, RewardEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardEstimate): void {
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

  list(): RewardEstimate[] {
    const out: RewardEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardEstimateStore(): RewardEstimateStore {
  return new MemoryRewardEstimateStore(new Map<string, RewardEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardEstimateStore implements RewardEstimateStore {
  inner: RewardEstimateStore;
  cache: cache.TtlCache<RewardEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardEstimateStore,
    cacheValue: cache.TtlCache<RewardEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardEstimate | undefined {
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

  save(item: RewardEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardEstimate[] {
    return this.inner.list();
  }
}

export function newCachedRewardEstimateStore(inner: RewardEstimateStore, ttl: number, clockValue: clock.Clock): RewardEstimateStore {
  return new CachedRewardEstimateStore(inner, cache.newTtlCache<RewardEstimate>(128, ttl, clockValue), 0, 0);
}

/** Selects reward estimates. Empty fields match all. */
export class RewardEstimateQuery {
  segment: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minScore: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardEstimate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardEstimate[]): RewardEstimate[] {
    const matched = collections.filter(items, (candidate: RewardEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardEstimates(store: RewardEstimateStore, query: RewardEstimateQuery): RewardEstimate[] {
  return query.apply(store.list());
}
