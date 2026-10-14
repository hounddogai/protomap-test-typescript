import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedJourneySummary } from "./batched-journey-summary.js";

/** Keeps batched journey summaries by code. */
export interface BatchedJourneySummaryStore {
  find(code: string): BatchedJourneySummary | undefined;
  save(item: BatchedJourneySummary): void;
  remove(code: string): boolean;
  list(): BatchedJourneySummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedJourneySummaryStore implements BatchedJourneySummaryStore {
  items: Map<string, BatchedJourneySummary>;
  order: string[];

  constructor(items: Map<string, BatchedJourneySummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedJourneySummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedJourneySummary): void {
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

  list(): BatchedJourneySummary[] {
    const out: BatchedJourneySummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedJourneySummaryStore(): BatchedJourneySummaryStore {
  return new MemoryBatchedJourneySummaryStore(new Map<string, BatchedJourneySummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedJourneySummaryStore implements BatchedJourneySummaryStore {
  inner: BatchedJourneySummaryStore;
  cache: cache.TtlCache<BatchedJourneySummary>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedJourneySummaryStore,
    cacheValue: cache.TtlCache<BatchedJourneySummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedJourneySummary | undefined {
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

  save(item: BatchedJourneySummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedJourneySummary[] {
    return this.inner.list();
  }
}

export function newCachedBatchedJourneySummaryStore(inner: BatchedJourneySummaryStore, ttl: number, clockValue: clock.Clock): BatchedJourneySummaryStore {
  return new CachedBatchedJourneySummaryStore(
    inner,
    cache.newTtlCache<BatchedJourneySummary>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched journey summaries. Empty fields match all. */
export class BatchedJourneySummaryQuery {
  title: string;
  minGraceDays: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minGraceDays: number, statuses: string[], limit: number) {
    this.title = title;
    this.minGraceDays = minGraceDays;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedJourneySummary): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.graceDays < this.minGraceDays) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedJourneySummary[]): BatchedJourneySummary[] {
    const matched = collections.filter(items, (candidate: BatchedJourneySummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedJourneySummaries(store: BatchedJourneySummaryStore, query: BatchedJourneySummaryQuery): BatchedJourneySummary[] {
  return query.apply(store.list());
}
