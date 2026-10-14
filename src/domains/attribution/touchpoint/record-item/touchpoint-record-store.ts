import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { TouchpointRecord } from "./touchpoint-record.js";

/** Keeps touchpoint records by code. */
export interface TouchpointRecordStore {
  find(code: string): TouchpointRecord | undefined;
  save(item: TouchpointRecord): void;
  remove(code: string): boolean;
  list(): TouchpointRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryTouchpointRecordStore implements TouchpointRecordStore {
  items: Map<string, TouchpointRecord>;
  order: string[];

  constructor(items: Map<string, TouchpointRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): TouchpointRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: TouchpointRecord): void {
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

  list(): TouchpointRecord[] {
    const out: TouchpointRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryTouchpointRecordStore(): TouchpointRecordStore {
  return new MemoryTouchpointRecordStore(new Map<string, TouchpointRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedTouchpointRecordStore implements TouchpointRecordStore {
  inner: TouchpointRecordStore;
  cache: cache.TtlCache<TouchpointRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: TouchpointRecordStore,
    cacheValue: cache.TtlCache<TouchpointRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): TouchpointRecord | undefined {
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

  save(item: TouchpointRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): TouchpointRecord[] {
    return this.inner.list();
  }
}

export function newCachedTouchpointRecordStore(inner: TouchpointRecordStore, ttl: number, clockValue: clock.Clock): TouchpointRecordStore {
  return new CachedTouchpointRecordStore(inner, cache.newTtlCache<TouchpointRecord>(128, ttl, clockValue), 0, 0);
}

/** Selects touchpoint records. Empty fields match all. */
export class TouchpointRecordQuery {
  locale: string;
  minRevision: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minRevision: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minRevision = minRevision;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: TouchpointRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.revision < this.minRevision) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: TouchpointRecord[]): TouchpointRecord[] {
    const matched = collections.filter(items, (candidate: TouchpointRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findTouchpointRecords(store: TouchpointRecordStore, query: TouchpointRecordQuery): TouchpointRecord[] {
  return query.apply(store.list());
}
