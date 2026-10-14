import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { RollingDoubleOptInRecord } from "./rolling-double-opt-in-record.js";

/** Keeps rolling double opt in records by code. */
export interface RollingDoubleOptInRecordStore {
  find(code: string): RollingDoubleOptInRecord | undefined;
  save(item: RollingDoubleOptInRecord): void;
  remove(code: string): boolean;
  list(): RollingDoubleOptInRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryRollingDoubleOptInRecordStore implements RollingDoubleOptInRecordStore {
  items: Map<string, RollingDoubleOptInRecord>;
  order: string[];

  constructor(items: Map<string, RollingDoubleOptInRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): RollingDoubleOptInRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: RollingDoubleOptInRecord): void {
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

  list(): RollingDoubleOptInRecord[] {
    const out: RollingDoubleOptInRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryRollingDoubleOptInRecordStore(): RollingDoubleOptInRecordStore {
  return new MemoryRollingDoubleOptInRecordStore(new Map<string, RollingDoubleOptInRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedRollingDoubleOptInRecordStore implements RollingDoubleOptInRecordStore {
  inner: RollingDoubleOptInRecordStore;
  cache: cache.TtlCache<RollingDoubleOptInRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: RollingDoubleOptInRecordStore,
    cacheValue: cache.TtlCache<RollingDoubleOptInRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): RollingDoubleOptInRecord | undefined {
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

  save(item: RollingDoubleOptInRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): RollingDoubleOptInRecord[] {
    return this.inner.list();
  }
}

export function newCachedRollingDoubleOptInRecordStore(inner: RollingDoubleOptInRecordStore, ttl: number, clockValue: clock.Clock): RollingDoubleOptInRecordStore {
  return new CachedRollingDoubleOptInRecordStore(
    inner,
    cache.newTtlCache<RollingDoubleOptInRecord>(64, ttl, clockValue),
    0,
    0,
  );
}

/** Selects rolling double opt in records. Empty fields match all. */
export class RollingDoubleOptInRecordQuery {
  locale: string;
  minMaximum: number;
  statuses: string[];
  limit: number;

  constructor(locale: string, minMaximum: number, statuses: string[], limit: number) {
    this.locale = locale;
    this.minMaximum = minMaximum;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: RollingDoubleOptInRecord): boolean {
    if (this.locale !== "" && text.normalize(item.locale) !== text.normalize(this.locale)) return false;
    if (item.maximum < this.minMaximum) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: RollingDoubleOptInRecord[]): RollingDoubleOptInRecord[] {
    const matched = collections.filter(items, (candidate: RollingDoubleOptInRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findRollingDoubleOptInRecords(store: RollingDoubleOptInRecordStore, query: RollingDoubleOptInRecordQuery): RollingDoubleOptInRecord[] {
  return query.apply(store.list());
}
