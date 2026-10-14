import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictLeaderboardAllocation } from "./strict-leaderboard-allocation.js";

/** Keeps strict leaderboard allocations by code. */
export interface StrictLeaderboardAllocationStore {
  find(code: string): StrictLeaderboardAllocation | undefined;
  save(item: StrictLeaderboardAllocation): void;
  remove(code: string): boolean;
  list(): StrictLeaderboardAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictLeaderboardAllocationStore implements StrictLeaderboardAllocationStore {
  items: Map<string, StrictLeaderboardAllocation>;
  order: string[];

  constructor(items: Map<string, StrictLeaderboardAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictLeaderboardAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictLeaderboardAllocation): void {
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

  list(): StrictLeaderboardAllocation[] {
    const out: StrictLeaderboardAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictLeaderboardAllocationStore(): StrictLeaderboardAllocationStore {
  return new MemoryStrictLeaderboardAllocationStore(new Map<string, StrictLeaderboardAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictLeaderboardAllocationStore implements StrictLeaderboardAllocationStore {
  inner: StrictLeaderboardAllocationStore;
  cache: cache.TtlCache<StrictLeaderboardAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictLeaderboardAllocationStore,
    cacheValue: cache.TtlCache<StrictLeaderboardAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictLeaderboardAllocation | undefined {
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

  save(item: StrictLeaderboardAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictLeaderboardAllocation[] {
    return this.inner.list();
  }
}

export function newCachedStrictLeaderboardAllocationStore(inner: StrictLeaderboardAllocationStore, ttl: number, clockValue: clock.Clock): StrictLeaderboardAllocationStore {
  return new CachedStrictLeaderboardAllocationStore(
    inner,
    cache.newTtlCache<StrictLeaderboardAllocation>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict leaderboard allocations. Empty fields match all. */
export class StrictLeaderboardAllocationQuery {
  segment: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minMargin: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictLeaderboardAllocation): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictLeaderboardAllocation[]): StrictLeaderboardAllocation[] {
    const matched = collections.filter(items, (candidate: StrictLeaderboardAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictLeaderboardAllocations(store: StrictLeaderboardAllocationStore, query: StrictLeaderboardAllocationQuery): StrictLeaderboardAllocation[] {
  return query.apply(store.list());
}
