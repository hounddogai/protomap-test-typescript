import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredRewardCheckpoint } from "./tiered-reward-checkpoint.js";

/** Keeps tiered reward checkpoints by code. */
export interface TieredRewardCheckpointStore {
  find(code: string): TieredRewardCheckpoint | undefined;
  save(item: TieredRewardCheckpoint): void;
  remove(code: string): boolean;
  list(): TieredRewardCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredRewardCheckpointStore implements TieredRewardCheckpointStore {
  items: Map<string, TieredRewardCheckpoint>;
  order: string[];

  constructor(items: Map<string, TieredRewardCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredRewardCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredRewardCheckpoint): void {
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

  list(): TieredRewardCheckpoint[] {
    const out: TieredRewardCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredRewardCheckpointStore(): TieredRewardCheckpointStore {
  return new MemoryTieredRewardCheckpointStore(new Map<string, TieredRewardCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredRewardCheckpointStore implements TieredRewardCheckpointStore {
  inner: TieredRewardCheckpointStore;
  cache: cache.TtlCache<TieredRewardCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredRewardCheckpointStore,
    cacheValue: cache.TtlCache<TieredRewardCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredRewardCheckpoint | undefined {
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

  save(item: TieredRewardCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredRewardCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedTieredRewardCheckpointStore(inner: TieredRewardCheckpointStore, ttl: number, clockValue: clock.Clock): TieredRewardCheckpointStore {
  return new CachedTieredRewardCheckpointStore(
    inner,
    cache.newTtlCache<TieredRewardCheckpoint>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered reward checkpoints. Empty fields match all. */
export class TieredRewardCheckpointQuery {
  region: string;
  minThreshold: number;
  statuses: string[];
  limit: number;

  constructor(region: string, minThreshold: number, statuses: string[], limit: number) {
    this.region = region;
    this.minThreshold = minThreshold;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredRewardCheckpoint): boolean {
    if (this.region !== "" && text.normalize(item.region) !== text.normalize(this.region)) return false;
    if (item.threshold < this.minThreshold) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredRewardCheckpoint[]): TieredRewardCheckpoint[] {
    const matched = collections.filter(items, (candidate: TieredRewardCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredRewardCheckpoints(store: TieredRewardCheckpointStore, query: TieredRewardCheckpointQuery): TieredRewardCheckpoint[] {
  return query.apply(store.list());
}
