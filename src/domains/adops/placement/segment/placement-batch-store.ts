import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementBatch } from "./placement-batch.js";

/** Keeps placement batches by code. */
export interface PlacementBatchStore {
  find(code: string): PlacementBatch | undefined;
  save(item: PlacementBatch): void;
  remove(code: string): boolean;
  list(): PlacementBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementBatchStore implements PlacementBatchStore {
  items: Map<string, PlacementBatch>;
  order: string[];

  constructor(items: Map<string, PlacementBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementBatch): void {
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

  list(): PlacementBatch[] {
    const out: PlacementBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementBatchStore(): PlacementBatchStore {
  return new MemoryPlacementBatchStore(new Map<string, PlacementBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementBatchStore implements PlacementBatchStore {
  inner: PlacementBatchStore;
  cache: cache.TtlCache<PlacementBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementBatchStore,
    cacheValue: cache.TtlCache<PlacementBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementBatch | undefined {
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

  save(item: PlacementBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementBatch[] {
    return this.inner.list();
  }
}

export function newCachedPlacementBatchStore(inner: PlacementBatchStore, ttl: number, clockValue: clock.Clock): PlacementBatchStore {
  return new CachedPlacementBatchStore(inner, cache.newTtlCache<PlacementBatch>(256, ttl, clockValue), 0, 0);
}

/** Selects placement batches. Empty fields match all. */
export class PlacementBatchQuery {
  locale: string;
  minBudget: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minBudget: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minBudget = minBudget;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementBatch): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.budget < this.minBudget) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementBatch[]): PlacementBatch[] {
    const matched = collections.filter(items, (candidate: PlacementBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementBatches(store: PlacementBatchStore, query: PlacementBatchQuery): PlacementBatch[] {
  return query.apply(store.list());
}
