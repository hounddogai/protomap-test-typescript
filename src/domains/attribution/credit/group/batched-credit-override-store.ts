import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedCreditOverride } from "./batched-credit-override.js";

/** Keeps batched credit overrides by code. */
export interface BatchedCreditOverrideStore {
  find(code: string): BatchedCreditOverride | undefined;
  save(item: BatchedCreditOverride): void;
  remove(code: string): boolean;
  list(): BatchedCreditOverride[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedCreditOverrideStore implements BatchedCreditOverrideStore {
  items: Map<string, BatchedCreditOverride>;
  order: string[];

  constructor(items: Map<string, BatchedCreditOverride>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedCreditOverride | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedCreditOverride): void {
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

  list(): BatchedCreditOverride[] {
    const out: BatchedCreditOverride[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedCreditOverrideStore(): BatchedCreditOverrideStore {
  return new MemoryBatchedCreditOverrideStore(new Map<string, BatchedCreditOverride>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedCreditOverrideStore implements BatchedCreditOverrideStore {
  inner: BatchedCreditOverrideStore;
  cache: cache.TtlCache<BatchedCreditOverride>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedCreditOverrideStore,
    cacheValue: cache.TtlCache<BatchedCreditOverride>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedCreditOverride | undefined {
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

  save(item: BatchedCreditOverride): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedCreditOverride[] {
    return this.inner.list();
  }
}

export function newCachedBatchedCreditOverrideStore(inner: BatchedCreditOverrideStore, ttl: number, clockValue: clock.Clock): BatchedCreditOverrideStore {
  return new CachedBatchedCreditOverrideStore(
    inner,
    cache.newTtlCache<BatchedCreditOverride>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched credit overrides. Empty fields match all. */
export class BatchedCreditOverrideQuery {
  segment: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minGraceDays: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedCreditOverride): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedCreditOverride[]): BatchedCreditOverride[] {
    const matched = collections.filter(items, (candidate: BatchedCreditOverride): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedCreditOverrides(store: BatchedCreditOverrideStore, query: BatchedCreditOverrideQuery): BatchedCreditOverride[] {
  return query.apply(store.list());
}
