import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { PrimaryPathRecord } from "./primary-path-record.js";

/** Keeps primary path records by code. */
export interface PrimaryPathRecordStore {
  find(code: string): PrimaryPathRecord | undefined;
  save(item: PrimaryPathRecord): void;
  remove(code: string): boolean;
  list(): PrimaryPathRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryPrimaryPathRecordStore implements PrimaryPathRecordStore {
  items: Map<string, PrimaryPathRecord>;
  order: string[];

  constructor(items: Map<string, PrimaryPathRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): PrimaryPathRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: PrimaryPathRecord): void {
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

  list(): PrimaryPathRecord[] {
    const out: PrimaryPathRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryPrimaryPathRecordStore(): PrimaryPathRecordStore {
  return new MemoryPrimaryPathRecordStore(new Map<string, PrimaryPathRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedPrimaryPathRecordStore implements PrimaryPathRecordStore {
  inner: PrimaryPathRecordStore;
  cache: cache.TtlCache<PrimaryPathRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: PrimaryPathRecordStore,
    cacheValue: cache.TtlCache<PrimaryPathRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): PrimaryPathRecord | undefined {
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

  save(item: PrimaryPathRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): PrimaryPathRecord[] {
    return this.inner.list();
  }
}

export function newCachedPrimaryPathRecordStore(inner: PrimaryPathRecordStore, ttl: number, clockValue: clock.Clock): PrimaryPathRecordStore {
  return new CachedPrimaryPathRecordStore(inner, cache.newTtlCache<PrimaryPathRecord>(64, ttl, clockValue), 0, 0);
}

/** Selects primary path records. Empty fields match all. */
export class PrimaryPathRecordQuery {
  country: string;
  minImpressions: number;
  statuses: string[];
  limit: number;

  constructor(country: string, minImpressions: number, statuses: string[], limit: number) {
    this.country = country;
    this.minImpressions = minImpressions;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: PrimaryPathRecord): boolean {
    if (this.country !== "" && text.normalize(item.country) !== text.normalize(this.country)) return false;
    if (item.impressions < this.minImpressions) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: PrimaryPathRecord[]): PrimaryPathRecord[] {
    const matched = collections.filter(items, (candidate: PrimaryPathRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findPrimaryPathRecords(store: PrimaryPathRecordStore, query: PrimaryPathRecordQuery): PrimaryPathRecord[] {
  return query.apply(store.list());
}
