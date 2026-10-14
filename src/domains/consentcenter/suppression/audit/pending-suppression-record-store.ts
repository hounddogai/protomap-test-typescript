import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PendingSuppressionRecord } from "./pending-suppression-record.js";

/** Keeps pending suppression records by code. */
export interface PendingSuppressionRecordStore {
  find(code: string): PendingSuppressionRecord | undefined;
  save(item: PendingSuppressionRecord): void;
  remove(code: string): boolean;
  list(): PendingSuppressionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPendingSuppressionRecordStore implements PendingSuppressionRecordStore {
  items: Map<string, PendingSuppressionRecord>;
  order: string[];

  constructor(items: Map<string, PendingSuppressionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PendingSuppressionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PendingSuppressionRecord): void {
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

  list(): PendingSuppressionRecord[] {
    const out: PendingSuppressionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPendingSuppressionRecordStore(): PendingSuppressionRecordStore {
  return new MemoryPendingSuppressionRecordStore(new Map<string, PendingSuppressionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPendingSuppressionRecordStore implements PendingSuppressionRecordStore {
  inner: PendingSuppressionRecordStore;
  cache: cache.TtlCache<PendingSuppressionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: PendingSuppressionRecordStore,
    cacheValue: cache.TtlCache<PendingSuppressionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PendingSuppressionRecord | undefined {
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

  save(item: PendingSuppressionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PendingSuppressionRecord[] {
    return this.inner.list();
  }
}

export function newCachedPendingSuppressionRecordStore(inner: PendingSuppressionRecordStore, ttl: number, clockValue: clock.Clock): PendingSuppressionRecordStore {
  return new CachedPendingSuppressionRecordStore(
    inner,
    cache.newTtlCache<PendingSuppressionRecord>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects pending suppression records. Empty fields match all. */
export class PendingSuppressionRecordQuery {
  category: string;
  minRetries: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minRetries: number, statuses: string[], limit: number) {
    this.category = category;
    this.minRetries = minRetries;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PendingSuppressionRecord): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.retries < this.minRetries) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PendingSuppressionRecord[]): PendingSuppressionRecord[] {
    const matched = collections.filter(items, (candidate: PendingSuppressionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPendingSuppressionRecords(store: PendingSuppressionRecordStore, query: PendingSuppressionRecordQuery): PendingSuppressionRecord[] {
  return query.apply(store.list());
}
