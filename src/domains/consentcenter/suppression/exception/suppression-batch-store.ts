import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { SuppressionBatch } from "./suppression-batch.js";

/** Keeps suppression batches by code. */
export interface SuppressionBatchStore {
  find(code: string): SuppressionBatch | undefined;
  save(item: SuppressionBatch): void;
  remove(code: string): boolean;
  list(): SuppressionBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemorySuppressionBatchStore implements SuppressionBatchStore {
  items: Map<string, SuppressionBatch>;
  order: string[];

  constructor(items: Map<string, SuppressionBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): SuppressionBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: SuppressionBatch): void {
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

  list(): SuppressionBatch[] {
    const out: SuppressionBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemorySuppressionBatchStore(): SuppressionBatchStore {
  return new MemorySuppressionBatchStore(new Map<string, SuppressionBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedSuppressionBatchStore implements SuppressionBatchStore {
  inner: SuppressionBatchStore;
  cache: cache.TtlCache<SuppressionBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: SuppressionBatchStore,
    cacheValue: cache.TtlCache<SuppressionBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): SuppressionBatch | undefined {
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

  save(item: SuppressionBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): SuppressionBatch[] {
    return this.inner.list();
  }
}

export function newCachedSuppressionBatchStore(inner: SuppressionBatchStore, ttl: number, clockValue: clock.Clock): SuppressionBatchStore {
  return new CachedSuppressionBatchStore(inner, cache.newTtlCache<SuppressionBatch>(512, ttl, clockValue), 0, 0);
}

/** Selects suppression batches. Empty fields match all. */
export class SuppressionBatchQuery {
  category: string;
  minExpiresAt: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minExpiresAt: number, statuses: string[], limit: number) {
    this.category = category;
    this.minExpiresAt = minExpiresAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: SuppressionBatch): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.expiresAt < this.minExpiresAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: SuppressionBatch[]): SuppressionBatch[] {
    const matched = collections.filter(items, (candidate: SuppressionBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findSuppressionBatches(store: SuppressionBatchStore, query: SuppressionBatchQuery): SuppressionBatch[] {
  return query.apply(store.list());
}
