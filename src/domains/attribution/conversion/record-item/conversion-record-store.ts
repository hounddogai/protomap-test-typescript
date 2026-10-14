import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { ConversionRecord } from "./conversion-record.js";

/** Keeps conversion records by code. */
export interface ConversionRecordStore {
  find(code: string): ConversionRecord | undefined;
  save(item: ConversionRecord): void;
  remove(code: string): boolean;
  list(): ConversionRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryConversionRecordStore implements ConversionRecordStore {
  items: Map<string, ConversionRecord>;
  order: string[];

  constructor(items: Map<string, ConversionRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): ConversionRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: ConversionRecord): void {
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

  list(): ConversionRecord[] {
    const out: ConversionRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryConversionRecordStore(): ConversionRecordStore {
  return new MemoryConversionRecordStore(new Map<string, ConversionRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedConversionRecordStore implements ConversionRecordStore {
  inner: ConversionRecordStore;
  cache: cache.TtlCache<ConversionRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: ConversionRecordStore,
    cacheValue: cache.TtlCache<ConversionRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): ConversionRecord | undefined {
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

  save(item: ConversionRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): ConversionRecord[] {
    return this.inner.list();
  }
}

export function newCachedConversionRecordStore(inner: ConversionRecordStore, ttl: number, clockValue: clock.Clock): ConversionRecordStore {
  return new CachedConversionRecordStore(inner, cache.newTtlCache<ConversionRecord>(1024, ttl, clockValue), 0, 0);
}

/** Selects conversion records. Empty fields match all. */
export class ConversionRecordQuery {
  title: string;
  minLimit: number;
  statuses: string[];
  limit: number;

  constructor(title: string, minLimit: number, statuses: string[], limit: number) {
    this.title = title;
    this.minLimit = minLimit;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: ConversionRecord): boolean {
    if (this.title !== "" && text.normalize(item.title) !== text.normalize(this.title)) return false;
    if (item.limit < this.minLimit) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: ConversionRecord[]): ConversionRecord[] {
    const matched = collections.filter(items, (candidate: ConversionRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findConversionRecords(store: ConversionRecordStore, query: ConversionRecordQuery): ConversionRecord[] {
  return query.apply(store.list());
}
