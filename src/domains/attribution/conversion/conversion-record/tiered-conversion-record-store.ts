import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TieredConversionRecord } from "./tiered-conversion-record.js";

/** Keeps tiered conversion records by code. */
export interface TieredConversionRecordStore {
  find(code: string): TieredConversionRecord | undefined;
  save(item: TieredConversionRecord): void;
  remove(code: string): boolean;
  list(): TieredConversionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTieredConversionRecordStore implements TieredConversionRecordStore {
  items: Map<string, TieredConversionRecord>;
  order: string[];

  constructor(items: Map<string, TieredConversionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TieredConversionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TieredConversionRecord): void {
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

  list(): TieredConversionRecord[] {
    const out: TieredConversionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTieredConversionRecordStore(): TieredConversionRecordStore {
  return new MemoryTieredConversionRecordStore(new Map<string, TieredConversionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTieredConversionRecordStore implements TieredConversionRecordStore {
  inner: TieredConversionRecordStore;
  cache: cache.TtlCache<TieredConversionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: TieredConversionRecordStore,
    cacheValue: cache.TtlCache<TieredConversionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TieredConversionRecord | undefined {
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

  save(item: TieredConversionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TieredConversionRecord[] {
    return this.inner.list();
  }
}

export function newCachedTieredConversionRecordStore(inner: TieredConversionRecordStore, ttl: number, clockValue: clock.Clock): TieredConversionRecordStore {
  return new CachedTieredConversionRecordStore(
    inner,
    cache.newTtlCache<TieredConversionRecord>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects tiered conversion records. Empty fields match all. */
export class TieredConversionRecordQuery {
  segment: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(segment: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.segment = segment;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TieredConversionRecord): boolean {
    if (this.segment !== "" && text.normalize(item.segment) !== text.normalize(this.segment)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TieredConversionRecord[]): TieredConversionRecord[] {
    const matched = collections.filter(items, (candidate: TieredConversionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTieredConversionRecords(store: TieredConversionRecordStore, query: TieredConversionRecordQuery): TieredConversionRecord[] {
  return query.apply(store.list());
}
