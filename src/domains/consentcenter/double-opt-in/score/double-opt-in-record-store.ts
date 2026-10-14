import * as cache from "../../../../kit/cache.js";
import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";
import { DoubleOptInRecord } from "./double-opt-in-record.js";

/** Keeps double opt in records by code. */
export interface DoubleOptInRecordStore {
  find(code: string): DoubleOptInRecord | undefined;
  save(item: DoubleOptInRecord): void;
  remove(code: string): boolean;
  list(): DoubleOptInRecord[];
}

/** Keeps records in memory, in the order they were first saved. */
export class MemoryDoubleOptInRecordStore implements DoubleOptInRecordStore {
  items: Map<string, DoubleOptInRecord>;
  order: string[];

  constructor(items: Map<string, DoubleOptInRecord>, order: string[]) {
    this.items = items;
    this.order = order;
  }

  find(code: string): DoubleOptInRecord | undefined {
    const found = this.items.get(code);
    if (found === undefined) return undefined;
    return found;
  }

  save(item: DoubleOptInRecord): void {
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

  list(): DoubleOptInRecord[] {
    const out: DoubleOptInRecord[] = [];
    for (const key of this.order) {
      const found = this.items.get(key);
      if (found === undefined) continue;
      out.push(found);
    }
    return out;
  }
}

export function newMemoryDoubleOptInRecordStore(): DoubleOptInRecordStore {
  return new MemoryDoubleOptInRecordStore(new Map<string, DoubleOptInRecord>(), []);
}

/** Serves reads from a short-lived cache in front of another store. */
export class CachedDoubleOptInRecordStore implements DoubleOptInRecordStore {
  inner: DoubleOptInRecordStore;
  cache: cache.TtlCache<DoubleOptInRecord>;
  hits: number;
  misses: number;

  constructor(
    inner: DoubleOptInRecordStore,
    cacheValue: cache.TtlCache<DoubleOptInRecord>,
    hits: number,
    misses: number,
  ) {
    this.inner = inner;
    this.cache = cacheValue;
    this.hits = hits;
    this.misses = misses;
  }

  find(code: string): DoubleOptInRecord | undefined {
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

  save(item: DoubleOptInRecord): void {
    this.inner.save(item);
    this.cache.put(item.code, item);
  }

  remove(code: string): boolean {
    // A cached copy expires on its own; reads after a removal may still see it until then.
    return this.inner.remove(code);
  }

  list(): DoubleOptInRecord[] {
    return this.inner.list();
  }
}

export function newCachedDoubleOptInRecordStore(inner: DoubleOptInRecordStore, ttl: number, clockValue: clock.Clock): DoubleOptInRecordStore {
  return new CachedDoubleOptInRecordStore(inner, cache.newTtlCache<DoubleOptInRecord>(1024, ttl, clockValue), 0, 0);
}

/** Selects double opt in records. Empty fields match all. */
export class DoubleOptInRecordQuery {
  label: string;
  minUpdatedAt: number;
  statuses: string[];
  limit: number;

  constructor(label: string, minUpdatedAt: number, statuses: string[], limit: number) {
    this.label = label;
    this.minUpdatedAt = minUpdatedAt;
    this.statuses = statuses;
    this.limit = limit;
  }

  matches(item: DoubleOptInRecord): boolean {
    if (this.label !== "" && text.normalize(item.label) !== text.normalize(this.label)) return false;
    if (item.updatedAt < this.minUpdatedAt) return false;
    if (this.statuses.length > 0 && !this.statuses.includes(`${item.status}`)) return false;
    return true;
  }

  apply(items: DoubleOptInRecord[]): DoubleOptInRecord[] {
    const matched = collections.filter(items, (candidate: DoubleOptInRecord): boolean => this.matches(candidate));
    if (this.limit > 0 && matched.length > this.limit) return collections.take(matched, this.limit);
    return matched;
  }
}

export function findDoubleOptInRecords(store: DoubleOptInRecordStore, query: DoubleOptInRecordQuery): DoubleOptInRecord[] {
  return query.apply(store.list());
}
