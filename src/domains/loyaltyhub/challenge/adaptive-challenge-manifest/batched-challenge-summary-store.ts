import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { BatchedChallengeSummary } from "./batched-challenge-summary.js";

/** Keeps batched challenge summaries by code. */
export interface BatchedChallengeSummaryStore {
  find(code: string): BatchedChallengeSummary | undefined;
  save(item: BatchedChallengeSummary): void;
  remove(code: string): boolean;
  list(): BatchedChallengeSummary[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryBatchedChallengeSummaryStore implements BatchedChallengeSummaryStore {
  items: Map<string, BatchedChallengeSummary>;
  order: string[];

  constructor(items: Map<string, BatchedChallengeSummary>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): BatchedChallengeSummary | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: BatchedChallengeSummary): void {
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

  list(): BatchedChallengeSummary[] {
    const out: BatchedChallengeSummary[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryBatchedChallengeSummaryStore(): BatchedChallengeSummaryStore {
  return new MemoryBatchedChallengeSummaryStore(new Map<string, BatchedChallengeSummary>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedBatchedChallengeSummaryStore implements BatchedChallengeSummaryStore {
  inner: BatchedChallengeSummaryStore;
  cache: cache.TtlCache<BatchedChallengeSummary>;
  hits: number;
  misses: number;

  constructor(
    inner: BatchedChallengeSummaryStore,
    cacheValue: cache.TtlCache<BatchedChallengeSummary>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): BatchedChallengeSummary | undefined {
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

  save(item: BatchedChallengeSummary): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): BatchedChallengeSummary[] {
    return this.inner.list();
  }
}

export function newCachedBatchedChallengeSummaryStore(inner: BatchedChallengeSummaryStore, ttl: number, clockValue: clock.Clock): BatchedChallengeSummaryStore {
  return new CachedBatchedChallengeSummaryStore(
    inner,
    cache.newTtlCache<BatchedChallengeSummary>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects batched challenge summaries. Empty fields match all. */
export class BatchedChallengeSummaryQuery {
  segment: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minClicks: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: BatchedChallengeSummary): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: BatchedChallengeSummary[]): BatchedChallengeSummary[] {
    const matched = collections.filter(items, (candidate: BatchedChallengeSummary): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findBatchedChallengeSummaries(store: BatchedChallengeSummaryStore, query: BatchedChallengeSummaryQuery): BatchedChallengeSummary[] {
  return query.apply(store.list());
}
