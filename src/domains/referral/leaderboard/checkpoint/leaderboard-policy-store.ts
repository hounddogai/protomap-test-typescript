import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardPolicy } from "./leaderboard-policy.js";

/** Keeps leaderboard policies by code. */
export interface LeaderboardPolicyStore {
  find(code: string): LeaderboardPolicy | undefined;
  save(item: LeaderboardPolicy): void;
  remove(code: string): boolean;
  list(): LeaderboardPolicy[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardPolicyStore implements LeaderboardPolicyStore {
  items: Map<string, LeaderboardPolicy>;
  order: string[];

  constructor(items: Map<string, LeaderboardPolicy>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardPolicy | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardPolicy): void {
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

  list(): LeaderboardPolicy[] {
    const out: LeaderboardPolicy[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardPolicyStore(): LeaderboardPolicyStore {
  return new MemoryLeaderboardPolicyStore(new Map<string, LeaderboardPolicy>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardPolicyStore implements LeaderboardPolicyStore {
  inner: LeaderboardPolicyStore;
  cache: cache.TtlCache<LeaderboardPolicy>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardPolicyStore,
    cacheValue: cache.TtlCache<LeaderboardPolicy>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardPolicy | undefined {
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

  save(item: LeaderboardPolicy): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardPolicy[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardPolicyStore(inner: LeaderboardPolicyStore, ttl: number, clockValue: clock.Clock): LeaderboardPolicyStore {
  return new CachedLeaderboardPolicyStore(inner, cache.newTtlCache<LeaderboardPolicy>(128, ttl, clockValue), 0, 0);
}

/** Selects leaderboard policies. Empty fields match all. */
export class LeaderboardPolicyQuery {
  segment: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFloorValue: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardPolicy): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardPolicy[]): LeaderboardPolicy[] {
    const matched = collections.filter(items, (candidate: LeaderboardPolicy): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardPolicies(store: LeaderboardPolicyStore, query: LeaderboardPolicyQuery): LeaderboardPolicy[] {
  return query.apply(store.list());
}
