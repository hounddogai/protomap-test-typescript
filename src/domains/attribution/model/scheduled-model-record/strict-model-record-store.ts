import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { StrictModelRecord } from "./strict-model-record.js";

/** Keeps strict model records by code. */
export interface StrictModelRecordStore {
  find(code: string): StrictModelRecord | undefined;
  save(item: StrictModelRecord): void;
  remove(code: string): boolean;
  list(): StrictModelRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryStrictModelRecordStore implements StrictModelRecordStore {
  items: Map<string, StrictModelRecord>;
  order: string[];

  constructor(items: Map<string, StrictModelRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): StrictModelRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: StrictModelRecord): void {
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

  list(): StrictModelRecord[] {
    const out: StrictModelRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryStrictModelRecordStore(): StrictModelRecordStore {
  return new MemoryStrictModelRecordStore(new Map<string, StrictModelRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedStrictModelRecordStore implements StrictModelRecordStore {
  inner: StrictModelRecordStore;
  cache: cache.TtlCache<StrictModelRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: StrictModelRecordStore,
    cacheValue: cache.TtlCache<StrictModelRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): StrictModelRecord | undefined {
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

  save(item: StrictModelRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): StrictModelRecord[] {
    return this.inner.list();
  }
}

export function newCachedStrictModelRecordStore(inner: StrictModelRecordStore, ttl: number, clockValue: clock.Clock): StrictModelRecordStore {
  return new CachedStrictModelRecordStore(inner, cache.newTtlCache<StrictModelRecord>(128, ttl, clockValue), 0, 0);
}

/** Selects strict model records. Empty fields match all. */
export class StrictModelRecordQuery {
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

  matches(item: StrictModelRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.clicks < this.minClicks) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: StrictModelRecord[]): StrictModelRecord[] {
    const matched = collections.filter(items, (candidate: StrictModelRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findStrictModelRecords(store: StrictModelRecordStore, query: StrictModelRecordQuery): StrictModelRecord[] {
  return query.apply(store.list());
}
