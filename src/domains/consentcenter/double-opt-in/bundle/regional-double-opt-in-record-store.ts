import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalDoubleOptInRecord } from "./regional-double-opt-in-record.js";

/** Keeps regional double opt in records by code. */
export interface RegionalDoubleOptInRecordStore {
  find(code: string): RegionalDoubleOptInRecord | undefined;
  save(item: RegionalDoubleOptInRecord): void;
  remove(code: string): boolean;
  list(): RegionalDoubleOptInRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalDoubleOptInRecordStore implements RegionalDoubleOptInRecordStore {
  items: Map<string, RegionalDoubleOptInRecord>;
  order: string[];

  constructor(items: Map<string, RegionalDoubleOptInRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalDoubleOptInRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalDoubleOptInRecord): void {
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

  list(): RegionalDoubleOptInRecord[] {
    const out: RegionalDoubleOptInRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalDoubleOptInRecordStore(): RegionalDoubleOptInRecordStore {
  return new MemoryRegionalDoubleOptInRecordStore(new Map<string, RegionalDoubleOptInRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalDoubleOptInRecordStore implements RegionalDoubleOptInRecordStore {
  inner: RegionalDoubleOptInRecordStore;
  cache: cache.TtlCache<RegionalDoubleOptInRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalDoubleOptInRecordStore,
    cacheValue: cache.TtlCache<RegionalDoubleOptInRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalDoubleOptInRecord | undefined {
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

  save(item: RegionalDoubleOptInRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalDoubleOptInRecord[] {
    return this.inner.list();
  }
}

export function newCachedRegionalDoubleOptInRecordStore(inner: RegionalDoubleOptInRecordStore, ttl: number, clockValue: clock.Clock): RegionalDoubleOptInRecordStore {
  return new CachedRegionalDoubleOptInRecordStore(
    inner,
    cache.newTtlCache<RegionalDoubleOptInRecord>(1024, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional double opt in records. Empty fields match all. */
export class RegionalDoubleOptInRecordQuery {
  title: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.title = title;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalDoubleOptInRecord): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalDoubleOptInRecord[]): RegionalDoubleOptInRecord[] {
    const matched = collections.filter(items, (candidate: RegionalDoubleOptInRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalDoubleOptInRecords(store: RegionalDoubleOptInRecordStore, query: RegionalDoubleOptInRecordQuery): RegionalDoubleOptInRecord[] {
  return query.apply(store.list());
}
