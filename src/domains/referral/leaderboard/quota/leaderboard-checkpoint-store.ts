import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { LeaderboardCheckpoint } from "./leaderboard-checkpoint.js";

/** Keeps leaderboard checkpoints by code. */
export interface LeaderboardCheckpointStore {
  find(code: string): LeaderboardCheckpoint | undefined;
  save(item: LeaderboardCheckpoint): void;
  remove(code: string): boolean;
  list(): LeaderboardCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryLeaderboardCheckpointStore implements LeaderboardCheckpointStore {
  items: Map<string, LeaderboardCheckpoint>;
  order: string[];

  constructor(items: Map<string, LeaderboardCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): LeaderboardCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: LeaderboardCheckpoint): void {
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

  list(): LeaderboardCheckpoint[] {
    const out: LeaderboardCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryLeaderboardCheckpointStore(): LeaderboardCheckpointStore {
  return new MemoryLeaderboardCheckpointStore(new Map<string, LeaderboardCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedLeaderboardCheckpointStore implements LeaderboardCheckpointStore {
  inner: LeaderboardCheckpointStore;
  cache: cache.TtlCache<LeaderboardCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: LeaderboardCheckpointStore,
    cacheValue: cache.TtlCache<LeaderboardCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): LeaderboardCheckpoint | undefined {
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

  save(item: LeaderboardCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): LeaderboardCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedLeaderboardCheckpointStore(inner: LeaderboardCheckpointStore, ttl: number, clockValue: clock.Clock): LeaderboardCheckpointStore {
  return new CachedLeaderboardCheckpointStore(
    inner,
    cache.newTtlCache<LeaderboardCheckpoint>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects leaderboard checkpoints. Empty fields match all. */
export class LeaderboardCheckpointQuery {
  segment: string;
  minRatio: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minRatio: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minRatio = minRatio;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: LeaderboardCheckpoint): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.ratio < this.minRatio) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: LeaderboardCheckpoint[]): LeaderboardCheckpoint[] {
    const matched = collections.filter(items, (candidate: LeaderboardCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findLeaderboardCheckpoints(store: LeaderboardCheckpointStore, query: LeaderboardCheckpointQuery): LeaderboardCheckpoint[] {
  return query.apply(store.list());
}
