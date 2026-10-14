import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DefaultCsatRecord } from "./default-csat-record.js";

/** Keeps default csat records by code. */
export interface DefaultCsatRecordStore {
  find(code: string): DefaultCsatRecord | undefined;
  save(item: DefaultCsatRecord): void;
  remove(code: string): boolean;
  list(): DefaultCsatRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDefaultCsatRecordStore implements DefaultCsatRecordStore {
  items: Map<string, DefaultCsatRecord>;
  order: string[];

  constructor(items: Map<string, DefaultCsatRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DefaultCsatRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DefaultCsatRecord): void {
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

  list(): DefaultCsatRecord[] {
    const out: DefaultCsatRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDefaultCsatRecordStore(): DefaultCsatRecordStore {
  return new MemoryDefaultCsatRecordStore(new Map<string, DefaultCsatRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDefaultCsatRecordStore implements DefaultCsatRecordStore {
  inner: DefaultCsatRecordStore;
  cache: cache.TtlCache<DefaultCsatRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: DefaultCsatRecordStore,
    cacheValue: cache.TtlCache<DefaultCsatRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DefaultCsatRecord | undefined {
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

  save(item: DefaultCsatRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DefaultCsatRecord[] {
    return this.inner.list();
  }
}

export function newCachedDefaultCsatRecordStore(inner: DefaultCsatRecordStore, ttl: number, clockValue: clock.Clock): DefaultCsatRecordStore {
  return new CachedDefaultCsatRecordStore(inner, cache.newTtlCache<DefaultCsatRecord>(128, ttl, clockValue), 0, 0);
}

/** Selects default csat records. Empty fields match all. */
export class DefaultCsatRecordQuery {
  locale: string;
  minMinimum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMinimum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMinimum = minMinimum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DefaultCsatRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.minimum < this.minMinimum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DefaultCsatRecord[]): DefaultCsatRecord[] {
    const matched = collections.filter(items, (candidate: DefaultCsatRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDefaultCsatRecords(store: DefaultCsatRecordStore, query: DefaultCsatRecordQuery): DefaultCsatRecord[] {
  return query.apply(store.list());
}
