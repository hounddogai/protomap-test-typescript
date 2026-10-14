import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { GlobalSuppressionRecord } from "./global-suppression-record.js";

/** Keeps global suppression records by code. */
export interface GlobalSuppressionRecordStore {
  find(code: string): GlobalSuppressionRecord | undefined;
  save(item: GlobalSuppressionRecord): void;
  remove(code: string): boolean;
  list(): GlobalSuppressionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryGlobalSuppressionRecordStore implements GlobalSuppressionRecordStore {
  items: Map<string, GlobalSuppressionRecord>;
  order: string[];

  constructor(items: Map<string, GlobalSuppressionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): GlobalSuppressionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: GlobalSuppressionRecord): void {
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

  list(): GlobalSuppressionRecord[] {
    const out: GlobalSuppressionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryGlobalSuppressionRecordStore(): GlobalSuppressionRecordStore {
  return new MemoryGlobalSuppressionRecordStore(new Map<string, GlobalSuppressionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedGlobalSuppressionRecordStore implements GlobalSuppressionRecordStore {
  inner: GlobalSuppressionRecordStore;
  cache: cache.TtlCache<GlobalSuppressionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: GlobalSuppressionRecordStore,
    cacheValue: cache.TtlCache<GlobalSuppressionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): GlobalSuppressionRecord | undefined {
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

  save(item: GlobalSuppressionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): GlobalSuppressionRecord[] {
    return this.inner.list();
  }
}

export function newCachedGlobalSuppressionRecordStore(inner: GlobalSuppressionRecordStore, ttl: number, clockValue: clock.Clock): GlobalSuppressionRecordStore {
  return new CachedGlobalSuppressionRecordStore(
    inner,
    cache.newTtlCache<GlobalSuppressionRecord>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects global suppression records. Empty fields match all. */
export class GlobalSuppressionRecordQuery {
  source: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(source: string, minConversionRate: number, statuses: string[], limit: number) {
    this.source = source;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: GlobalSuppressionRecord): boolean {
    if (this.source !== "" && text.normalize(item.source) !== text.normalize(this.source)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: GlobalSuppressionRecord[]): GlobalSuppressionRecord[] {
    const matched = collections.filter(items, (candidate: GlobalSuppressionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findGlobalSuppressionRecords(store: GlobalSuppressionRecordStore, query: GlobalSuppressionRecordQuery): GlobalSuppressionRecord[] {
  return query.apply(store.list());
}
