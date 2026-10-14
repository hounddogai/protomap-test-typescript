import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledPathEstimate } from "./scheduled-path-estimate.js";

/** Keeps scheduled path estimates by code. */
export interface ScheduledPathEstimateStore {
  find(code: string): ScheduledPathEstimate | undefined;
  save(item: ScheduledPathEstimate): void;
  remove(code: string): boolean;
  list(): ScheduledPathEstimate[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledPathEstimateStore implements ScheduledPathEstimateStore {
  items: Map<string, ScheduledPathEstimate>;
  order: string[];

  constructor(items: Map<string, ScheduledPathEstimate>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledPathEstimate | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledPathEstimate): void {
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

  list(): ScheduledPathEstimate[] {
    const out: ScheduledPathEstimate[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledPathEstimateStore(): ScheduledPathEstimateStore {
  return new MemoryScheduledPathEstimateStore(new Map<string, ScheduledPathEstimate>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledPathEstimateStore implements ScheduledPathEstimateStore {
  inner: ScheduledPathEstimateStore;
  cache: cache.TtlCache<ScheduledPathEstimate>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledPathEstimateStore,
    cacheValue: cache.TtlCache<ScheduledPathEstimate>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledPathEstimate | undefined {
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

  save(item: ScheduledPathEstimate): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledPathEstimate[] {
    return this.inner.list();
  }
}

export function newCachedScheduledPathEstimateStore(inner: ScheduledPathEstimateStore, ttl: number, clockValue: clock.Clock): ScheduledPathEstimateStore {
  return new CachedScheduledPathEstimateStore(
    inner,
    cache.newTtlCache<ScheduledPathEstimate>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled path estimates. Empty fields match all. */
export class ScheduledPathEstimateQuery {
  segment: string;
  minBatchSize: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minBatchSize: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minBatchSize = minBatchSize;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledPathEstimate): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.batchSize < this.minBatchSize) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledPathEstimate[]): ScheduledPathEstimate[] {
    const matched = collections.filter(items, (candidate: ScheduledPathEstimate): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledPathEstimates(store: ScheduledPathEstimateStore, query: ScheduledPathEstimateQuery): ScheduledPathEstimate[] {
  return query.apply(store.list());
}
