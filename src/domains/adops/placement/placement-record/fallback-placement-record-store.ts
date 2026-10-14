import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { FallbackPlacementRecord } from "./fallback-placement-record.js";

/** Keeps fallback placement records by code. */
export interface FallbackPlacementRecordStore {
  find(code: string): FallbackPlacementRecord | undefined;
  save(item: FallbackPlacementRecord): void;
  remove(code: string): boolean;
  list(): FallbackPlacementRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryFallbackPlacementRecordStore implements FallbackPlacementRecordStore {
  items: Map<string, FallbackPlacementRecord>;
  order: string[];

  constructor(items: Map<string, FallbackPlacementRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): FallbackPlacementRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: FallbackPlacementRecord): void {
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

  list(): FallbackPlacementRecord[] {
    const out: FallbackPlacementRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryFallbackPlacementRecordStore(): FallbackPlacementRecordStore {
  return new MemoryFallbackPlacementRecordStore(new Map<string, FallbackPlacementRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedFallbackPlacementRecordStore implements FallbackPlacementRecordStore {
  inner: FallbackPlacementRecordStore;
  cache: cache.TtlCache<FallbackPlacementRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: FallbackPlacementRecordStore,
    cacheValue: cache.TtlCache<FallbackPlacementRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): FallbackPlacementRecord | undefined {
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

  save(item: FallbackPlacementRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): FallbackPlacementRecord[] {
    return this.inner.list();
  }
}

export function newCachedFallbackPlacementRecordStore(inner: FallbackPlacementRecordStore, ttl: number, clockValue: clock.Clock): FallbackPlacementRecordStore {
  return new CachedFallbackPlacementRecordStore(
    inner,
    cache.newTtlCache<FallbackPlacementRecord>(128, ttl, clockValue),
    0,
    0,
  );
}

/** Selects fallback placement records. Empty fields match all. */
export class FallbackPlacementRecordQuery {
  title: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minMinimum: number, statuses: string[], limit: number) {
    this.title = title;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: FallbackPlacementRecord): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: FallbackPlacementRecord[]): FallbackPlacementRecord[] {
    const matched = collections.filter(items, (candidate: FallbackPlacementRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findFallbackPlacementRecords(store: FallbackPlacementRecordStore, query: FallbackPlacementRecordQuery): FallbackPlacementRecord[] {
  return query.apply(store.list());
}
