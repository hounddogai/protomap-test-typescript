import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredWarmupBatch } from "./tiered-warmup-batch.js";

/** Keeps tiered warmup batches by code. */
export interface TieredWarmupBatchStore {
  find(code: string): TieredWarmupBatch | undefined;
  save(item: TieredWarmupBatch): void;
  remove(code: string): boolean;
  list(): TieredWarmupBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredWarmupBatchStore implements TieredWarmupBatchStore {
  items: Map<string, TieredWarmupBatch>;
  order: string[];

  constructor(items: Map<string, TieredWarmupBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredWarmupBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredWarmupBatch): void {
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

  list(): TieredWarmupBatch[] {
    const out: TieredWarmupBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredWarmupBatchStore(): TieredWarmupBatchStore {
  return new MemoryTieredWarmupBatchStore(new Map<string, TieredWarmupBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredWarmupBatchStore implements TieredWarmupBatchStore {
  inner: TieredWarmupBatchStore;
  cache: cache.TtlCache<TieredWarmupBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredWarmupBatchStore,
    cacheValue: cache.TtlCache<TieredWarmupBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredWarmupBatch | undefined {
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

  save(item: TieredWarmupBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredWarmupBatch[] {
    return this.inner.list();
  }
}

export function newCachedTieredWarmupBatchStore(inner: TieredWarmupBatchStore, ttl: number, clockValue: clock.Clock): TieredWarmupBatchStore {
  return new CachedTieredWarmupBatchStore(inner, cache.newTtlCache<TieredWarmupBatch>(1024, ttl, clockValue), 0, 0);
}

/** Selects tiered warmup batches. Empty fields match all. */
export class TieredWarmupBatchQuery {
  unit: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minBudget: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredWarmupBatch): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredWarmupBatch[]): TieredWarmupBatch[] {
    const matched = collections.filter(items, (candidate: TieredWarmupBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredWarmupBatches(store: TieredWarmupBatchStore, query: TieredWarmupBatchQuery): TieredWarmupBatch[] {
  return query.apply(store.list());
}
