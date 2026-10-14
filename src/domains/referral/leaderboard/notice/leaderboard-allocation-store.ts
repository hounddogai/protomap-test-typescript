import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardAllocation } from "./leaderboard-allocation.js";

/** Keeps leaderboard allocations by code. */
export interface LeaderboardAllocationStore {
  find(code: string): LeaderboardAllocation | undefined;
  save(item: LeaderboardAllocation): void;
  remove(code: string): boolean;
  list(): LeaderboardAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardAllocationStore implements LeaderboardAllocationStore {
  items: Map<string, LeaderboardAllocation>;
  order: string[];

  constructor(items: Map<string, LeaderboardAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardAllocation): void {
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

  list(): LeaderboardAllocation[] {
    const out: LeaderboardAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardAllocationStore(): LeaderboardAllocationStore {
  return new MemoryLeaderboardAllocationStore(new Map<string, LeaderboardAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardAllocationStore implements LeaderboardAllocationStore {
  inner: LeaderboardAllocationStore;
  cache: cache.TtlCache<LeaderboardAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardAllocationStore,
    cacheValue: cache.TtlCache<LeaderboardAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardAllocation | undefined {
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

  save(item: LeaderboardAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardAllocation[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardAllocationStore(inner: LeaderboardAllocationStore, ttl: number, clockValue: clock.Clock): LeaderboardAllocationStore {
  return new CachedLeaderboardAllocationStore(
    inner,
    cache.newTtlCache<LeaderboardAllocation>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects leaderboard allocations. Empty fields match all. */
export class LeaderboardAllocationQuery {
  category: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardAllocation): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardAllocation[]): LeaderboardAllocation[] {
    const matched = collections.filter(items, (candidate: LeaderboardAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardAllocations(store: LeaderboardAllocationStore, query: LeaderboardAllocationQuery): LeaderboardAllocation[] {
  return query.apply(store.list());
}
