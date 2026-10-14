import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredPathCheckpoint } from "./tiered-path-checkpoint.js";

/** Keeps tiered path checkpoints by code. */
export interface TieredPathCheckpointStore {
  find(code: string): TieredPathCheckpoint | undefined;
  save(item: TieredPathCheckpoint): void;
  remove(code: string): boolean;
  list(): TieredPathCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredPathCheckpointStore implements TieredPathCheckpointStore {
  items: Map<string, TieredPathCheckpoint>;
  order: string[];

  constructor(items: Map<string, TieredPathCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredPathCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredPathCheckpoint): void {
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

  list(): TieredPathCheckpoint[] {
    const out: TieredPathCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredPathCheckpointStore(): TieredPathCheckpointStore {
  return new MemoryTieredPathCheckpointStore(new Map<string, TieredPathCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredPathCheckpointStore implements TieredPathCheckpointStore {
  inner: TieredPathCheckpointStore;
  cache: cache.TtlCache<TieredPathCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredPathCheckpointStore,
    cacheValue: cache.TtlCache<TieredPathCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredPathCheckpoint | undefined {
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

  save(item: TieredPathCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredPathCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedTieredPathCheckpointStore(inner: TieredPathCheckpointStore, ttl: number, clockValue: clock.Clock): TieredPathCheckpointStore {
  return new CachedTieredPathCheckpointStore(
    inner,
    cache.newTtlCache<TieredPathCheckpoint>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered path checkpoints. Empty fields match all. */
export class TieredPathCheckpointQuery {
  segment: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBatchSize: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredPathCheckpoint): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredPathCheckpoint[]): TieredPathCheckpoint[] {
    const matched = collections.filter(items, (candidate: TieredPathCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredPathCheckpoints(store: TieredPathCheckpointStore, query: TieredPathCheckpointQuery): TieredPathCheckpoint[] {
  return query.apply(store.list());
}
