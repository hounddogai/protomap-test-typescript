import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackRetentionRecord } from "./fallback-retention-record.js";

/** Keeps fallback retention records by code. */
export interface FallbackRetentionRecordStore {
  find(code: string): FallbackRetentionRecord | undefined;
  save(item: FallbackRetentionRecord): void;
  remove(code: string): boolean;
  list(): FallbackRetentionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackRetentionRecordStore implements FallbackRetentionRecordStore {
  items: Map<string, FallbackRetentionRecord>;
  order: string[];

  constructor(items: Map<string, FallbackRetentionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackRetentionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackRetentionRecord): void {
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

  list(): FallbackRetentionRecord[] {
    const out: FallbackRetentionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackRetentionRecordStore(): FallbackRetentionRecordStore {
  return new MemoryFallbackRetentionRecordStore(new Map<string, FallbackRetentionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackRetentionRecordStore implements FallbackRetentionRecordStore {
  inner: FallbackRetentionRecordStore;
  cache: cache.TtlCache<FallbackRetentionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackRetentionRecordStore,
    cacheValue: cache.TtlCache<FallbackRetentionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackRetentionRecord | undefined {
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

  save(item: FallbackRetentionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackRetentionRecord[] {
    return this.inner.list();
  }
}

export function newCachedFallbackRetentionRecordStore(inner: FallbackRetentionRecordStore, ttl: number, clockValue: clock.Clock): FallbackRetentionRecordStore {
  return new CachedFallbackRetentionRecordStore(
    inner,
    cache.newTtlCache<FallbackRetentionRecord>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback retention records. Empty fields match all. */
export class FallbackRetentionRecordQuery {
  category: string;
  minAmount: number;
  statuses: string[];
  limit: number;

  constructor(category: string, minAmount: number, statuses: string[], limit: number) {
    this.category = category;
    this.minAmount = minAmount;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackRetentionRecord): boolean {
    if (this.category !== "" && text.normalize(item.category) !== text.normalize(this.category)) return false;
    if (item.amount < this.minAmount) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackRetentionRecord[]): FallbackRetentionRecord[] {
    const matched = collections.filter(items, (candidate: FallbackRetentionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackRetentionRecords(store: FallbackRetentionRecordStore, query: FallbackRetentionRecordQuery): FallbackRetentionRecord[] {
  return query.apply(store.list());
}
