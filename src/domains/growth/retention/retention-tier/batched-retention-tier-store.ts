import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedRetentionTier } from "./batched-retention-tier.js";

/** Keeps batched retention tiers by code. */
export interface BatchedRetentionTierStore {
  find(code: string): BatchedRetentionTier | undefined;
  save(item: BatchedRetentionTier): void;
  remove(code: string): boolean;
  list(): BatchedRetentionTier[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedRetentionTierStore implements BatchedRetentionTierStore {
  items: Map<string, BatchedRetentionTier>;
  order: string[];

  constructor(items: Map<string, BatchedRetentionTier>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedRetentionTier | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedRetentionTier): void {
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

  list(): BatchedRetentionTier[] {
    const out: BatchedRetentionTier[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedRetentionTierStore(): BatchedRetentionTierStore {
  return new MemoryBatchedRetentionTierStore(new Map<string, BatchedRetentionTier>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedRetentionTierStore implements BatchedRetentionTierStore {
  inner: BatchedRetentionTierStore;
  cache: cache.TtlCache<BatchedRetentionTier>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedRetentionTierStore,
    cacheValue: cache.TtlCache<BatchedRetentionTier>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedRetentionTier | undefined {
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

  save(item: BatchedRetentionTier): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedRetentionTier[] {
    return this.inner.list();
  }
}

export function newCachedBatchedRetentionTierStore(inner: BatchedRetentionTierStore, ttl: number, clockValue: clock.Clock): BatchedRetentionTierStore {
  return new CachedBatchedRetentionTierStore(inner, cache.newTtlCache<BatchedRetentionTier>(64, ttl, clockValue), 0, 0);
}

/** Selects batched retention tiers. Empty fields match all. */
export class BatchedRetentionTierQuery {
  source: string;
  minEndsAt: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minEndsAt: number, statuses: string[], limit: number) {
    this.source = source;
    this.minEndsAt = minEndsAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedRetentionTier): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.endsAt < this.minEndsAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedRetentionTier[]): BatchedRetentionTier[] {
    const matched = collections.filter(items, (candidate: BatchedRetentionTier): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedRetentionTiers(store: BatchedRetentionTierStore, query: BatchedRetentionTierQuery): BatchedRetentionTier[] {
  return query.apply(store.list());
}
