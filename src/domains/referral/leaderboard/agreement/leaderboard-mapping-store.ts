import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardMapping } from "./leaderboard-mapping.js";

/** Keeps leaderboard mappings by code. */
export interface LeaderboardMappingStore {
  find(code: string): LeaderboardMapping | undefined;
  save(item: LeaderboardMapping): void;
  remove(code: string): boolean;
  list(): LeaderboardMapping[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardMappingStore implements LeaderboardMappingStore {
  items: Map<string, LeaderboardMapping>;
  order: string[];

  constructor(items: Map<string, LeaderboardMapping>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardMapping | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardMapping): void {
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

  list(): LeaderboardMapping[] {
    const out: LeaderboardMapping[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardMappingStore(): LeaderboardMappingStore {
  return new MemoryLeaderboardMappingStore(new Map<string, LeaderboardMapping>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardMappingStore implements LeaderboardMappingStore {
  inner: LeaderboardMappingStore;
  cache: cache.TtlCache<LeaderboardMapping>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardMappingStore,
    cacheValue: cache.TtlCache<LeaderboardMapping>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardMapping | undefined {
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

  save(item: LeaderboardMapping): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardMapping[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardMappingStore(inner: LeaderboardMappingStore, ttl: number, clockValue: clock.Clock): LeaderboardMappingStore {
  return new CachedLeaderboardMappingStore(inner, cache.newTtlCache<LeaderboardMapping>(128, ttl, clockValue), 0, 0);
}

/** Selects leaderboard mappings. Empty fields match all. */
export class LeaderboardMappingQuery {
  name: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minBid: number, statuses: string[], limit: number) {
    this.name = name;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardMapping): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardMapping[]): LeaderboardMapping[] {
    const matched = collections.filter(items, (candidate: LeaderboardMapping): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardMappings(store: LeaderboardMappingStore, query: LeaderboardMappingQuery): LeaderboardMapping[] {
  return query.apply(store.list());
}
