import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardSummary } from "./leaderboard-summary.js";

/** Keeps leaderboard summaries by code. */
export interface LeaderboardSummaryStore {
  find(code: string): LeaderboardSummary | undefined;
  save(item: LeaderboardSummary): void;
  remove(code: string): boolean;
  list(): LeaderboardSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardSummaryStore implements LeaderboardSummaryStore {
  items: Map<string, LeaderboardSummary>;
  order: string[];

  constructor(items: Map<string, LeaderboardSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardSummary): void {
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

  list(): LeaderboardSummary[] {
    const out: LeaderboardSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardSummaryStore(): LeaderboardSummaryStore {
  return new MemoryLeaderboardSummaryStore(new Map<string, LeaderboardSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardSummaryStore implements LeaderboardSummaryStore {
  inner: LeaderboardSummaryStore;
  cache: cache.TtlCache<LeaderboardSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardSummaryStore,
    cacheValue: cache.TtlCache<LeaderboardSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardSummary | undefined {
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

  save(item: LeaderboardSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardSummary[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardSummaryStore(inner: LeaderboardSummaryStore, ttl: number, clockValue: clock.Clock): LeaderboardSummaryStore {
  return new CachedLeaderboardSummaryStore(inner, cache.newTtlCache<LeaderboardSummary>(256, ttl, clockValue), 0, 0);
}

/** Selects leaderboard summaries. Empty fields match all. */
export class LeaderboardSummaryQuery {
  label: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardSummary[]): LeaderboardSummary[] {
    const matched = collections.filter(items, (candidate: LeaderboardSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardSummaries(store: LeaderboardSummaryStore, query: LeaderboardSummaryQuery): LeaderboardSummary[] {
  return query.apply(store.list());
}
