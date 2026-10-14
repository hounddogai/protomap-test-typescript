import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardManifest } from "./leaderboard-manifest.js";

/** Keeps leaderboard manifests by code. */
export interface LeaderboardManifestStore {
  find(code: string): LeaderboardManifest | undefined;
  save(item: LeaderboardManifest): void;
  remove(code: string): boolean;
  list(): LeaderboardManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardManifestStore implements LeaderboardManifestStore {
  items: Map<string, LeaderboardManifest>;
  order: string[];

  constructor(items: Map<string, LeaderboardManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardManifest): void {
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

  list(): LeaderboardManifest[] {
    const out: LeaderboardManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardManifestStore(): LeaderboardManifestStore {
  return new MemoryLeaderboardManifestStore(new Map<string, LeaderboardManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardManifestStore implements LeaderboardManifestStore {
  inner: LeaderboardManifestStore;
  cache: cache.TtlCache<LeaderboardManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardManifestStore,
    cacheValue: cache.TtlCache<LeaderboardManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardManifest | undefined {
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

  save(item: LeaderboardManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardManifest[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardManifestStore(inner: LeaderboardManifestStore, ttl: number, clockValue: clock.Clock): LeaderboardManifestStore {
  return new CachedLeaderboardManifestStore(inner, cache.newTtlCache<LeaderboardManifest>(64, ttl, clockValue), 0, 0);
}

/** Selects leaderboard manifests. Empty fields match all. */
export class LeaderboardManifestQuery {
  category: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.category = category;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardManifest): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardManifest[]): LeaderboardManifest[] {
    const matched = collections.filter(items, (candidate: LeaderboardManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardManifests(store: LeaderboardManifestStore, query: LeaderboardManifestQuery): LeaderboardManifest[] {
  return query.apply(store.list());
}
