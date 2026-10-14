import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedBranchManifest } from "./batched-branch-manifest.js";

/** Keeps batched branch manifests by code. */
export interface BatchedBranchManifestStore {
  find(code: string): BatchedBranchManifest | undefined;
  save(item: BatchedBranchManifest): void;
  remove(code: string): boolean;
  list(): BatchedBranchManifest[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedBranchManifestStore implements BatchedBranchManifestStore {
  items: Map<string, BatchedBranchManifest>;
  order: string[];

  constructor(items: Map<string, BatchedBranchManifest>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedBranchManifest | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedBranchManifest): void {
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

  list(): BatchedBranchManifest[] {
    const out: BatchedBranchManifest[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedBranchManifestStore(): BatchedBranchManifestStore {
  return new MemoryBatchedBranchManifestStore(new Map<string, BatchedBranchManifest>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedBranchManifestStore implements BatchedBranchManifestStore {
  inner: BatchedBranchManifestStore;
  cache: cache.TtlCache<BatchedBranchManifest>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedBranchManifestStore,
    cacheValue: cache.TtlCache<BatchedBranchManifest>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedBranchManifest | undefined {
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

  save(item: BatchedBranchManifest): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedBranchManifest[] {
    return this.inner.list();
  }
}

export function newCachedBatchedBranchManifestStore(inner: BatchedBranchManifestStore, ttl: number, clockValue: clock.Clock): BatchedBranchManifestStore {
  return new CachedBatchedBranchManifestStore(
    inner,
    cache.newTtlCache<BatchedBranchManifest>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched branch manifests. Empty fields match all. */
export class BatchedBranchManifestQuery {
  unit: string;
  minStartsAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minStartsAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minStartsAt = minStartsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedBranchManifest): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.startsAt < this.minStartsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedBranchManifest[]): BatchedBranchManifest[] {
    const matched = collections.filter(items, (candidate: BatchedBranchManifest): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedBranchManifests(store: BatchedBranchManifestStore, query: BatchedBranchManifestQuery): BatchedBranchManifest[] {
  return query.apply(store.list());
}
