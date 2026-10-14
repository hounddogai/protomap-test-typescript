import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardNotice } from "./leaderboard-notice.js";

/** Keeps leaderboard notices by code. */
export interface LeaderboardNoticeStore {
  find(code: string): LeaderboardNotice | undefined;
  save(item: LeaderboardNotice): void;
  remove(code: string): boolean;
  list(): LeaderboardNotice[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardNoticeStore implements LeaderboardNoticeStore {
  items: Map<string, LeaderboardNotice>;
  order: string[];

  constructor(items: Map<string, LeaderboardNotice>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardNotice | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardNotice): void {
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

  list(): LeaderboardNotice[] {
    const out: LeaderboardNotice[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardNoticeStore(): LeaderboardNoticeStore {
  return new MemoryLeaderboardNoticeStore(new Map<string, LeaderboardNotice>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardNoticeStore implements LeaderboardNoticeStore {
  inner: LeaderboardNoticeStore;
  cache: cache.TtlCache<LeaderboardNotice>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardNoticeStore,
    cacheValue: cache.TtlCache<LeaderboardNotice>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardNotice | undefined {
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

  save(item: LeaderboardNotice): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardNotice[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardNoticeStore(inner: LeaderboardNoticeStore, ttl: number, clockValue: clock.Clock): LeaderboardNoticeStore {
  return new CachedLeaderboardNoticeStore(inner, cache.newTtlCache<LeaderboardNotice>(256, ttl, clockValue), 0, 0);
}

/** Selects leaderboard notices. Empty fields match all. */
export class LeaderboardNoticeQuery {
  label: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBudget: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardNotice): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardNotice[]): LeaderboardNotice[] {
    const matched = collections.filter(items, (candidate: LeaderboardNotice): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardNotices(store: LeaderboardNoticeStore, query: LeaderboardNoticeQuery): LeaderboardNotice[] {
  return query.apply(store.list());
}
