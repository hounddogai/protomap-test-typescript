import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ModelBatch } from "./model-batch.js";

/** Keeps model batches by code. */
export interface ModelBatchStore {
  find(code: string): ModelBatch | undefined;
  save(item: ModelBatch): void;
  remove(code: string): boolean;
  list(): ModelBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryModelBatchStore implements ModelBatchStore {
  items: Map<string, ModelBatch>;
  order: string[];

  constructor(items: Map<string, ModelBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ModelBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ModelBatch): void {
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

  list(): ModelBatch[] {
    const out: ModelBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryModelBatchStore(): ModelBatchStore {
  return new MemoryModelBatchStore(new Map<string, ModelBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedModelBatchStore implements ModelBatchStore {
  inner: ModelBatchStore;
  cache: cache.TtlCache<ModelBatch>;
  hits: number;
  misses: number;

  constructor(inner: ModelBatchStore, cacheValue: cache.TtlCache<ModelBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ModelBatch | undefined {
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

  save(item: ModelBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ModelBatch[] {
    return this.inner.list();
  }
}

export function newCachedModelBatchStore(inner: ModelBatchStore, ttl: number, clockValue: clock.Clock): ModelBatchStore {
  return new CachedModelBatchStore(inner, cache.newTtlCache<ModelBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects model batches. Empty fields match all. */
export class ModelBatchQuery {
  unit: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ModelBatch): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ModelBatch[]): ModelBatch[] {
    const matched = collections.filter(items, (candidate: ModelBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findModelBatches(store: ModelBatchStore, query: ModelBatchQuery): ModelBatch[] {
  return query.apply(store.list());
}
