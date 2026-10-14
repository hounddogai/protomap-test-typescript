import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SeasonalLeaderboardSnapshot } from "./seasonal-leaderboard-snapshot.js";

/** Keeps seasonal leaderboard snapshots by code. */
export interface SeasonalLeaderboardSnapshotStore {
  find(code: string): SeasonalLeaderboardSnapshot | undefined;
  save(item: SeasonalLeaderboardSnapshot): void;
  remove(code: string): boolean;
  list(): SeasonalLeaderboardSnapshot[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySeasonalLeaderboardSnapshotStore implements SeasonalLeaderboardSnapshotStore {
  items: Map<string, SeasonalLeaderboardSnapshot>;
  order: string[];

  constructor(items: Map<string, SeasonalLeaderboardSnapshot>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SeasonalLeaderboardSnapshot | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SeasonalLeaderboardSnapshot): void {
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

  list(): SeasonalLeaderboardSnapshot[] {
    const out: SeasonalLeaderboardSnapshot[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySeasonalLeaderboardSnapshotStore(): SeasonalLeaderboardSnapshotStore {
  return new MemorySeasonalLeaderboardSnapshotStore(new Map<string, SeasonalLeaderboardSnapshot>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSeasonalLeaderboardSnapshotStore implements SeasonalLeaderboardSnapshotStore {
  inner: SeasonalLeaderboardSnapshotStore;
  cache: cache.TtlCache<SeasonalLeaderboardSnapshot>;
  hits: number;
  misses: number;

  constructor(
    inner: SeasonalLeaderboardSnapshotStore,
    cacheValue: cache.TtlCache<SeasonalLeaderboardSnapshot>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SeasonalLeaderboardSnapshot | undefined {
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

  save(item: SeasonalLeaderboardSnapshot): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SeasonalLeaderboardSnapshot[] {
    return this.inner.list();
  }
}

export function newCachedSeasonalLeaderboardSnapshotStore(inner: SeasonalLeaderboardSnapshotStore, ttl: number, clockValue: clock.Clock): SeasonalLeaderboardSnapshotStore {
  return new CachedSeasonalLeaderboardSnapshotStore(
    inner,
    cache.newTtlCache<SeasonalLeaderboardSnapshot>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects seasonal leaderboard snapshots. Empty fields match all. */
export class SeasonalLeaderboardSnapshotQuery {
  title: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minConversionRate: number, statuses: string[], limit: number) {
    this.title = title;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SeasonalLeaderboardSnapshot): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SeasonalLeaderboardSnapshot[]): SeasonalLeaderboardSnapshot[] {
    const matched = collections.filter(items, (candidate: SeasonalLeaderboardSnapshot): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSeasonalLeaderboardSnapshots(store: SeasonalLeaderboardSnapshotStore, query: SeasonalLeaderboardSnapshotQuery): SeasonalLeaderboardSnapshot[] {
  return query.apply(store.list());
}
