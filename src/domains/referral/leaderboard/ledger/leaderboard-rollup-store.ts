import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardRollup } from "./leaderboard-rollup.js";

/** Keeps leaderboard rollups by code. */
export interface LeaderboardRollupStore {
  find(code: string): LeaderboardRollup | undefined;
  save(item: LeaderboardRollup): void;
  remove(code: string): boolean;
  list(): LeaderboardRollup[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardRollupStore implements LeaderboardRollupStore {
  items: Map<string, LeaderboardRollup>;
  order: string[];

  constructor(items: Map<string, LeaderboardRollup>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardRollup | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardRollup): void {
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

  list(): LeaderboardRollup[] {
    const out: LeaderboardRollup[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardRollupStore(): LeaderboardRollupStore {
  return new MemoryLeaderboardRollupStore(new Map<string, LeaderboardRollup>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardRollupStore implements LeaderboardRollupStore {
  inner: LeaderboardRollupStore;
  cache: cache.TtlCache<LeaderboardRollup>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardRollupStore,
    cacheValue: cache.TtlCache<LeaderboardRollup>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardRollup | undefined {
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

  save(item: LeaderboardRollup): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardRollup[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardRollupStore(inner: LeaderboardRollupStore, ttl: number, clockValue: clock.Clock): LeaderboardRollupStore {
  return new CachedLeaderboardRollupStore(inner, cache.newTtlCache<LeaderboardRollup>(128, ttl, clockValue), 0, 0);
}

/** Selects leaderboard rollups. Empty fields match all. */
export class LeaderboardRollupQuery {
  segment: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minQuantity: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardRollup): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardRollup[]): LeaderboardRollup[] {
    const matched = collections.filter(items, (candidate: LeaderboardRollup): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardRollups(store: LeaderboardRollupStore, query: LeaderboardRollupQuery): LeaderboardRollup[] {
  return query.apply(store.list());
}
