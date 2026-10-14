import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { WeightedJourneyBatch } from "./weighted-journey-batch.js";

/** Keeps weighted journey batches by code. */
export interface WeightedJourneyBatchStore {
  find(code: string): WeightedJourneyBatch | undefined;
  save(item: WeightedJourneyBatch): void;
  remove(code: string): boolean;
  list(): WeightedJourneyBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryWeightedJourneyBatchStore implements WeightedJourneyBatchStore {
  items: Map<string, WeightedJourneyBatch>;
  order: string[];

  constructor(items: Map<string, WeightedJourneyBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): WeightedJourneyBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: WeightedJourneyBatch): void {
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

  list(): WeightedJourneyBatch[] {
    const out: WeightedJourneyBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryWeightedJourneyBatchStore(): WeightedJourneyBatchStore {
  return new MemoryWeightedJourneyBatchStore(new Map<string, WeightedJourneyBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedWeightedJourneyBatchStore implements WeightedJourneyBatchStore {
  inner: WeightedJourneyBatchStore;
  cache: cache.TtlCache<WeightedJourneyBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: WeightedJourneyBatchStore,
    cacheValue: cache.TtlCache<WeightedJourneyBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): WeightedJourneyBatch | undefined {
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

  save(item: WeightedJourneyBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): WeightedJourneyBatch[] {
    return this.inner.list();
  }
}

export function newCachedWeightedJourneyBatchStore(inner: WeightedJourneyBatchStore, ttl: number, clockValue: clock.Clock): WeightedJourneyBatchStore {
  return new CachedWeightedJourneyBatchStore(
    inner,
    cache.newTtlCache<WeightedJourneyBatch>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects weighted journey batches. Empty fields match all. */
export class WeightedJourneyBatchQuery {
  label: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minMargin: number, statuses: string[], limit: number) {
    this.label = label;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: WeightedJourneyBatch): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: WeightedJourneyBatch[]): WeightedJourneyBatch[] {
    const matched = collections.filter(items, (candidate: WeightedJourneyBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findWeightedJourneyBatches(store: WeightedJourneyBatchStore, query: WeightedJourneyBatchQuery): WeightedJourneyBatch[] {
  return query.apply(store.list());
}
