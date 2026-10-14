import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardOverride } from "./leaderboard-override.js";

/** Keeps leaderboard overrides by code. */
export interface LeaderboardOverrideStore {
  find(code: string): LeaderboardOverride | undefined;
  save(item: LeaderboardOverride): void;
  remove(code: string): boolean;
  list(): LeaderboardOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardOverrideStore implements LeaderboardOverrideStore {
  items: Map<string, LeaderboardOverride>;
  order: string[];

  constructor(items: Map<string, LeaderboardOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardOverride): void {
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

  list(): LeaderboardOverride[] {
    const out: LeaderboardOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardOverrideStore(): LeaderboardOverrideStore {
  return new MemoryLeaderboardOverrideStore(new Map<string, LeaderboardOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardOverrideStore implements LeaderboardOverrideStore {
  inner: LeaderboardOverrideStore;
  cache: cache.TtlCache<LeaderboardOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardOverrideStore,
    cacheValue: cache.TtlCache<LeaderboardOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardOverride | undefined {
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

  save(item: LeaderboardOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardOverride[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardOverrideStore(inner: LeaderboardOverrideStore, ttl: number, clockValue: clock.Clock): LeaderboardOverrideStore {
  return new CachedLeaderboardOverrideStore(inner, cache.newTtlCache<LeaderboardOverride>(64, ttl, clockValue), 0, 0);
}

/** Selects leaderboard overrides. Empty fields match all. */
export class LeaderboardOverrideQuery {
  label: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minGraceDays: number, statuses: string[], limit: number) {
    this.label = label;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardOverride): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardOverride[]): LeaderboardOverride[] {
    const matched = collections.filter(items, (candidate: LeaderboardOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardOverrides(store: LeaderboardOverrideStore, query: LeaderboardOverrideQuery): LeaderboardOverride[] {
  return query.apply(store.list());
}
