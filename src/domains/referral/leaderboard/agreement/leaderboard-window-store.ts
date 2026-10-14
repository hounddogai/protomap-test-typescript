import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardWindow } from "./leaderboard-window.js";

/** Keeps leaderboard windows by code. */
export interface LeaderboardWindowStore {
  find(code: string): LeaderboardWindow | undefined;
  save(item: LeaderboardWindow): void;
  remove(code: string): boolean;
  list(): LeaderboardWindow[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardWindowStore implements LeaderboardWindowStore {
  items: Map<string, LeaderboardWindow>;
  order: string[];

  constructor(items: Map<string, LeaderboardWindow>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardWindow | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardWindow): void {
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

  list(): LeaderboardWindow[] {
    const out: LeaderboardWindow[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardWindowStore(): LeaderboardWindowStore {
  return new MemoryLeaderboardWindowStore(new Map<string, LeaderboardWindow>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardWindowStore implements LeaderboardWindowStore {
  inner: LeaderboardWindowStore;
  cache: cache.TtlCache<LeaderboardWindow>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardWindowStore,
    cacheValue: cache.TtlCache<LeaderboardWindow>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardWindow | undefined {
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

  save(item: LeaderboardWindow): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardWindow[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardWindowStore(inner: LeaderboardWindowStore, ttl: number, clockValue: clock.Clock): LeaderboardWindowStore {
  return new CachedLeaderboardWindowStore(inner, cache.newTtlCache<LeaderboardWindow>(512, ttl, clockValue), 0, 0);
}

/** Selects leaderboard windows. Empty fields match all. */
export class LeaderboardWindowQuery {
  country: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minClicks: number, statuses: string[], limit: number) {
    this.country = country;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardWindow): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardWindow[]): LeaderboardWindow[] {
    const matched = collections.filter(items, (candidate: LeaderboardWindow): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardWindows(store: LeaderboardWindowStore, query: LeaderboardWindowQuery): LeaderboardWindow[] {
  return query.apply(store.list());
}
