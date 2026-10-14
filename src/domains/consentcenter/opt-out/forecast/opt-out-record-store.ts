import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { OptOutRecord } from "./opt-out-record.js";

/** Keeps opt out records by code. */
export interface OptOutRecordStore {
  find(code: string): OptOutRecord | undefined;
  save(item: OptOutRecord): void;
  remove(code: string): boolean;
  list(): OptOutRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryOptOutRecordStore implements OptOutRecordStore {
  items: Map<string, OptOutRecord>;
  order: string[];

  constructor(items: Map<string, OptOutRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): OptOutRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: OptOutRecord): void {
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

  list(): OptOutRecord[] {
    const out: OptOutRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryOptOutRecordStore(): OptOutRecordStore {
  return new MemoryOptOutRecordStore(new Map<string, OptOutRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedOptOutRecordStore implements OptOutRecordStore {
  inner: OptOutRecordStore;
  cache: cache.TtlCache<OptOutRecord>;
  hits: number;
  misses: number;

  constructor(inner: OptOutRecordStore, cacheValue: cache.TtlCache<OptOutRecord>, hits: number, misses: number) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): OptOutRecord | undefined {
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

  save(item: OptOutRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): OptOutRecord[] {
    return this.inner.list();
  }
}

export function newCachedOptOutRecordStore(inner: OptOutRecordStore, ttl: number, clockValue: clock.Clock): OptOutRecordStore {
  return new CachedOptOutRecordStore(inner, cache.newTtlCache<OptOutRecord>(512, ttl, clockValue), 0, 0);
}

/** Selects opt out records. Empty fields match all. */
export class OptOutRecordQuery {
  locale: string;
  minClicks: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minClicks: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minClicks = minClicks;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: OptOutRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: OptOutRecord[]): OptOutRecord[] {
    const matched = collections.filter(items, (candidate: OptOutRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findOptOutRecords(store: OptOutRecordStore, query: OptOutRecordQuery): OptOutRecord[] {
  return query.apply(store.list());
}
