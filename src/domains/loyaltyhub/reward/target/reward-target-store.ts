import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardTarget } from "./reward-target.js";

/** Keeps reward targets by code. */
export interface RewardTargetStore {
  find(code: string): RewardTarget | undefined;
  save(item: RewardTarget): void;
  remove(code: string): boolean;
  list(): RewardTarget[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardTargetStore implements RewardTargetStore {
  items: Map<string, RewardTarget>;
  order: string[];

  constructor(items: Map<string, RewardTarget>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardTarget | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardTarget): void {
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

  list(): RewardTarget[] {
    const out: RewardTarget[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardTargetStore(): RewardTargetStore {
  return new MemoryRewardTargetStore(new Map<string, RewardTarget>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardTargetStore implements RewardTargetStore {
  inner: RewardTargetStore;
  cache: cache.TtlCache<RewardTarget>;
  hits: number;
  misses: number;

  constructor(inner: RewardTargetStore, cacheValue: cache.TtlCache<RewardTarget>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardTarget | undefined {
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

  save(item: RewardTarget): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardTarget[] {
    return this.inner.list();
  }
}

export function newCachedRewardTargetStore(inner: RewardTargetStore, ttl: number, clockValue: clock.Clock): RewardTargetStore {
  return new CachedRewardTargetStore(inner, cache.newTtlCache<RewardTarget>(256, ttl, clockValue), 0, 0);
}

/** Selects reward targets. Empty fields match all. */
export class RewardTargetQuery {
  region: string;
  minCeiling: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minCeiling: number, statuses: string[], limit: number) {
    this.region = region;
    this.minCeiling = minCeiling;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardTarget): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.ceiling < this.minCeiling) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardTarget[]): RewardTarget[] {
    const matched = collections.filter(items, (candidate: RewardTarget): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardTargets(store: RewardTargetStore, query: RewardTargetQuery): RewardTarget[] {
  return query.apply(store.list());
}
