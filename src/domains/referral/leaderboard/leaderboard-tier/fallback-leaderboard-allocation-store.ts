import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackLeaderboardAllocation } from "./fallback-leaderboard-allocation.js";

/** Keeps fallback leaderboard allocations by code. */
export interface FallbackLeaderboardAllocationStore {
  find(code: string): FallbackLeaderboardAllocation | undefined;
  save(item: FallbackLeaderboardAllocation): void;
  remove(code: string): boolean;
  list(): FallbackLeaderboardAllocation[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackLeaderboardAllocationStore implements FallbackLeaderboardAllocationStore {
  items: Map<string, FallbackLeaderboardAllocation>;
  order: string[];

  constructor(items: Map<string, FallbackLeaderboardAllocation>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackLeaderboardAllocation | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackLeaderboardAllocation): void {
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

  list(): FallbackLeaderboardAllocation[] {
    const out: FallbackLeaderboardAllocation[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackLeaderboardAllocationStore(): FallbackLeaderboardAllocationStore {
  return new MemoryFallbackLeaderboardAllocationStore(new Map<string, FallbackLeaderboardAllocation>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackLeaderboardAllocationStore implements FallbackLeaderboardAllocationStore {
  inner: FallbackLeaderboardAllocationStore;
  cache: cache.TtlCache<FallbackLeaderboardAllocation>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackLeaderboardAllocationStore,
    cacheValue: cache.TtlCache<FallbackLeaderboardAllocation>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackLeaderboardAllocation | undefined {
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

  save(item: FallbackLeaderboardAllocation): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackLeaderboardAllocation[] {
    return this.inner.list();
  }
}

export function newCachedFallbackLeaderboardAllocationStore(inner: FallbackLeaderboardAllocationStore, ttl: number, clockValue: clock.Clock): FallbackLeaderboardAllocationStore {
  return new CachedFallbackLeaderboardAllocationStore(
    inner,
    cache.newTtlCache<FallbackLeaderboardAllocation>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback leaderboard allocations. Empty fields match all. */
export class FallbackLeaderboardAllocationQuery {
  channel: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(channel: string, minRevision: number, statuses: string[], limit: number) {
    this.channel = channel;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackLeaderboardAllocation): boolean {
    if (this.channel !== "" && text.normalize(item.channel) !== text.normalize(this.channel)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackLeaderboardAllocation[]): FallbackLeaderboardAllocation[] {
    const matched = collections.filter(items, (candidate: FallbackLeaderboardAllocation): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackLeaderboardAllocations(store: FallbackLeaderboardAllocationStore, query: FallbackLeaderboardAllocationQuery): FallbackLeaderboardAllocation[] {
  return query.apply(store.list());
}
