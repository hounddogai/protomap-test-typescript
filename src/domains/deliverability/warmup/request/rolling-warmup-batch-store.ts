import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingWarmupBatch } from "./rolling-warmup-batch.js";

/** Keeps rolling warmup batches by code. */
export interface RollingWarmupBatchStore {
  find(code: string): RollingWarmupBatch | undefined;
  save(item: RollingWarmupBatch): void;
  remove(code: string): boolean;
  list(): RollingWarmupBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingWarmupBatchStore implements RollingWarmupBatchStore {
  items: Map<string, RollingWarmupBatch>;
  order: string[];

  constructor(items: Map<string, RollingWarmupBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingWarmupBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingWarmupBatch): void {
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

  list(): RollingWarmupBatch[] {
    const out: RollingWarmupBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingWarmupBatchStore(): RollingWarmupBatchStore {
  return new MemoryRollingWarmupBatchStore(new Map<string, RollingWarmupBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingWarmupBatchStore implements RollingWarmupBatchStore {
  inner: RollingWarmupBatchStore;
  cache: cache.TtlCache<RollingWarmupBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingWarmupBatchStore,
    cacheValue: cache.TtlCache<RollingWarmupBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingWarmupBatch | undefined {
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

  save(item: RollingWarmupBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingWarmupBatch[] {
    return this.inner.list();
  }
}

export function newCachedRollingWarmupBatchStore(inner: RollingWarmupBatchStore, ttl: number, clockValue: clock.Clock): RollingWarmupBatchStore {
  return new CachedRollingWarmupBatchStore(inner, cache.newTtlCache<RollingWarmupBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects rolling warmup batches. Empty fields match all. */
export class RollingWarmupBatchQuery {
  unit: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingWarmupBatch): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingWarmupBatch[]): RollingWarmupBatch[] {
    const matched = collections.filter(items, (candidate: RollingWarmupBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingWarmupBatches(store: RollingWarmupBatchStore, query: RollingWarmupBatchQuery): RollingWarmupBatch[] {
  return query.apply(store.list());
}
