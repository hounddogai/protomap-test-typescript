import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictLeaderboardCheckpoint } from "./strict-leaderboard-checkpoint.js";

/** Keeps strict leaderboard checkpoints by code. */
export interface StrictLeaderboardCheckpointStore {
  find(code: string): StrictLeaderboardCheckpoint | undefined;
  save(item: StrictLeaderboardCheckpoint): void;
  remove(code: string): boolean;
  list(): StrictLeaderboardCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictLeaderboardCheckpointStore implements StrictLeaderboardCheckpointStore {
  items: Map<string, StrictLeaderboardCheckpoint>;
  order: string[];

  constructor(items: Map<string, StrictLeaderboardCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictLeaderboardCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictLeaderboardCheckpoint): void {
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

  list(): StrictLeaderboardCheckpoint[] {
    const out: StrictLeaderboardCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictLeaderboardCheckpointStore(): StrictLeaderboardCheckpointStore {
  return new MemoryStrictLeaderboardCheckpointStore(new Map<string, StrictLeaderboardCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictLeaderboardCheckpointStore implements StrictLeaderboardCheckpointStore {
  inner: StrictLeaderboardCheckpointStore;
  cache: cache.TtlCache<StrictLeaderboardCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictLeaderboardCheckpointStore,
    cacheValue: cache.TtlCache<StrictLeaderboardCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictLeaderboardCheckpoint | undefined {
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

  save(item: StrictLeaderboardCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictLeaderboardCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedStrictLeaderboardCheckpointStore(inner: StrictLeaderboardCheckpointStore, ttl: number, clockValue: clock.Clock): StrictLeaderboardCheckpointStore {
  return new CachedStrictLeaderboardCheckpointStore(
    inner,
    cache.newTtlCache<StrictLeaderboardCheckpoint>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects strict leaderboard checkpoints. Empty fields match all. */
export class StrictLeaderboardCheckpointQuery {
  unit: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: StrictLeaderboardCheckpoint): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictLeaderboardCheckpoint[]): StrictLeaderboardCheckpoint[] {
    const matched = collections.filter(items, (candidate: StrictLeaderboardCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictLeaderboardCheckpoints(store: StrictLeaderboardCheckpointStore, query: StrictLeaderboardCheckpointQuery): StrictLeaderboardCheckpoint[] {
  return query.apply(store.list());
}
