import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedPostProfile } from "./batched-post-profile.js";

/** Keeps batched post profiles by code. */
export interface BatchedPostProfileStore {
  find(code: string): BatchedPostProfile | undefined;
  save(item: BatchedPostProfile): void;
  remove(code: string): boolean;
  list(): BatchedPostProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedPostProfileStore implements BatchedPostProfileStore {
  items: Map<string, BatchedPostProfile>;
  order: string[];

  constructor(items: Map<string, BatchedPostProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedPostProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedPostProfile): void {
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

  list(): BatchedPostProfile[] {
    const out: BatchedPostProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedPostProfileStore(): BatchedPostProfileStore {
  return new MemoryBatchedPostProfileStore(new Map<string, BatchedPostProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedPostProfileStore implements BatchedPostProfileStore {
  inner: BatchedPostProfileStore;
  cache: cache.TtlCache<BatchedPostProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedPostProfileStore,
    cacheValue: cache.TtlCache<BatchedPostProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedPostProfile | undefined {
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

  save(item: BatchedPostProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedPostProfile[] {
    return this.inner.list();
  }
}

export function newCachedBatchedPostProfileStore(inner: BatchedPostProfileStore, ttl: number, clockValue: clock.Clock): BatchedPostProfileStore {
  return new CachedBatchedPostProfileStore(inner, cache.newTtlCache<BatchedPostProfile>(256, ttl, clockValue), 0, 0);
}

/** Selects batched post profiles. Empty fields match all. */
export class BatchedPostProfileQuery {
  segment: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minFloorValue: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedPostProfile): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedPostProfile[]): BatchedPostProfile[] {
    const matched = collections.filter(items, (candidate: BatchedPostProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedPostProfiles(store: BatchedPostProfileStore, query: BatchedPostProfileQuery): BatchedPostProfile[] {
  return query.apply(store.list());
}
