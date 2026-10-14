import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryLeaderboardCheckpoint } from "./primary-leaderboard-checkpoint.js";

/** Keeps primary leaderboard checkpoints by code. */
export interface PrimaryLeaderboardCheckpointStore {
  find(code: string): PrimaryLeaderboardCheckpoint | undefined;
  save(item: PrimaryLeaderboardCheckpoint): void;
  remove(code: string): boolean;
  list(): PrimaryLeaderboardCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryLeaderboardCheckpointStore implements PrimaryLeaderboardCheckpointStore {
  items: Map<string, PrimaryLeaderboardCheckpoint>;
  order: string[];

  constructor(items: Map<string, PrimaryLeaderboardCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryLeaderboardCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryLeaderboardCheckpoint): void {
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

  list(): PrimaryLeaderboardCheckpoint[] {
    const out: PrimaryLeaderboardCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryLeaderboardCheckpointStore(): PrimaryLeaderboardCheckpointStore {
  return new MemoryPrimaryLeaderboardCheckpointStore(new Map<string, PrimaryLeaderboardCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryLeaderboardCheckpointStore implements PrimaryLeaderboardCheckpointStore {
  inner: PrimaryLeaderboardCheckpointStore;
  cache: cache.TtlCache<PrimaryLeaderboardCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryLeaderboardCheckpointStore,
    cacheValue: cache.TtlCache<PrimaryLeaderboardCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryLeaderboardCheckpoint | undefined {
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

  save(item: PrimaryLeaderboardCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryLeaderboardCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryLeaderboardCheckpointStore(inner: PrimaryLeaderboardCheckpointStore, ttl: number, clockValue: clock.Clock): PrimaryLeaderboardCheckpointStore {
  return new CachedPrimaryLeaderboardCheckpointStore(
    inner,
    cache.newTtlCache<PrimaryLeaderboardCheckpoint>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects primary leaderboard checkpoints. Empty fields match all. */
export class PrimaryLeaderboardCheckpointQuery {
  unit: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minQuantity: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryLeaderboardCheckpoint): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryLeaderboardCheckpoint[]): PrimaryLeaderboardCheckpoint[] {
    const matched = collections.filter(items, (candidate: PrimaryLeaderboardCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryLeaderboardCheckpoints(store: PrimaryLeaderboardCheckpointStore, query: PrimaryLeaderboardCheckpointQuery): PrimaryLeaderboardCheckpoint[] {
  return query.apply(store.list());
}
