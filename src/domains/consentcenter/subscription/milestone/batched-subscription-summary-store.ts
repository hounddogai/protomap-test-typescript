import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedSubscriptionSummary } from "./batched-subscription-summary.js";

/** Keeps batched subscription summaries by code. */
export interface BatchedSubscriptionSummaryStore {
  find(code: string): BatchedSubscriptionSummary | undefined;
  save(item: BatchedSubscriptionSummary): void;
  remove(code: string): boolean;
  list(): BatchedSubscriptionSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedSubscriptionSummaryStore implements BatchedSubscriptionSummaryStore {
  items: Map<string, BatchedSubscriptionSummary>;
  order: string[];

  constructor(items: Map<string, BatchedSubscriptionSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedSubscriptionSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedSubscriptionSummary): void {
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

  list(): BatchedSubscriptionSummary[] {
    const out: BatchedSubscriptionSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedSubscriptionSummaryStore(): BatchedSubscriptionSummaryStore {
  return new MemoryBatchedSubscriptionSummaryStore(new Map<string, BatchedSubscriptionSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedSubscriptionSummaryStore implements BatchedSubscriptionSummaryStore {
  inner: BatchedSubscriptionSummaryStore;
  cache: cache.TtlCache<BatchedSubscriptionSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedSubscriptionSummaryStore,
    cacheValue: cache.TtlCache<BatchedSubscriptionSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedSubscriptionSummary | undefined {
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

  save(item: BatchedSubscriptionSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedSubscriptionSummary[] {
    return this.inner.list();
  }
}

export function newCachedBatchedSubscriptionSummaryStore(inner: BatchedSubscriptionSummaryStore, ttl: number, clockValue: clock.Clock): BatchedSubscriptionSummaryStore {
  return new CachedBatchedSubscriptionSummaryStore(
    inner,
    cache.newTtlCache<BatchedSubscriptionSummary>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched subscription summaries. Empty fields match all. */
export class BatchedSubscriptionSummaryQuery {
  label: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minBatchSize: number, statuses: string[], limit: number) {
    this.label = label;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedSubscriptionSummary): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedSubscriptionSummary[]): BatchedSubscriptionSummary[] {
    const matched = collections.filter(items, (candidate: BatchedSubscriptionSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedSubscriptionSummaries(store: BatchedSubscriptionSummaryStore, query: BatchedSubscriptionSummaryQuery): BatchedSubscriptionSummary[] {
  return query.apply(store.list());
}
