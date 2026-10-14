import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackDoubleOptInBatch } from "./fallback-double-opt-in-batch.js";

/** Keeps fallback double opt in batches by code. */
export interface FallbackDoubleOptInBatchStore {
  find(code: string): FallbackDoubleOptInBatch | undefined;
  save(item: FallbackDoubleOptInBatch): void;
  remove(code: string): boolean;
  list(): FallbackDoubleOptInBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackDoubleOptInBatchStore implements FallbackDoubleOptInBatchStore {
  items: Map<string, FallbackDoubleOptInBatch>;
  order: string[];

  constructor(items: Map<string, FallbackDoubleOptInBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackDoubleOptInBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackDoubleOptInBatch): void {
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

  list(): FallbackDoubleOptInBatch[] {
    const out: FallbackDoubleOptInBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackDoubleOptInBatchStore(): FallbackDoubleOptInBatchStore {
  return new MemoryFallbackDoubleOptInBatchStore(new Map<string, FallbackDoubleOptInBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackDoubleOptInBatchStore implements FallbackDoubleOptInBatchStore {
  inner: FallbackDoubleOptInBatchStore;
  cache: cache.TtlCache<FallbackDoubleOptInBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackDoubleOptInBatchStore,
    cacheValue: cache.TtlCache<FallbackDoubleOptInBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackDoubleOptInBatch | undefined {
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

  save(item: FallbackDoubleOptInBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackDoubleOptInBatch[] {
    return this.inner.list();
  }
}

export function newCachedFallbackDoubleOptInBatchStore(inner: FallbackDoubleOptInBatchStore, ttl: number, clockValue: clock.Clock): FallbackDoubleOptInBatchStore {
  return new CachedFallbackDoubleOptInBatchStore(
    inner,
    cache.newTtlCache<FallbackDoubleOptInBatch>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback double opt in batches. Empty fields match all. */
export class FallbackDoubleOptInBatchQuery {
  source: string;
  minCost: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minCost: number, statuses: string[], limit: number) {
    this.source = source;
    this.minCost = minCost;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackDoubleOptInBatch): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.cost < this.minCost) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackDoubleOptInBatch[]): FallbackDoubleOptInBatch[] {
    const matched = collections.filter(items, (candidate: FallbackDoubleOptInBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackDoubleOptInBatches(store: FallbackDoubleOptInBatchStore, query: FallbackDoubleOptInBatchQuery): FallbackDoubleOptInBatch[] {
  return query.apply(store.list());
}
