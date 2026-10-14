import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RegionalCreativeRecord } from "./regional-creative-record.js";

/** Keeps regional creative records by code. */
export interface RegionalCreativeRecordStore {
  find(code: string): RegionalCreativeRecord | undefined;
  save(item: RegionalCreativeRecord): void;
  remove(code: string): boolean;
  list(): RegionalCreativeRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRegionalCreativeRecordStore implements RegionalCreativeRecordStore {
  items: Map<string, RegionalCreativeRecord>;
  order: string[];

  constructor(items: Map<string, RegionalCreativeRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RegionalCreativeRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RegionalCreativeRecord): void {
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

  list(): RegionalCreativeRecord[] {
    const out: RegionalCreativeRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRegionalCreativeRecordStore(): RegionalCreativeRecordStore {
  return new MemoryRegionalCreativeRecordStore(new Map<string, RegionalCreativeRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRegionalCreativeRecordStore implements RegionalCreativeRecordStore {
  inner: RegionalCreativeRecordStore;
  cache: cache.TtlCache<RegionalCreativeRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: RegionalCreativeRecordStore,
    cacheValue: cache.TtlCache<RegionalCreativeRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RegionalCreativeRecord | undefined {
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

  save(item: RegionalCreativeRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RegionalCreativeRecord[] {
    return this.inner.list();
  }
}

export function newCachedRegionalCreativeRecordStore(inner: RegionalCreativeRecordStore, ttl: number, clockValue: clock.Clock): RegionalCreativeRecordStore {
  return new CachedRegionalCreativeRecordStore(
    inner,
    cache.newTtlCache<RegionalCreativeRecord>(512, ttl, clockValue),
    0,
    0,
  );
}

/** Selects regional creative records. Empty fields match all. */
export class RegionalCreativeRecordQuery {
  locale: string;
  minCreatedAt: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minCreatedAt: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minCreatedAt = minCreatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RegionalCreativeRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.createdAt < this.minCreatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RegionalCreativeRecord[]): RegionalCreativeRecord[] {
    const matched = collections.filter(items, (candidate: RegionalCreativeRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRegionalCreativeRecords(store: RegionalCreativeRecordStore, query: RegionalCreativeRecordQuery): RegionalCreativeRecord[] {
  return query.apply(store.list());
}
