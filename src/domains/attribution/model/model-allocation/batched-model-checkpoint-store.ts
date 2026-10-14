import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedModelCheckpoint } from "./batched-model-checkpoint.js";

/** Keeps batched model checkpoints by code. */
export interface BatchedModelCheckpointStore {
  find(code: string): BatchedModelCheckpoint | undefined;
  save(item: BatchedModelCheckpoint): void;
  remove(code: string): boolean;
  list(): BatchedModelCheckpoint[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedModelCheckpointStore implements BatchedModelCheckpointStore {
  items: Map<string, BatchedModelCheckpoint>;
  order: string[];

  constructor(items: Map<string, BatchedModelCheckpoint>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedModelCheckpoint | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedModelCheckpoint): void {
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

  list(): BatchedModelCheckpoint[] {
    const out: BatchedModelCheckpoint[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedModelCheckpointStore(): BatchedModelCheckpointStore {
  return new MemoryBatchedModelCheckpointStore(new Map<string, BatchedModelCheckpoint>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedModelCheckpointStore implements BatchedModelCheckpointStore {
  inner: BatchedModelCheckpointStore;
  cache: cache.TtlCache<BatchedModelCheckpoint>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedModelCheckpointStore,
    cacheValue: cache.TtlCache<BatchedModelCheckpoint>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedModelCheckpoint | undefined {
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

  save(item: BatchedModelCheckpoint): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedModelCheckpoint[] {
    return this.inner.list();
  }
}

export function newCachedBatchedModelCheckpointStore(inner: BatchedModelCheckpointStore, ttl: number, clockValue: clock.Clock): BatchedModelCheckpointStore {
  return new CachedBatchedModelCheckpointStore(
    inner,
    cache.newTtlCache<BatchedModelCheckpoint>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched model checkpoints. Empty fields match all. */
export class BatchedModelCheckpointQuery {
  name: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minImpressions: number, statuses: string[], limit: number) {
    this.name = name;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedModelCheckpoint): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedModelCheckpoint[]): BatchedModelCheckpoint[] {
    const matched = collections.filter(items, (candidate: BatchedModelCheckpoint): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedModelCheckpoints(store: BatchedModelCheckpointStore, query: BatchedModelCheckpointQuery): BatchedModelCheckpoint[] {
  return query.apply(store.list());
}
