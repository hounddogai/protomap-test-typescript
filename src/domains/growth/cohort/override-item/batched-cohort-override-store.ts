import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedCohortOverride } from "./batched-cohort-override.js";

/** Keeps batched cohort overrides by code. */
export interface BatchedCohortOverrideStore {
  find(code: string): BatchedCohortOverride | undefined;
  save(item: BatchedCohortOverride): void;
  remove(code: string): boolean;
  list(): BatchedCohortOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedCohortOverrideStore implements BatchedCohortOverrideStore {
  items: Map<string, BatchedCohortOverride>;
  order: string[];

  constructor(items: Map<string, BatchedCohortOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedCohortOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedCohortOverride): void {
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

  list(): BatchedCohortOverride[] {
    const out: BatchedCohortOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedCohortOverrideStore(): BatchedCohortOverrideStore {
  return new MemoryBatchedCohortOverrideStore(new Map<string, BatchedCohortOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedCohortOverrideStore implements BatchedCohortOverrideStore {
  inner: BatchedCohortOverrideStore;
  cache: cache.TtlCache<BatchedCohortOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedCohortOverrideStore,
    cacheValue: cache.TtlCache<BatchedCohortOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedCohortOverride | undefined {
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

  save(item: BatchedCohortOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedCohortOverride[] {
    return this.inner.list();
  }
}

export function newCachedBatchedCohortOverrideStore(inner: BatchedCohortOverrideStore, ttl: number, clockValue: clock.Clock): BatchedCohortOverrideStore {
  return new CachedBatchedCohortOverrideStore(
    inner,
    cache.newTtlCache<BatchedCohortOverride>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched cohort overrides. Empty fields match all. */
export class BatchedCohortOverrideQuery {
  utmSource: string;
  minQuantity: number;
  statuses: string[];
  limit: number;

  constructor(utmSource: string, minQuantity: number, statuses: string[], limit: number) {
    this.utmSource = utmSource;
    this.minQuantity = minQuantity;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedCohortOverride): boolean {
    if (this.utmSource !== "" && text.normalize(item.utmSource) !== text.normalize(this.utmSource)) return false;
    if (item.quantity < this.minQuantity) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedCohortOverride[]): BatchedCohortOverride[] {
    const matched = collections.filter(items, (candidate: BatchedCohortOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedCohortOverrides(store: BatchedCohortOverrideStore, query: BatchedCohortOverrideQuery): BatchedCohortOverride[] {
  return query.apply(store.list());
}
