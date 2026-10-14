import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ScheduledCsatBatch } from "./scheduled-csat-batch.js";

/** Keeps scheduled csat batches by code. */
export interface ScheduledCsatBatchStore {
  find(code: string): ScheduledCsatBatch | undefined;
  save(item: ScheduledCsatBatch): void;
  remove(code: string): boolean;
  list(): ScheduledCsatBatch[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryScheduledCsatBatchStore implements ScheduledCsatBatchStore {
  items: Map<string, ScheduledCsatBatch>;
  order: string[];

  constructor(items: Map<string, ScheduledCsatBatch>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ScheduledCsatBatch | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ScheduledCsatBatch): void {
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

  list(): ScheduledCsatBatch[] {
    const out: ScheduledCsatBatch[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryScheduledCsatBatchStore(): ScheduledCsatBatchStore {
  return new MemoryScheduledCsatBatchStore(new Map<string, ScheduledCsatBatch>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedScheduledCsatBatchStore implements ScheduledCsatBatchStore {
  inner: ScheduledCsatBatchStore;
  cache: cache.TtlCache<ScheduledCsatBatch>;
  hits: number;
  misses: number;

  constructor(
    inner: ScheduledCsatBatchStore,
    cacheValue: cache.TtlCache<ScheduledCsatBatch>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ScheduledCsatBatch | undefined {
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

  save(item: ScheduledCsatBatch): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ScheduledCsatBatch[] {
    return this.inner.list();
  }
}

export function newCachedScheduledCsatBatchStore(inner: ScheduledCsatBatchStore, ttl: number, clockValue: clock.Clock): ScheduledCsatBatchStore {
  return new CachedScheduledCsatBatchStore(inner, cache.newTtlCache<ScheduledCsatBatch>(128, ttl, clockValue), 0, 0);
}

/** Selects scheduled csat batches. Empty fields match all. */
export class ScheduledCsatBatchQuery {
  locale: string;
  minOpenRate: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minOpenRate: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minOpenRate = minOpenRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ScheduledCsatBatch): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.openRate < this.minOpenRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ScheduledCsatBatch[]): ScheduledCsatBatch[] {
    const matched = collections.filter(items, (candidate: ScheduledCsatBatch): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findScheduledCsatBatches(store: ScheduledCsatBatchStore, query: ScheduledCsatBatchQuery): ScheduledCsatBatch[] {
  return query.apply(store.list());
}
