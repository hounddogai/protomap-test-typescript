import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedBidRuleSummary } from "./batched-bid-rule-summary.js";

/** Keeps batched bid rule summaries by code. */
export interface BatchedBidRuleSummaryStore {
  find(code: string): BatchedBidRuleSummary | undefined;
  save(item: BatchedBidRuleSummary): void;
  remove(code: string): boolean;
  list(): BatchedBidRuleSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedBidRuleSummaryStore implements BatchedBidRuleSummaryStore {
  items: Map<string, BatchedBidRuleSummary>;
  order: string[];

  constructor(items: Map<string, BatchedBidRuleSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedBidRuleSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedBidRuleSummary): void {
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

  list(): BatchedBidRuleSummary[] {
    const out: BatchedBidRuleSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedBidRuleSummaryStore(): BatchedBidRuleSummaryStore {
  return new MemoryBatchedBidRuleSummaryStore(new Map<string, BatchedBidRuleSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedBidRuleSummaryStore implements BatchedBidRuleSummaryStore {
  inner: BatchedBidRuleSummaryStore;
  cache: cache.TtlCache<BatchedBidRuleSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedBidRuleSummaryStore,
    cacheValue: cache.TtlCache<BatchedBidRuleSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedBidRuleSummary | undefined {
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

  save(item: BatchedBidRuleSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedBidRuleSummary[] {
    return this.inner.list();
  }
}

export function newCachedBatchedBidRuleSummaryStore(inner: BatchedBidRuleSummaryStore, ttl: number, clockValue: clock.Clock): BatchedBidRuleSummaryStore {
  return new CachedBatchedBidRuleSummaryStore(
    inner,
    cache.newTtlCache<BatchedBidRuleSummary>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched bid rule summaries. Empty fields match all. */
export class BatchedBidRuleSummaryQuery {
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

  matches(item: BatchedBidRuleSummary): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.frequencyCap < this.minFrequencyCap) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedBidRuleSummary[]): BatchedBidRuleSummary[] {
    const matched = collections.filter(items, (candidate: BatchedBidRuleSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedBidRuleSummaries(store: BatchedBidRuleSummaryStore, query: BatchedBidRuleSummaryQuery): BatchedBidRuleSummary[] {
  return query.apply(store.list());
}
