import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardAdjustment } from "./reward-adjustment.js";

/** Keeps reward adjustments by code. */
export interface RewardAdjustmentStore {
  find(code: string): RewardAdjustment | undefined;
  save(item: RewardAdjustment): void;
  remove(code: string): boolean;
  list(): RewardAdjustment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardAdjustmentStore implements RewardAdjustmentStore {
  items: Map<string, RewardAdjustment>;
  order: string[];

  constructor(items: Map<string, RewardAdjustment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardAdjustment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardAdjustment): void {
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

  list(): RewardAdjustment[] {
    const out: RewardAdjustment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardAdjustmentStore(): RewardAdjustmentStore {
  return new MemoryRewardAdjustmentStore(new Map<string, RewardAdjustment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardAdjustmentStore implements RewardAdjustmentStore {
  inner: RewardAdjustmentStore;
  cache: cache.TtlCache<RewardAdjustment>;
  hits: number;
  misses: number;

  constructor(
    inner: RewardAdjustmentStore,
    cacheValue: cache.TtlCache<RewardAdjustment>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardAdjustment | undefined {
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

  save(item: RewardAdjustment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardAdjustment[] {
    return this.inner.list();
  }
}

export function newCachedRewardAdjustmentStore(inner: RewardAdjustmentStore, ttl: number, clockValue: clock.Clock): RewardAdjustmentStore {
  return new CachedRewardAdjustmentStore(inner, cache.newTtlCache<RewardAdjustment>(256, ttl, clockValue), 0, 0);
}

/** Selects reward adjustments. Empty fields match all. */
export class RewardAdjustmentQuery {
  segment: string;
  minSequence: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minSequence: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minSequence = minSequence;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardAdjustment): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.sequence < this.minSequence) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardAdjustment[]): RewardAdjustment[] {
    const matched = collections.filter(items, (candidate: RewardAdjustment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardAdjustments(store: RewardAdjustmentStore, query: RewardAdjustmentQuery): RewardAdjustment[] {
  return query.apply(store.list());
}
