import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RewardSegment } from "./reward-segment.js";

/** Keeps reward segments by code. */
export interface RewardSegmentStore {
  find(code: string): RewardSegment | undefined;
  save(item: RewardSegment): void;
  remove(code: string): boolean;
  list(): RewardSegment[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRewardSegmentStore implements RewardSegmentStore {
  items: Map<string, RewardSegment>;
  order: string[];

  constructor(items: Map<string, RewardSegment>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RewardSegment | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RewardSegment): void {
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

  list(): RewardSegment[] {
    const out: RewardSegment[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRewardSegmentStore(): RewardSegmentStore {
  return new MemoryRewardSegmentStore(new Map<string, RewardSegment>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRewardSegmentStore implements RewardSegmentStore {
  inner: RewardSegmentStore;
  cache: cache.TtlCache<RewardSegment>;
  hits: number;
  misses: number;

  constructor(inner: RewardSegmentStore, cacheValue: cache.TtlCache<RewardSegment>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RewardSegment | undefined {
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

  save(item: RewardSegment): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RewardSegment[] {
    return this.inner.list();
  }
}

export function newCachedRewardSegmentStore(inner: RewardSegmentStore, ttl: number, clockValue: clock.Clock): RewardSegmentStore {
  return new CachedRewardSegmentStore(inner, cache.newTtlCache<RewardSegment>(256, ttl, clockValue), 0, 0);
}

/** Selects reward segments. Empty fields match all. */
export class RewardSegmentQuery {
  category: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minOpenRate: number, statuses: string[], limit: number) {
    this.category = category;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RewardSegment): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RewardSegment[]): RewardSegment[] {
    const matched = collections.filter(items, (candidate: RewardSegment): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRewardSegments(store: RewardSegmentStore, query: RewardSegmentQuery): RewardSegment[] {
  return query.apply(store.list());
}
