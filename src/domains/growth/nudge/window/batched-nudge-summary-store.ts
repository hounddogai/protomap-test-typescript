import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedNudgeSummary } from "./batched-nudge-summary.js";

/** Keeps batched nudge summaries by code. */
export interface BatchedNudgeSummaryStore {
  find(code: string): BatchedNudgeSummary | undefined;
  save(item: BatchedNudgeSummary): void;
  remove(code: string): boolean;
  list(): BatchedNudgeSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedNudgeSummaryStore implements BatchedNudgeSummaryStore {
  items: Map<string, BatchedNudgeSummary>;
  order: string[];

  constructor(items: Map<string, BatchedNudgeSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedNudgeSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedNudgeSummary): void {
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

  list(): BatchedNudgeSummary[] {
    const out: BatchedNudgeSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedNudgeSummaryStore(): BatchedNudgeSummaryStore {
  return new MemoryBatchedNudgeSummaryStore(new Map<string, BatchedNudgeSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedNudgeSummaryStore implements BatchedNudgeSummaryStore {
  inner: BatchedNudgeSummaryStore;
  cache: cache.TtlCache<BatchedNudgeSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedNudgeSummaryStore,
    cacheValue: cache.TtlCache<BatchedNudgeSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedNudgeSummary | undefined {
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

  save(item: BatchedNudgeSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedNudgeSummary[] {
    return this.inner.list();
  }
}

export function newCachedBatchedNudgeSummaryStore(inner: BatchedNudgeSummaryStore, ttl: number, clockValue: clock.Clock): BatchedNudgeSummaryStore {
  return new CachedBatchedNudgeSummaryStore(inner, cache.newTtlCache<BatchedNudgeSummary>(64, ttl, clockValue), 0, 0);
}

/** Selects batched nudge summaries. Empty fields match all. */
export class BatchedNudgeSummaryQuery {
  country: string;
  minMargin: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minMargin: number, statuses: string[], limit: number) {
    this.country = country;
    this.minMargin = minMargin;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedNudgeSummary): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.margin < this.minMargin) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedNudgeSummary[]): BatchedNudgeSummary[] {
    const matched = collections.filter(items, (candidate: BatchedNudgeSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedNudgeSummaries(store: BatchedNudgeSummaryStore, query: BatchedNudgeSummaryQuery): BatchedNudgeSummary[] {
  return query.apply(store.list());
}
