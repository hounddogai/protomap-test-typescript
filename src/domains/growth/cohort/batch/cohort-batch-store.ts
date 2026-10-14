import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { CohortBatch } from "./cohort-batch.js";

/** Keeps cohort batches by code. */
export interface CohortBatchStore {
  find(code: string): CohortBatch | undefined;
  save(item: CohortBatch): void;
  remove(code: string): boolean;
  list(): CohortBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryCohortBatchStore implements CohortBatchStore {
  items: Map<string, CohortBatch>;
  order: string[];

  constructor(items: Map<string, CohortBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): CohortBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: CohortBatch): void {
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

  list(): CohortBatch[] {
    const out: CohortBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryCohortBatchStore(): CohortBatchStore {
  return new MemoryCohortBatchStore(new Map<string, CohortBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedCohortBatchStore implements CohortBatchStore {
  inner: CohortBatchStore;
  cache: cache.TtlCache<CohortBatch>;
  hits: number;
  misses: number;

  constructor(inner: CohortBatchStore, cacheValue: cache.TtlCache<CohortBatch>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): CohortBatch | undefined {
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

  save(item: CohortBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): CohortBatch[] {
    return this.inner.list();
  }
}

export function newCachedCohortBatchStore(inner: CohortBatchStore, ttl: number, clockValue: clock.Clock): CohortBatchStore {
  return new CachedCohortBatchStore(inner, cache.newTtlCache<CohortBatch>(64, ttl, clockValue), 0, 0);
}

/** Selects cohort batches. Empty fields match all. */
export class CohortBatchQuery {
  name: string;
  minFloorValue: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minFloorValue: number, statuses: string[], limit: number) {
    this.name = name;
    this.minFloorValue = minFloorValue;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: CohortBatch): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.floorValue < this.minFloorValue) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: CohortBatch[]): CohortBatch[] {
    const matched = collections.filter(items, (candidate: CohortBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findCohortBatches(store: CohortBatchStore, query: CohortBatchQuery): CohortBatch[] {
  return query.apply(store.list());
}
