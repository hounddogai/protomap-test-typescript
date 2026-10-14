import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedPlacementBatch } from "./weighted-placement-batch.js";

/** Keeps weighted placement batches by code. */
export interface WeightedPlacementBatchStore {
  find(code: string): WeightedPlacementBatch | undefined;
  save(item: WeightedPlacementBatch): void;
  remove(code: string): boolean;
  list(): WeightedPlacementBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedPlacementBatchStore implements WeightedPlacementBatchStore {
  items: Map<string, WeightedPlacementBatch>;
  order: string[];

  constructor(items: Map<string, WeightedPlacementBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedPlacementBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedPlacementBatch): void {
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

  list(): WeightedPlacementBatch[] {
    const out: WeightedPlacementBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedPlacementBatchStore(): WeightedPlacementBatchStore {
  return new MemoryWeightedPlacementBatchStore(new Map<string, WeightedPlacementBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedPlacementBatchStore implements WeightedPlacementBatchStore {
  inner: WeightedPlacementBatchStore;
  cache: cache.TtlCache<WeightedPlacementBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedPlacementBatchStore,
    cacheValue: cache.TtlCache<WeightedPlacementBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedPlacementBatch | undefined {
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

  save(item: WeightedPlacementBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedPlacementBatch[] {
    return this.inner.list();
  }
}

export function newCachedWeightedPlacementBatchStore(inner: WeightedPlacementBatchStore, ttl: number, clockValue: clock.Clock): WeightedPlacementBatchStore {
  return new CachedWeightedPlacementBatchStore(
    inner,
    cache.newTtlCache<WeightedPlacementBatch>(256, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted placement batches. Empty fields match all. */
export class WeightedPlacementBatchQuery {
  unit: string;
  minFrequencyCap: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minFrequencyCap: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minFrequencyCap = minFrequencyCap;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedPlacementBatch): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedPlacementBatch[]): WeightedPlacementBatch[] {
    const matched = collections.filter(items, (candidate: WeightedPlacementBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedPlacementBatches(store: WeightedPlacementBatchStore, query: WeightedPlacementBatchQuery): WeightedPlacementBatch[] {
  return query.apply(store.list());
}
