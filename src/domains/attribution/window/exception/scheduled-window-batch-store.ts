import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledWindowBatch } from "./scheduled-window-batch.js";

/** Keeps scheduled window batches by code. */
export interface ScheduledWindowBatchStore {
  find(code: string): ScheduledWindowBatch | undefined;
  save(item: ScheduledWindowBatch): void;
  remove(code: string): boolean;
  list(): ScheduledWindowBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledWindowBatchStore implements ScheduledWindowBatchStore {
  items: Map<string, ScheduledWindowBatch>;
  order: string[];

  constructor(items: Map<string, ScheduledWindowBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledWindowBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledWindowBatch): void {
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

  list(): ScheduledWindowBatch[] {
    const out: ScheduledWindowBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledWindowBatchStore(): ScheduledWindowBatchStore {
  return new MemoryScheduledWindowBatchStore(new Map<string, ScheduledWindowBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledWindowBatchStore implements ScheduledWindowBatchStore {
  inner: ScheduledWindowBatchStore;
  cache: cache.TtlCache<ScheduledWindowBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledWindowBatchStore,
    cacheValue: cache.TtlCache<ScheduledWindowBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledWindowBatch | undefined {
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

  save(item: ScheduledWindowBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledWindowBatch[] {
    return this.inner.list();
  }
}

export function newCachedScheduledWindowBatchStore(inner: ScheduledWindowBatchStore, ttl: number, clockValue: clock.Clock): ScheduledWindowBatchStore {
  return new CachedScheduledWindowBatchStore(
    inner,
    cache.newTtlCache<ScheduledWindowBatch>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects scheduled window batches. Empty fields match all. */
export class ScheduledWindowBatchQuery {
  unit: string;
  minScore: number;
  statuses: string[];
  limit: number;

  constructor(unit: string, minScore: number, statuses: string[], limit: number) {
    this.unit = unit;
    this.minScore = minScore;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledWindowBatch): boolean {
    if (this.unit !== "" && text.normalize(item.unit) !== text.normalize(this.unit)) return false;
    if (item.score < this.minScore) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledWindowBatch[]): ScheduledWindowBatch[] {
    const matched = collections.filter(items, (candidate: ScheduledWindowBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledWindowBatches(store: ScheduledWindowBatchStore, query: ScheduledWindowBatchQuery): ScheduledWindowBatch[] {
  return query.apply(store.list());
}
