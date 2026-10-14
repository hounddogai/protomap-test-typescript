import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedProofProfile } from "./batched-proof-profile.js";

/** Keeps batched proof profiles by code. */
export interface BatchedProofProfileStore {
  find(code: string): BatchedProofProfile | undefined;
  save(item: BatchedProofProfile): void;
  remove(code: string): boolean;
  list(): BatchedProofProfile[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedProofProfileStore implements BatchedProofProfileStore {
  items: Map<string, BatchedProofProfile>;
  order: string[];

  constructor(items: Map<string, BatchedProofProfile>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedProofProfile | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedProofProfile): void {
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

  list(): BatchedProofProfile[] {
    const out: BatchedProofProfile[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedProofProfileStore(): BatchedProofProfileStore {
  return new MemoryBatchedProofProfileStore(new Map<string, BatchedProofProfile>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedProofProfileStore implements BatchedProofProfileStore {
  inner: BatchedProofProfileStore;
  cache: cache.TtlCache<BatchedProofProfile>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedProofProfileStore,
    cacheValue: cache.TtlCache<BatchedProofProfile>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedProofProfile | undefined {
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

  save(item: BatchedProofProfile): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedProofProfile[] {
    return this.inner.list();
  }
}

export function newCachedBatchedProofProfileStore(inner: BatchedProofProfileStore, ttl: number, clockValue: clock.Clock): BatchedProofProfileStore {
  return new CachedBatchedProofProfileStore(inner, cache.newTtlCache<BatchedProofProfile>(256, ttl, clockValue), 0, 0);
}

/** Selects batched proof profiles. Empty fields match all. */
export class BatchedProofProfileQuery {
  country: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMinimum: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedProofProfile): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedProofProfile[]): BatchedProofProfile[] {
    const matched = collections.filter(items, (candidate: BatchedProofProfile): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedProofProfiles(store: BatchedProofProfileStore, query: BatchedProofProfileQuery): BatchedProofProfile[] {
  return query.apply(store.list());
}
