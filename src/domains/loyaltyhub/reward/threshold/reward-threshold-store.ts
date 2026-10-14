import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardThreshold } from "./reward-threshold.js";

/** Keeps reward thresholds by code. */
export interface RewardThresholdStore {
  find(code: string): RewardThreshold | undefined;
  save(item: RewardThreshold): void;
  remove(code: string): boolean;
  list(): RewardThreshold[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardThresholdStore implements RewardThresholdStore {
  items: Map<string, RewardThreshold>;
  order: string[];

  constructor(items: Map<string, RewardThreshold>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardThreshold | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardThreshold): void {
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

  list(): RewardThreshold[] {
    const out: RewardThreshold[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardThresholdStore(): RewardThresholdStore {
  return new MemoryRewardThresholdStore(new Map<string, RewardThreshold>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardThresholdStore implements RewardThresholdStore {
  inner: RewardThresholdStore;
  cache: cache.TtlCache<RewardThreshold>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardThresholdStore,
    cacheValue: cache.TtlCache<RewardThreshold>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardThreshold | undefined {
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

  save(item: RewardThreshold): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardThreshold[] {
    return this.inner.list();
  }
}

export function newCachedRewardThresholdStore(inner: RewardThresholdStore, ttl: number, clockValue: clock.Clock): RewardThresholdStore {
  return new CachedRewardThresholdStore(inner, cache.newTtlCache<RewardThreshold>(64, ttl, clockValue), 0, 0);
}

/** Selects reward thresholds. Empty fields match all. */
export class RewardThresholdQuery {
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

  matches(item: RewardThreshold): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardThreshold[]): RewardThreshold[] {
    const matched = collections.filter(items, (candidate: RewardThreshold): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardThresholds(store: RewardThresholdStore, query: RewardThresholdQuery): RewardThreshold[] {
  return query.apply(store.list());
}
