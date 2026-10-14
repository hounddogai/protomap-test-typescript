import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledCohortBatch } from "./scheduled-cohort-batch.js";

/** Keeps scheduled cohort batches by code. */
export interface ScheduledCohortBatchStore {
  find(code: string): ScheduledCohortBatch | undefined;
  save(item: ScheduledCohortBatch): void;
  remove(code: string): boolean;
  list(): ScheduledCohortBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledCohortBatchStore implements ScheduledCohortBatchStore {
  items: Map<string, ScheduledCohortBatch>;
  order: string[];

  constructor(items: Map<string, ScheduledCohortBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledCohortBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledCohortBatch): void {
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

  list(): ScheduledCohortBatch[] {
    const out: ScheduledCohortBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledCohortBatchStore(): ScheduledCohortBatchStore {
  return new MemoryScheduledCohortBatchStore(new Map<string, ScheduledCohortBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledCohortBatchStore implements ScheduledCohortBatchStore {
  inner: ScheduledCohortBatchStore;
  cache: cache.TtlCache<ScheduledCohortBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledCohortBatchStore,
    cacheValue: cache.TtlCache<ScheduledCohortBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledCohortBatch | undefined {
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

  save(item: ScheduledCohortBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledCohortBatch[] {
    return this.inner.list();
  }
}

export function newCachedScheduledCohortBatchStore(inner: ScheduledCohortBatchStore, ttl: number, clockValue: clock.Clock): ScheduledCohortBatchStore {
  return new CachedScheduledCohortBatchStore(
    inner,
    cache.newTtlCache<ScheduledCohortBatch>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled cohort batches. Empty fields match all. */
export class ScheduledCohortBatchQuery {
  source: string;
  minBid: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minBid: number, statuses: string[], limit: number) {
    this.source = source;
    this.minBid = minBid;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledCohortBatch): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.bid < this.minBid) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledCohortBatch[]): ScheduledCohortBatch[] {
    const matched = collections.filter(items, (candidate: ScheduledCohortBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledCohortBatches(store: ScheduledCohortBatchStore, query: ScheduledCohortBatchQuery): ScheduledCohortBatch[] {
  return query.apply(store.list());
}
