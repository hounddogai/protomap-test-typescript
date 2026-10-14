import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TierCheckpoint } from "./tier-checkpoint.js";

/** Keeps tier checkpoints by code. */
export interface TierCheckpointStore {
  find(code: string): TierCheckpoint | undefined;
  save(item: TierCheckpoint): void;
  remove(code: string): boolean;
  list(): TierCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTierCheckpointStore implements TierCheckpointStore {
  items: Map<string, TierCheckpoint>;
  order: string[];

  constructor(items: Map<string, TierCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TierCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TierCheckpoint): void {
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

  list(): TierCheckpoint[] {
    const out: TierCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTierCheckpointStore(): TierCheckpointStore {
  return new MemoryTierCheckpointStore(new Map<string, TierCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTierCheckpointStore implements TierCheckpointStore {
  inner: TierCheckpointStore;
  cache: cache.TtlCache<TierCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: TierCheckpointStore,
    cacheValue: cache.TtlCache<TierCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TierCheckpoint | undefined {
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

  save(item: TierCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TierCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedTierCheckpointStore(inner: TierCheckpointStore, ttl: number, clockValue: clock.Clock): TierCheckpointStore {
  return new CachedTierCheckpointStore(inner, cache.newTtlCache<TierCheckpoint>(1024, ttl, clockValue), 0, 0);
}

/** Selects tier checkpoints. Empty fields match all. */
export class TierCheckpointQuery {
  source: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCapacity: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TierCheckpoint): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TierCheckpoint[]): TierCheckpoint[] {
    const matched = collections.filter(items, (candidate: TierCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTierCheckpoints(store: TierCheckpointStore, query: TierCheckpointQuery): TierCheckpoint[] {
  return query.apply(store.list());
}
