import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PlacementRecord } from "./placement-record.js";

/** Keeps placement records by code. */
export interface PlacementRecordStore {
  find(code: string): PlacementRecord | undefined;
  save(item: PlacementRecord): void;
  remove(code: string): boolean;
  list(): PlacementRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPlacementRecordStore implements PlacementRecordStore {
  items: Map<string, PlacementRecord>;
  order: string[];

  constructor(items: Map<string, PlacementRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PlacementRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PlacementRecord): void {
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

  list(): PlacementRecord[] {
    const out: PlacementRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPlacementRecordStore(): PlacementRecordStore {
  return new MemoryPlacementRecordStore(new Map<string, PlacementRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPlacementRecordStore implements PlacementRecordStore {
  inner: PlacementRecordStore;
  cache: cache.TtlCache<PlacementRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: PlacementRecordStore,
    cacheValue: cache.TtlCache<PlacementRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PlacementRecord | undefined {
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

  save(item: PlacementRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PlacementRecord[] {
    return this.inner.list();
  }
}

export function newCachedPlacementRecordStore(inner: PlacementRecordStore, ttl: number, clockValue: clock.Clock): PlacementRecordStore {
  return new CachedPlacementRecordStore(inner, cache.newTtlCache<PlacementRecord>(256, ttl, clockValue), 0, 0);
}

/** Selects placement records. Empty fields match all. */
export class PlacementRecordQuery {
  name: string;
  minConversionRate: number;
  statuses: string[];
  limit: number;

  constructor(name: string, minConversionRate: number, statuses: string[], limit: number) {
    this.name = name;
    this.minConversionRate = minConversionRate;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PlacementRecord): boolean {
    if (this.name !== "" && text.normalize(item.name) !== text.normalize(this.name)) return false;
    if (item.conversionRate < this.minConversionRate) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PlacementRecord[]): PlacementRecord[] {
    const matched = collections.filter(items, (candidate: PlacementRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPlacementRecords(store: PlacementRecordStore, query: PlacementRecordQuery): PlacementRecord[] {
  return query.apply(store.list());
}
