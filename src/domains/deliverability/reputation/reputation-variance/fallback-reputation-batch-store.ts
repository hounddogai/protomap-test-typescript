import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackReputationBatch } from "./fallback-reputation-batch.js";

/** Keeps fallback reputation batches by code. */
export interface FallbackReputationBatchStore {
  find(code: string): FallbackReputationBatch | undefined;
  save(item: FallbackReputationBatch): void;
  remove(code: string): boolean;
  list(): FallbackReputationBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackReputationBatchStore implements FallbackReputationBatchStore {
  items: Map<string, FallbackReputationBatch>;
  order: string[];

  constructor(items: Map<string, FallbackReputationBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackReputationBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackReputationBatch): void {
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

  list(): FallbackReputationBatch[] {
    const out: FallbackReputationBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackReputationBatchStore(): FallbackReputationBatchStore {
  return new MemoryFallbackReputationBatchStore(new Map<string, FallbackReputationBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackReputationBatchStore implements FallbackReputationBatchStore {
  inner: FallbackReputationBatchStore;
  cache: cache.TtlCache<FallbackReputationBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackReputationBatchStore,
    cacheValue: cache.TtlCache<FallbackReputationBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackReputationBatch | undefined {
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

  save(item: FallbackReputationBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackReputationBatch[] {
    return this.inner.list();
  }
}

export function newCachedFallbackReputationBatchStore(inner: FallbackReputationBatchStore, ttl: number, clockValue: clock.Clock): FallbackReputationBatchStore {
  return new CachedFallbackReputationBatchStore(
    inner,
    cache.newTtlCache<FallbackReputationBatch>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback reputation batches. Empty fields match all. */
export class FallbackReputationBatchQuery {
  country: string;
  minCapacity: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minCapacity: number, statuses: string[], limit: number) {
    this.country = country;
    this.minCapacity = minCapacity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackReputationBatch): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.capacity < this.minCapacity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackReputationBatch[]): FallbackReputationBatch[] {
    const matched = collections.filter(items, (candidate: FallbackReputationBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackReputationBatches(store: FallbackReputationBatchStore, query: FallbackReputationBatchQuery): FallbackReputationBatch[] {
  return query.apply(store.list());
}
